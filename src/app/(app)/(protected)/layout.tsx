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
    subscription_status?: string;
    stream?: string;
    target_exam?: string | null;
    ai_weekly_usage?: number;
    ai_quota_reset_at?: string;
  } | null = null;

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_streak, subscription_status, stream, target_exam, ai_weekly_usage, ai_quota_reset_at')
      .eq('telegram_id', session.telegram_id)
      .maybeSingle();
    dbProfile = profile;
  } catch (err) {
    console.error('[Layout Profile Fetch Error]', err);
  }

  const formattedProfile = {
    telegram_id: session.telegram_id,
    first_name: session.first_name,
    target_exam: dbProfile?.target_exam || session.target_exam || null,
    stream: dbProfile?.stream || session.stream || '',
    daily_streak: dbProfile?.daily_streak ?? 0,
    subscription_status: dbProfile?.subscription_status || 'free',
    ai_weekly_usage: dbProfile?.ai_weekly_usage ?? 0,
    ai_quota_reset_at: dbProfile?.ai_quota_reset_at || undefined,
  };

  return (
    <DashboardShell>
      <StoreInitializer profile={formattedProfile} />
      <PWARegistry />
      {children}
    </DashboardShell>
  );
}
