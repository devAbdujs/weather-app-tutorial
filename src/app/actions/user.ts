'use server';

import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { getServerSession, encryptSession } from '@/lib/session';
import { cookies } from 'next/headers';

/**
 * Updates the user's onboarding preferences.
 * Protected by encrypted HTTP-only session cookie.
 */
export async function updateProfilePreferences(target_exam: string, stream: string) {
  const session = await getServerSession();
  if (!session?.telegram_id) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ target_exam, stream })
    .eq('telegram_id', session.telegram_id);

  if (error) throw new Error(error.message);

  // Re-issue session cookie with new preferences for instant root hydration
  const newToken = await encryptSession({
    ...session,
    target_exam,
    stream
  });

  cookies().set({
    name: 'es_session',
    value: newToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
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
    .single();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastDate = profile?.last_activity_date;

  if (lastDate === today) return { success: true, streak: profile?.daily_streak || 0 };

  let newStreak = 1;
  if (lastDate === yesterday) {
    newStreak = (profile?.daily_streak || 0) + 1;
  }

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
