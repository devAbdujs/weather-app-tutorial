'use server';

import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';

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
  const secret = (process.env.TELEGRAM_BOT_TOKEN || 'admin-fallback-secret-32-bytes!!');
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
  const salt = process.env.TELEGRAM_BOT_TOKEN || 'admin-salt-fallback';
  const data = new TextEncoder().encode(`${salt}:${username}:${passcode}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}

// ─── Public Actions ────────────────────────────────────────────────────────────

export async function loginAdmin(username: string, passcode: string) {
  const supabase = await createAdminClient();
  
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('id, username, role, passcode')
    .eq('username', username)
    .single();

  if (error || !admin) {
    return { success: false, error: 'Invalid username or password' };
  }

  // Compare using hashed passcode. Falls back to plaintext comparison for
  // existing accounts that were created before hashing was introduced —
  // those admins will need to reset their passcode via the Managers page.
  const hashedInput = await hashPasscode(username, passcode);
  const isHashMatch = admin.passcode === hashedInput;
  const isPlaintextMatch = admin.passcode === passcode; // legacy fallback

  if (!isHashMatch && !isPlaintextMatch) {
    return { success: false, error: 'Invalid username or password' };
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
    sameSite: 'lax',
    path: '/admin',
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
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, username, role')
    .eq('id', session.id)
    .single();
  
  return admin || null;
}

export async function logoutAdmin() {
  cookies().set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    expires: new Date(0),
    path: '/admin'
  });
  return { success: true };
}

/**
 * Creates a new admin account. Passcode is stored as a salted SHA-256 hash.
 */
export async function createAdminAccount(username: string, passcode: string, role: string) {
  const admin = await verifyAdmin();
  if (admin?.role !== 'superadmin') throw new Error('Unauthorized: Only Superadmins can create accounts.');

  const hashedPasscode = await hashPasscode(username, passcode);

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('admin_users')
    .insert({ username, passcode: hashedPasscode, role });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Username already exists.' };
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getAdmins() {
  const admin = await verifyAdmin();
  if (admin?.role !== 'superadmin') throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
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
  if (!admin) throw new Error('Unauthorized');

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('questions')
    .select('id, exam_type, subject, year_ec, question_text, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
