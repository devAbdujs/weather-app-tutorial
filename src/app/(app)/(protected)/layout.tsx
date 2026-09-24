import React from 'react';
import { getServerSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { StoreInitializer } from '@/components/auth/StoreInitializer';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PWARegistry } from '@/components/layout/PWARegistry';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/');
  }

  const formattedProfile = {
    telegram_id: session.telegram_id,
    first_name: session.first_name,
    target_exam: session.target_exam || null,
    stream: session.stream || '',
    daily_streak: 0, // Should probably be dynamic but keeping previous logic
  };

  return (
    <DashboardShell>
      <StoreInitializer profile={formattedProfile} />
      <PWARegistry />
      {children}
    </DashboardShell>
  );
}
