import React from 'react';
import { verifyAdmin, getAmbassadorDashboard } from '@/app/actions/admin';
import { hasPermission } from '@/lib/adminPermissions';
import { redirect } from 'next/navigation';
import { AmbassadorView } from '@/components/admin/AmbassadorView';

export const dynamic = 'force-dynamic';

export default async function AdminAmbassadorPage({
  searchParams,
}: {
  searchParams?: { ambassador?: string };
}) {
  const admin = await verifyAdmin();
  if (!admin || !hasPermission(admin, 'ambassador:view')) {
    redirect('/admin');
  }

  // Superadmin can inspect specific ambassadors via ?ambassador=<username_or_id>
  const targetAmbassador = admin.role === 'superadmin' ? searchParams?.ambassador : undefined;
  const data = await getAmbassadorDashboard(targetAmbassador);

  return <AmbassadorView data={data} />;
}
