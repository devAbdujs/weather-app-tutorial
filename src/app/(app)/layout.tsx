import React, { Suspense } from 'react';
import { getServerSession } from '@/lib/session';
import { ClientAuthDetector } from '@/components/auth/ClientAuthDetector';
import { StoreInitializer } from '@/components/auth/StoreInitializer';
import { DashboardShell } from '@/components/layout/DashboardShell';
import Loading from '../loading';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    return <ClientAuthDetector />;
  }

  const formattedProfile = {
    telegram_id: session.telegram_id,
    first_name: session.first_name,
    target_exam: session.target_exam || null,
    stream: session.stream || '',
    daily_streak: 0,
  };

  return (
    <DashboardShell>
      <StoreInitializer profile={formattedProfile} />
      {children}
    </DashboardShell>
  );
}
