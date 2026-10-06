'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendStudentNotification } from '@/lib/paymentNotifier';
import { getKeyDetails } from '@/lib/geminiKeyRotation';
import { checkRateLimit } from '@/lib/rateLimiter';
import { hasPermission, type AdminPermission } from '@/lib/adminPermissions';

export type { AdminPermission };

const ADMIN_COOKIE_NAME = 'temari_admin_session';

// ─── Crypto Helpers (Web Crypto API — Edge-compatible, no extra deps) ─────────

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/** Derives a 256-bit AES-GCM key from the bot token (same approach as session.ts) */
async function getAdminSecretKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.TELEGRAM_BOT_TOKEN;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security] ADMIN_SESSION_SECRET or TELEGRAM_BOT_TOKEN must be configured in production.');
    }
    console.warn('[Security] Using development fallback secret for admin session encryption.');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('admin-fallback-secret-32-bytes!!:admin'));
    return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret + ':admin'));
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** AES-GCM encrypt an object → hex string */
async function encryptAdminSession(data: object): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getAdminSecretKey();
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encryptedBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return `${bufferToHex(iv.buffer)}:${bufferToHex(encryptedBuf)}`;
}

/** AES-GCM decrypt hex string → object */
async function decryptAdminSession(token: string): Promise<{ id: string; username: string; role: string } | null> {
  try {
    const parts = token.split(':');
    if (parts.length !== 2) return null;
    const iv = hexToBuffer(parts[0]);
    const encryptedBuf = hexToBuffer(parts[1]);
    const key = await getAdminSecretKey();
    const decryptedBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedBuf);
    return JSON.parse(new TextDecoder().decode(decryptedBuf));
  } catch {
    return null;
  }
}

/**
 * Hash a passcode using SHA-256 for secure comparison.
 * We don't use bcrypt here to stay Edge-runtime compatible (no Node.js deps).
 * The hash is salted with the username to prevent rainbow table attacks.
 */
async function hashPasscode(username: string, passcode: string): Promise<string> {
  const salt = process.env.ADMIN_SALT || process.env.TELEGRAM_BOT_TOKEN;
  if (!salt) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security] ADMIN_SALT or TELEGRAM_BOT_TOKEN must be configured in production.');
    }
    const data = new TextEncoder().encode(`admin-salt-fallback:${username}:${passcode}`);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hash);
  }
  const data = new TextEncoder().encode(`${salt}:${username}:${passcode}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─── Public Actions ────────────────────────────────────────────────────────────

export async function loginAdmin(username: string, passcode: string) {
  const normalizedUsername = (username || '').trim().toLowerCase();
  if (!normalizedUsername || !passcode) {
    return { success: false, error: 'Invalid username or password' };
  }

  // Rate limiting to mitigate brute-force attacks (M-04)
  let clientIp = 'unknown';
  try {
    const headersList = headers();
    clientIp = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  } catch {
    // Graceful fallback outside HTTP request context (e.g. tests)
  }

  // Max 5 attempts per 15 minutes per username + IP
  const userRateLimit = await checkRateLimit(`admin_login:${normalizedUsername}:${clientIp}`, 5, 15 * 60_000);
  if (!userRateLimit.allowed) {
    const waitMinutes = Math.max(1, Math.ceil(userRateLimit.resetInMs / 60_000));
    return {
      success: false,
      error: `Too many login attempts. Please try again in ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}.`
    };
  }

  // Max 15 attempts per 15 minutes globally per IP to prevent multi-account spray
  if (clientIp !== 'unknown') {
    const ipRateLimit = await checkRateLimit(`admin_login:ip:${clientIp}`, 15, 15 * 60_000);
    if (!ipRateLimit.allowed) {
      const waitMinutes = Math.max(1, Math.ceil(ipRateLimit.resetInMs / 60_000));
      return {
        success: false,
        error: `Too many login attempts from this network. Please try again in ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}.`
      };
    }
  }

  const supabase = await createAdminClient();
  
  let admin: any = null;
  const { data: adminWithActive, error: activeErr } = await supabase
    .from('admin_users')
    .select('id, username, role, passcode, is_active')
    .ilike('username', normalizedUsername)
    .single();

  if (activeErr) {
    // Graceful fallback if is_active column migration hasn't been executed yet
    const { data: fallback, error: fbErr } = await supabase
      .from('admin_users')
      .select('id, username, role, passcode')
      .ilike('username', normalizedUsername)
      .single();

    if (fbErr || !fallback) {
      return { success: false, error: 'Invalid username or password' };
    }
    admin = { ...fallback, is_active: true };
  } else {
    admin = adminWithActive;
  }

  if (!admin) {
    return { success: false, error: 'Invalid username or password' };
  }

  if (admin.is_active === false) {
    return { success: false, error: 'This account has been deactivated. Please contact a superadmin.' };
  }

  // Compare using hashed passcode. Falls back to plaintext comparison for
  // legacy accounts that were created before hashing, but automatically
  // migrates them to the salted hash on successful login.
  const hashedInput = await hashPasscode(username, passcode);
  const isHashMatch = constantTimeEqual(admin.passcode, hashedInput);
  const isPlaintextMatch = constantTimeEqual(admin.passcode, passcode); // legacy fallback

  if (!isHashMatch && !isPlaintextMatch) {
    return { success: false, error: 'Invalid username or password' };
  }

  // Auto-upgrade legacy plaintext password to secure hash in DB
  if (isPlaintextMatch && !isHashMatch) {
    try {
      await supabase
        .from('admin_users')
        .update({ passcode: hashedInput })
        .eq('id', admin.id);
    } catch (migrateErr) {
      console.error('[Admin Auth] Failed to auto-migrate legacy password to hash:', migrateErr);
    }
  }

  // Encrypt the session — no longer base64 encoded
  const sessionToken = await encryptAdminSession({
    id: admin.id,
    username: admin.username,
    role: admin.role,
  });

  cookies().set({
    name: ADMIN_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 day
  });

  return { success: true };
}

export async function verifyAdmin() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await decryptAdminSession(token);
  if (!session?.id) return null;

  // Always verify against DB so role changes apply instantly
  const supabase = await createAdminClient();
  let admin: any = null;
  const { data: adminWithActive, error: activeErr } = await supabase
    .from('admin_users')
    .select('id, username, role, is_active')
    .eq('id', session.id)
    .single();

  if (activeErr) {
    const { data: fallback } = await supabase
      .from('admin_users')
      .select('id, username, role')
      .eq('id', session.id)
      .single();
    if (!fallback) return null;
    admin = { ...fallback, is_active: true };
  } else {
    admin = adminWithActive;
  }
  
  if (!admin || admin.is_active === false) return null;

  return admin;
}

export async function logoutAdmin() {
  cookies().set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    expires: new Date(0),
    path: '/'
  });
  return { success: true };
}

// ─── Scoped Permissions & Audit Logging (ADM-04, ADM-05) ─────────────────────

export async function logAdminAction(
  admin: { id: string; username: string },
  action: string,
  options?: { target_resource?: string; target_id?: string; details?: any; ip_address?: string }
) {
  try {
    const supabase = await createAdminClient();
    await supabase.from('admin_audit_logs').insert({
      admin_id: admin.id,
      admin_username: admin.username,
      action,
      target_resource: options?.target_resource,
      target_id: options?.target_id,
      details: options?.details || {},
      ip_address: options?.ip_address,
    });
  } catch (err) {
    console.warn('[AdminAudit] Failed recording audit log:', err);
  }
}

/**
 * Creates a new admin account. Passcode is stored as a salted SHA-256 hash.
 */
export async function createAdminAccount(username: string, passcode: string, role: string) {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'admin:manage')) {
    throw new Error('Unauthorized: Only Superadmins can create accounts.');
  }

  const hashedPasscode = await hashPasscode(username, passcode);

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('admin_users')
    .insert({ username, passcode: hashedPasscode, role });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Username already exists.' };
    return { success: false, error: error.message };
  }

  await logAdminAction(admin!, 'admin:create', {
    target_resource: 'admin_users',
    target_id: username,
    details: { role },
  });

  return { success: true };
}

export async function getAdmins() {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'admin:manage')) throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, role, is_active, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    const { data: fallback, error: fbErr } = await supabase
      .from('admin_users')
      .select('id, username, role, created_at')
      .order('created_at', { ascending: true });
    if (fbErr) throw fbErr;
    return (fallback || []).map((a: any) => ({ ...a, is_active: true }));
  }
  return data || [];
}

/**
 * Deletes an admin account. Requires superadmin role.
 * Superadmins cannot delete their own account.
 */
export async function deleteAdminAccount(targetAdminId: string) {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'admin:manage')) {
    throw new Error('Unauthorized: Only Superadmins can delete accounts.');
  }

  if (admin?.id === targetAdminId) {
    return { success: false, error: 'You cannot delete your own admin account.' };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', targetAdminId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAdminAction(admin!, 'admin:delete', {
    target_resource: 'admin_users',
    target_id: targetAdminId,
  });

  revalidatePath('/admin/managers');
  return { success: true };
}

/**
 * Toggles an admin account active/deactivated status. Requires superadmin role.
 * Superadmins cannot deactivate their own account.
 */
export async function toggleAdminActive(targetAdminId: string, isActive: boolean) {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'admin:manage')) {
    throw new Error('Unauthorized: Only Superadmins can modify account status.');
  }

  if (admin?.id === targetAdminId && !isActive) {
    return { success: false, error: 'You cannot deactivate your own admin account.' };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('admin_users')
    .update({ is_active: isActive })
    .eq('id', targetAdminId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAdminAction(admin!, isActive ? 'admin:activate' : 'admin:deactivate', {
    target_resource: 'admin_users',
    target_id: targetAdminId,
    details: { is_active: isActive },
  });

  revalidatePath('/admin/managers');
  return { success: true };
}
export async function getAdminStats() {

  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  
  const [usersReq, notesReq, questionsReq, premiumReq] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('study_notes').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'premium'),
  ]);

  return {
    totalUsers: usersReq.count || 0,
    totalNotes: notesReq.count || 0,
    totalQuestions: questionsReq.count || 0,
    totalPremium: premiumReq.count || 0,
  };
}

export async function getUsers(page = 1, limit = 50) {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  return {
    users: data || [],
    total: count || 0,
    page,
    totalPages: count ? Math.ceil(count / limit) : 0
  };
}

export async function getQuestions(limit = 100) {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'questions:read')) throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('questions')
    .select('id, exam_type, subject, year_ec, question, option_a, option_b, option_c, option_d, answer, explanation')
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function saveQuestion(payload: {
  id?: string;
  exam_type: string;
  subject: string;
  year_ec?: number | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: string;
  explanation?: string | null;
}) {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'questions:write')) {
    throw new Error('Unauthorized: Only editors and superadmins can save questions.');
  }

  const supabase = await createAdminClient();
  const normalizedAnswer = (payload.answer || 'A').trim().toUpperCase();

  const questionData = {
    exam_type: payload.exam_type,
    subject: payload.subject,
    year_ec: payload.year_ec ? Number(payload.year_ec) : null,
    question: (payload.question || '').trim(),
    option_a: (payload.option_a || '').trim(),
    option_b: (payload.option_b || '').trim(),
    option_c: (payload.option_c || '').trim(),
    option_d: (payload.option_d || '').trim(),
    answer: normalizedAnswer,
    explanation: payload.explanation?.trim() || null,
  };

  if (payload.id) {
    const { error } = await supabase
      .from('questions')
      .update(questionData)
      .eq('id', payload.id);

    if (error) return { success: false, error: error.message };

    await logAdminAction(admin!, 'question:update', {
      target_resource: 'questions',
      target_id: payload.id,
      details: { subject: payload.subject, exam_type: payload.exam_type },
    });
  } else {
    const { data, error } = await supabase
      .from('questions')
      .insert(questionData)
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };

    await logAdminAction(admin!, 'question:create', {
      target_resource: 'questions',
      target_id: data?.id,
      details: { subject: payload.subject, exam_type: payload.exam_type },
    });
  }

  revalidatePath('/admin/questions');
  return { success: true };
}

export async function deleteQuestion(questionId: string) {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'questions:write')) {
    throw new Error('Unauthorized: Only editors and superadmins can delete questions.');
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) return { success: false, error: error.message };

  await logAdminAction(admin!, 'question:delete', {
    target_resource: 'questions',
    target_id: questionId,
  });

  revalidatePath('/admin/questions');
  return { success: true };
}

export async function bulkImportQuestions(questions: Array<{
  exam_type: string;
  subject: string;
  year_ec?: number | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: string;
  explanation?: string | null;
}>) {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'questions:write')) {
    throw new Error('Unauthorized: Only editors and superadmins can import questions.');
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return { success: false, error: 'No valid questions provided for import.' };
  }

  const validRows = questions
    .filter(q => q.question && q.subject && q.exam_type && q.option_a && q.option_b && q.answer)
    .map(q => ({
      exam_type: q.exam_type,
      subject: q.subject,
      year_ec: q.year_ec ? Number(q.year_ec) : null,
      question: q.question.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: (q.option_c || '').trim(),
      option_d: (q.option_d || '').trim(),
      answer: (q.answer || 'A').trim().toUpperCase(),
      explanation: q.explanation?.trim() || null,
    }));

  if (validRows.length === 0) {
    return { success: false, error: 'All rows were missing required fields.' };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from('questions').insert(validRows);

  if (error) return { success: false, error: error.message };

  await logAdminAction(admin!, 'question:bulk_import', {
    target_resource: 'questions',
    details: { count: validRows.length },
  });

  revalidatePath('/admin/questions');
  return { success: true, count: validRows.length };
}

export async function getPendingPayments(page = 1, limit = 50) {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');

  const offset = (page - 1) * limit;
  const supabase = await createAdminClient();
  
  // Join with profiles to get user info
  const { data, error, count } = await supabase
    .from('payment_receipts')
    .select(`
      id,
      telegram_id,
      transaction_id,
      receipt_url,
      status,
      created_at,
      profiles (
        full_name,
        username
      )
    `, { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  // Ensure all receipts (including older ones from when bucket was public) have valid signed URLs
  const payments = await Promise.all(
    (data || []).map(async (payment) => {
      let url = payment.receipt_url;
      if (url && (url.includes('/public/receipts/') || !url.includes('token='))) {
        try {
          const rawPart = url.split('/receipts/')[1];
          const fileName = rawPart ? rawPart.split('?')[0] : '';
          if (fileName) {
            const { data: signed } = await supabase.storage
              .from('receipts')
              .createSignedUrl(decodeURIComponent(fileName), 60 * 60 * 24);
            if (signed?.signedUrl) {
              url = signed.signedUrl;
            }
          }
        } catch {
          // Keep original url if signed URL generation fails
        }
      }
      return { ...payment, receipt_url: url };
    })
  );

  return {
    payments,
    total: count || 0,
    page,
    totalPages: count ? Math.ceil(count / limit) : 0
  };
}

export async function updatePaymentStatus(paymentId: string, telegramId: string, status: 'approved' | 'rejected') {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');
  
  if (!hasPermission(admin, status === 'approved' ? 'payments:approve' : 'payments:reject')) {
    throw new Error('Unauthorized: Only superadmin or financial_admin accounts can approve or reject payments.');
  }

  const supabase = await createAdminClient();
  
  // 1. Update the receipt status
  const { error: updateError } = await supabase
    .from('payment_receipts')
    .update({ status })
    .eq('id', paymentId);
    
  if (updateError) throw updateError;
  
  // 2. If approved, upgrade the user to premium
  if (status === 'approved') {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'premium' })
      .eq('telegram_id', telegramId);
      
    if (profileError) {
      // Revert if profile update fails to avoid inconsistent state
      await supabase.from('payment_receipts').update({ status: 'pending' }).eq('id', paymentId);
      throw profileError;
    }

    // Auto-resolve any other duplicate pending receipts from this user
    await supabase
      .from('payment_receipts')
      .update({ status: 'approved' })
      .eq('telegram_id', telegramId)
      .eq('status', 'pending');
  }
  
  // 3. Notify student on Telegram
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('telegram_id', telegramId)
      .single();
    const studentName = profile?.full_name?.split(' ')[0] ?? 'Student';
    await sendStudentNotification(telegramId, status === 'approved', studentName);
  } catch (notifyErr) {
    console.error('[Admin Update Payment] Failed to send Telegram notification:', notifyErr);
  }

  // 4. Auto-purge image from Supabase storage to keep Free Tier clean
  try {
    const { data: receipt } = await supabase
      .from('payment_receipts')
      .select('receipt_url')
      .eq('id', paymentId)
      .single();
    if (receipt?.receipt_url) {
      const rawPart = receipt.receipt_url.split('/receipts/')[1];
      const fileName = rawPart ? rawPart.split('?')[0] : '';
      if (fileName) {
        await supabase.storage.from('receipts').remove([decodeURIComponent(fileName)]);
      }
    }
  } catch (storageErr) {
    console.warn('[Admin Update Payment] Storage image purge error:', storageErr);
  }

  // 5. Record Audit Log
  await logAdminAction(admin, `payment:${status}`, {
    target_resource: 'payment_receipts',
    target_id: paymentId,
    details: { telegram_id: telegramId, status },
  });

  return { success: true };
}

export async function getAdminAIStats() {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');

  const supabase = await createAdminClient();

  // 1. Fetch user AI usage from profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('telegram_id, full_name, username, subscription_status, ai_weekly_usage, ai_quota_reset_at, created_at')
    .gt('ai_weekly_usage', 0)
    .order('ai_weekly_usage', { ascending: false })
    .limit(50);

  // 2. Fetch total count of ai_responses_cache
  const { count: cacheCount } = await supabase
    .from('ai_responses_cache')
    .select('*', { count: 'exact', head: true });

  // 3. Fetch recent ai_responses_cache entries
  const { data: recentCache } = await supabase
    .from('ai_responses_cache')
    .select('question_id, prompt_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  // 4. Fetch Gemini Vision stats from payment_receipts
  const { data: visionReceipts } = await supabase
    .from('payment_receipts')
    .select('id, gemini_amount, gemini_sender, gemini_flagged, status, created_at')
    .not('gemini_amount', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  const { count: totalReceiptsScanned } = await supabase
    .from('payment_receipts')
    .select('*', { count: 'exact', head: true })
    .not('gemini_amount', 'is', null);

  const { count: flaggedReceiptsCount } = await supabase
    .from('payment_receipts')
    .select('*', { count: 'exact', head: true })
    .eq('gemini_flagged', true);

  // 5. Total all-time users with AI usage
  const { count: activeAiUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('ai_weekly_usage', 0);

  const userList = profiles || [];
  const totalWeeklyInquiries = userList.reduce((acc, p) => acc + (p.ai_weekly_usage || 0), 0);
  const freeTierInquiries = userList.filter(p => p.subscription_status !== 'premium').reduce((acc, p) => acc + (p.ai_weekly_usage || 0), 0);
  const premiumTierInquiries = userList.filter(p => p.subscription_status === 'premium').reduce((acc, p) => acc + (p.ai_weekly_usage || 0), 0);

  // 6. Gemini Key Pool telemetry from geminiKeyRotation
  const keyDetails = getKeyDetails();

  return {
    keyDetails,
    usage: {
      totalWeeklyInquiries,
      freeTierInquiries,
      premiumTierInquiries,
      activeAiUsersCount: activeAiUsersCount || 0,
      topAiUsers: userList,
    },
    cache: {
      totalCached: cacheCount || 0,
      recentEntries: recentCache || [],
      estimatedTokensSaved: (cacheCount || 0) * 850,
    },
    vision: {
      totalScanned: totalReceiptsScanned || 0,
      flaggedCount: flaggedReceiptsCount || 0,
      recentScans: visionReceipts || [],
    },
  };
}

export async function resetUserAIQuota(telegramId: string) {
  const admin = await verifyAdmin();
  if (!admin) throw new Error('Unauthorized');
  if (admin.role === 'readonly') throw new Error('Unauthorized: Readonly admins cannot modify user quotas.');

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({ ai_weekly_usage: 0, updated_at: new Date().toISOString() })
    .eq('telegram_id', telegramId);

  if (error) throw error;
  return { success: true };
}
