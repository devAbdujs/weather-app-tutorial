import React from 'react';
import { getAdminAIStats, verifyAdmin } from '@/app/actions/admin';
import { hasPermission } from '@/lib/adminPermissions';
import { redirect } from 'next/navigation';
import { AdminAIView } from '@/components/admin/AdminAIView';

export const dynamic = 'force-dynamic';

export default async function AdminAIPage() {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'ai:view')) {
    if (admin?.role === 'ambassador') redirect('/admin/ambassador');
    redirect(admin?.role === 'editor' || admin?.role === 'content_editor' ? '/admin/questions' : '/admin');
  }

  const stats = await getAdminAIStats();

  return <AdminAIView stats={stats} />;
}
