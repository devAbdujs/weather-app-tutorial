import React from 'react';
import { verifyAdmin } from '@/app/actions/admin';
import { AdminLogin } from '@/components/admin/AdminLogin';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, FileText, Settings, ShieldCheck } from 'lucide-react';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await verifyAdmin();

  if (!admin) {
    return <AdminLogin />;
  }

  const isSuperAdmin = admin.role === 'superadmin';
  const isReadonly = admin.role === 'readonly';

  return (
    <div className="min-h-screen bg-ground flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-primary text-white flex flex-col md:min-h-screen shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-black tracking-tight text-accent-gold">Temari Admin</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider text-white/70">
              {admin.role}
            </span>
            <span className="text-xs font-medium text-white/50">@{admin.username}</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm">
            <LayoutDashboard className="w-5 h-5 text-accent-gold" />
            Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm">
            <Users className="w-5 h-5 text-accent-blue" />
            Users
          </Link>
          <Link href="/admin/questions" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm">
            <BookOpen className="w-5 h-5 text-accent-emerald" />
            Questions
          </Link>
          
          {/* Hide Upload Notes from Readonly admins */}
          {!isReadonly && (
            <Link href="/admin/upload-notes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm">
              <FileText className="w-5 h-5 text-white/80" />
              Upload Notes
            </Link>
          )}

          {/* Superadmin Settings */}
          {isSuperAdmin && (
            <Link href="/admin/managers" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-accent-rose" />
              Manage Admins
            </Link>
          )}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
