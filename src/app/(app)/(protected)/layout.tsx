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

  let streak = 0;
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_streak')
      .eq('telegram_id', session.telegram_id)
      .maybeSingle();
    streak = profile?.daily_streak ?? 0;
  } catch (err) {
    console.error('[Layout Profile Fetch Error]', err);
  }

  const formattedProfile = {
    telegram_id: session.telegram_id,
    first_name: session.first_name,
    target_exam: session.target_exam || null,
    stream: session.stream || '',
    daily_streak: streak,
  };

  return (
    <DashboardShell>
      <StoreInitializer profile={formattedProfile} />
      <PWARegistry />
      {children}
    </DashboardShell>
  );
}
