import React from 'react';
import { getAdmins } from '@/app/actions/admin';
import { ShieldCheck } from 'lucide-react';
import { CreateAdminForm } from '@/components/admin/CreateAdminForm';

export default async function ManagersPage() {
  const admins = await getAdmins();

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Manage Admins</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Create accounts for content creators or read-only viewers.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Admin List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Active Accounts</h2>
          <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-bespoke-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ground/50 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Username</th>
                  <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Role</th>
                  <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Created</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a: any) => (
                  <tr key={a.id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-gray-900 dark:text-gray-100">@{a.username}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${
                        a.role === 'superadmin' ? 'bg-accent/15 text-accent border-accent/30' : 
                        a.role === 'editor' ? 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] border-[hsl(145,42%,38%)]/20' : 
                        'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-black/[0.06] dark:border-white/[0.08]'
                      }`}>
                        {a.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Form */}
        <div className="md:col-span-1">
          <CreateAdminForm />
        </div>
        
      </div>
    </div>
  );
}
