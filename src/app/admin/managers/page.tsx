import React from 'react';
import { getAdmins, verifyAdmin } from '@/app/actions/admin';
import { CreateAdminForm } from '@/components/admin/CreateAdminForm';
import { AdminAccountsTable } from '@/components/admin/AdminAccountsTable';

export default async function ManagersPage() {
  const currentAdmin = await verifyAdmin();
  const admins = await getAdmins();

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Manage Admins</h1>
          <p className="text-muted-foreground font-medium mt-1">Create accounts, toggle access, or revoke staff administrative privileges.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Admin List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Admin Accounts ({admins.length})</h2>
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
