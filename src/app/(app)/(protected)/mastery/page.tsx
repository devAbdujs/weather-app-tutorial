import React from 'react';
import { getServerSession } from '@/lib/session';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { MasteryTree } from '@/components/dashboard/MasteryTree';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MasteryPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  let stats: any[] = [];
  let profile: any = null;

  try {
    const supabase = await createClient();
    const [statsRes, profileRes] = await Promise.all([
      supabase
        .from('user_subject_stats')
        .select('*')
        .eq('telegram_id', session.telegram_id)
        .order('questions_correct', { ascending: false }),
      supabase
        .from('profiles')
        .select('target_exam, stream, full_name, daily_streak')
        .eq('telegram_id', session.telegram_id)
        .maybeSingle(),
    ]);
    stats = statsRes.data || [];
    profile = profileRes.data || null;
  } catch (err) {
    console.error('[MasteryPage Error]', err);
  }

  const finalProfile = profile || {
    target_exam: session.target_exam || null,
    stream: session.stream || '',
    full_name: session.first_name,
    daily_streak: 0,
  };

  return (
    <MasteryTree stats={stats} profile={finalProfile} />
  );
}
