import React from 'react';
import { getServerSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { StoreInitializer } from '@/components/auth/StoreInitializer';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PWARegistry } from '@/components/layout/PWARegistry';

import { createAdminClient as createClient } from '@/utils/supabase/admin';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/');
  }

  let dbProfile: {
    daily_streak?: number;
    last_activity_date?: string | null;
    subscription_status?: string;
    stream?: string;
    target_exam?: string | null;
    ai_weekly_usage?: number;
    ai_quota_reset_at?: string;
  } | null = null;
  let totalCorrect = 0;

  let isStaffOrAdmin = false;

  try {
    const supabase = await createClient();
    const [{ data: profile }, { data: stats }, { data: adminUser }] = await Promise.all([
      supabase
        .from('profiles')
        .select('daily_streak, last_activity_date, subscription_status, stream, target_exam, ai_weekly_usage, ai_quota_reset_at')
        .eq('telegram_id', session.telegram_id)
        .maybeSingle(),
      supabase
        .from('user_subject_stats')
        .select('questions_correct')
        .eq('telegram_id', session.telegram_id),
      supabase
        .from('admin_users')
        .select('id, role')
        .or(`telegram_id.eq.${session.telegram_id},username.eq.${session.username || ''}`)
        .maybeSingle(),
    ]);
    dbProfile = profile;
    isStaffOrAdmin = Boolean(adminUser);

    if (stats && Array.isArray(stats)) {
      totalCorrect = stats.reduce((acc, curr) => acc + (curr.questions_correct || 0), 0);
    }

    // Auto-heal / grant PRO access to subadmins & staff on the platform
    if (isStaffOrAdmin && dbProfile?.subscription_status !== 'premium') {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'premium' })
        .eq('telegram_id', session.telegram_id);
    }
  } catch (err) {
    console.error('[Layout Profile Fetch Error]', err);
  }

  const formattedProfile = {
    telegram_id: session.telegram_id,
    first_name: session.first_name,
    target_exam: dbProfile?.target_exam || session.target_exam || null,
    stream: dbProfile?.stream || session.stream || '',
    daily_streak: dbProfile?.daily_streak ?? 0,
    last_activity_date: dbProfile?.last_activity_date || null,
    subscription_status: (isStaffOrAdmin || dbProfile?.subscription_status === 'premium') ? 'premium' : 'free',
    ai_weekly_usage: dbProfile?.ai_weekly_usage ?? 0,
    ai_quota_reset_at: dbProfile?.ai_quota_reset_at || undefined,
  };

  return (
    <DashboardShell>
      <StoreInitializer profile={formattedProfile} totalCorrect={totalCorrect} />
      <PWARegistry />
      {children}
    </DashboardShell>
  );
}
