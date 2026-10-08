import React from 'react';
import { getServerSession } from '@/lib/session';
import { createAdminClient } from '@/utils/supabase/admin';
import { getReferralDashboard } from '@/app/actions/user';
import { redirect } from 'next/navigation';
import { ProfileView } from '@/components/dashboard/ProfileView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  let profile = null;
  let stats: any[] = [];
  let referralData = {
    totalReferred: 0,
    proReferred: 0,
    totalEarnedETB: 0,
    bonusXpEarned: 0,
    recentReferrals: [] as Array<{ name: string; username?: string; isPro: boolean; joinedAt: string }>,
  };

  try {
    const supabase = await createAdminClient();
    const [profileRes, statsRes, referralDashboard] = await Promise.all([
      supabase.from('profiles').select('*').eq('telegram_id', session.telegram_id).maybeSingle(),
      supabase.from('user_subject_stats').select('*').eq('telegram_id', session.telegram_id),
      getReferralDashboard().catch(() => null),
    ]);
    profile = profileRes.data;
    stats = statsRes.data || [];

    if (referralDashboard) {
      referralData = referralDashboard;
    }
  } catch (err) {
    console.error('[ProfilePage Error]', err);
  }

  // Resilient fallback profile if database lookup fails
  const finalProfile = profile || {
    id: session.profile_id,
    telegram_id: session.telegram_id,
    full_name: session.first_name,
    target_exam: session.target_exam || null,
    stream: session.stream || '',
    daily_streak: 0,
    subscription_status: 'free',
  };

  return <ProfileView profile={finalProfile as any} stats={stats} referralData={referralData} />;
}
