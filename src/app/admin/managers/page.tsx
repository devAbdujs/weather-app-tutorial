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
          <h1 className="text-3xl font-black text-primary tracking-tight">Manage Admins</h1>
          <p className="text-tertiary font-medium mt-1">Create accounts for content creators or read-only viewers.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Admin List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-primary">Active Accounts</h2>
          <div className="bg-card border-2 border-primary/10 rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ground/50 border-b-2 border-primary/10">
                  <th className="p-4 font-bold text-tertiary uppercase tracking-wider text-xs">Username</th>
                  <th className="p-4 font-bold text-tertiary uppercase tracking-wider text-xs">Role</th>
                  <th className="p-4 font-bold text-tertiary uppercase tracking-wider text-xs">Created</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a: any) => (
                  <tr key={a.id} className="border-b border-primary/5 hover:bg-ground/50 transition-colors">
                    <td className="p-4 font-bold text-primary">@{a.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                        a.role === 'superadmin' ? 'bg-accent-rose/10 text-accent-rose border-accent-rose/20' : 
                        a.role === 'editor' ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20' : 
                        'bg-tertiary/10 text-tertiary border-tertiary/20'
                      }`}>
                        {a.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-secondary">
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
