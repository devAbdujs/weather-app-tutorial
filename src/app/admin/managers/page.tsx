import React from 'react';
import { getAdmins, verifyAdmin } from '@/app/actions/admin';
import { hasPermission } from '@/lib/adminPermissions';
import { redirect } from 'next/navigation';
import { CreateAdminForm } from '@/components/admin/CreateAdminForm';
import { AdminAccountsTable } from '@/components/admin/AdminAccountsTable';

export default async function ManagersPage() {
  const currentAdmin = await verifyAdmin();
  if (!hasPermission(currentAdmin, 'admin:manage')) {
    if (currentAdmin?.role === 'ambassador') redirect('/admin/ambassador');
    redirect(currentAdmin?.role === 'editor' || currentAdmin?.role === 'content_editor' ? '/admin/questions' : '/admin');
  }

  const admins = await getAdmins();

  return (
    <div className="space-y-6">
      <header className="pb-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Accounts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Staff roles and access permissions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Staff Members</h2>
            <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-ground border border-border">
              {admins.length}
            </span>
          </div>
          <AdminAccountsTable admins={admins} currentAdminId={currentAdmin?.id || ''} />
        </div>

        {/* Create Form */}
        <div className="lg:col-span-1">
          <CreateAdminForm />
        </div>
      </div>
    </div>
  );
}
