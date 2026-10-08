'use server';
import { calculateNewStreak, getAddisAbabaDate } from '@/lib/streak';
import { calculateReferralAttribution, type PaymentReceiptRecord } from '@/lib/referral';

import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { getServerSession, encryptSession, getSessionCookieOptions } from '@/lib/session';
import { cookies } from 'next/headers';

/**
 * Updates the user's onboarding preferences.
 * Protected by encrypted HTTP-only session cookie.
 */
export async function updateProfilePreferences(target_exam: string, stream: string) {
  const session = await getServerSession();
  if (!session?.telegram_id) throw new Error('Unauthorized');

  if (!session.devMode) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ target_exam, stream })
      .eq('telegram_id', session.telegram_id);

    if (error) throw new Error(error.message);
  }

  // Re-issue session cookie with new preferences for instant root hydration
  const newToken = await encryptSession({
    ...session,
    target_exam,
    stream
  });

  cookies().set({
    name: 'es_session',
    value: newToken,
    ...getSessionCookieOptions(),
  });

  return { success: true };
}

/**
 * Toggles a saved mistake (bookmark).
 */
export async function toggleSavedMistake(question_id: string, isSaved: boolean) {
  const session = await getServerSession();
  if (!session?.telegram_id) throw new Error('Unauthorized');

  const supabase = await createClient();
  if (isSaved) {
    await supabase
      .from('saved_mistakes')
      .delete()
      .eq('question_id', question_id)
      .eq('telegram_id', session.telegram_id);
  } else {
    await supabase
      .from('saved_mistakes')
      .insert({ question_id, telegram_id: session.telegram_id });
  }
  return { success: true };
}


/**
 * Updates the daily streak for the authenticated user.
 */
export async function updateDailyStreak() {
  const session = await getServerSession();
  if (!session?.telegram_id) throw new Error('Unauthorized');

  const supabase = await createClient();
  
  // Fetch current streak
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_streak, last_activity_date, full_name, username')
    .eq('telegram_id', session.telegram_id)
    .maybeSingle();

  const today = getAddisAbabaDate();
  
  const { newStreak, isUpdated } = calculateNewStreak(
    profile?.daily_streak || 0,
    profile?.last_activity_date,
    today
  );

  if (!isUpdated) return { success: true, streak: newStreak };

  await supabase.from('profiles').update({
    daily_streak: newStreak,
    last_activity_date: today,
  }).eq('telegram_id', session.telegram_id);

  return { success: true, streak: newStreak };
}

/**
 * Fetches the user's saved mistakes.
 */
export async function getSavedMistakes() {
  const session = await getServerSession();
  if (!session?.telegram_id) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { data } = await supabase
    .from('saved_mistakes')
    .select('question_id')
    .eq('telegram_id', session.telegram_id);
    
  return data?.map(d => d.question_id) || [];
}

/**
 * Logs out the user by clearing the HttpOnly session cookie across root and subdomains.
 */
export async function logout() {
  const cookieOptions = getSessionCookieOptions();

  // 1. Clear with domain (e.g. .temari.top) if set
  if (cookieOptions.domain) {
    cookies().set({
      name: 'es_session',
      value: '',
      ...cookieOptions,
      maxAge: 0,
      expires: new Date(0),
    });
    cookies().set({
      name: 'temari_portal',
      value: '',
      domain: cookieOptions.domain,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }

  // 2. Clear host-only cookie (without domain)
  cookies().set({
    name: 'es_session',
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  cookies().set({
    name: 'temari_portal',
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  // 3. Set manual logout indicator cookie
  cookies().set({
    name: 'temari_manual_logout',
    value: 'true',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
  });

  if (cookieOptions.domain) {
    cookies().set({
      name: 'temari_manual_logout',
      value: 'true',
      domain: cookieOptions.domain,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    });
  }

  return { success: true };
}

export interface ReferralDashboardData {
  totalReferred: number;
  proReferred: number;
  totalEarnedETB: number;
  bonusXpEarned: number;
  recentReferrals: Array<{
    name: string;
    username?: string;
    isPro: boolean;
    conversionStatus?: 'free' | 'pro_eligible' | 'pro_expired';
    joinedAt: string;
  }>;
}

/**
 * Real-time referral dashboard data for the authenticated student.
 * Scoped strictly to the student's own telegram_id with 24-hour conversion attribution.
 */
export async function getReferralDashboard(): Promise<ReferralDashboardData> {
  const session = await getServerSession();
  if (!session?.telegram_id) throw new Error('Unauthorized');

  const supabase = await createClient();

  const { data: rawReferrals, error } = await supabase
    .from('profiles')
    .select('telegram_id, full_name, username, subscription_status, created_at, updated_at')
    .eq('referred_by', String(session.telegram_id))
    .order('created_at', { ascending: false });

  if (error || !rawReferrals) {
    if (error) console.warn('[ReferralDashboard] Error fetching referrals:', error);
    return {
      totalReferred: 0,
      proReferred: 0,
      totalEarnedETB: 0,
      bonusXpEarned: 0,
      recentReferrals: [],
    };
  }

  const telegramIds = rawReferrals.map(r => r.telegram_id).filter(Boolean);
  let receipts: PaymentReceiptRecord[] = [];
  if (telegramIds.length > 0) {
    const { data: receiptData } = await supabase
      .from('payment_receipts')
      .select('telegram_id, status, created_at')
      .in('telegram_id', telegramIds)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    receipts = (receiptData as PaymentReceiptRecord[]) || [];
  }

  const summary = calculateReferralAttribution(rawReferrals, receipts);

  const recentReferrals = summary.students.slice(0, 10).map(r => ({
    name: r.full_name || 'Scholar',
    username: r.username || undefined,
    isPro: r.isConvertedPro,
    conversionStatus: r.conversionStatus,
    joinedAt: r.created_at,
  }));

  return {
    totalReferred: summary.totalRecruited,
    proReferred: summary.proConverted,
    totalEarnedETB: summary.totalEarnedETB,
    bonusXpEarned: summary.totalRecruited * 50,
    recentReferrals,
  };
}
