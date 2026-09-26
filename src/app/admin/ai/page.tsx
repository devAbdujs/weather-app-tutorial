import React from 'react';
import { getAdminAIStats } from '@/app/actions/admin';
import { AdminAIView } from '@/components/admin/AdminAIView';

export const dynamic = 'force-dynamic';

export default async function AdminAIPage() {
  const stats = await getAdminAIStats();

  return <AdminAIView stats={stats} />;
}
