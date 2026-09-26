import React from 'react';
import { verifyAdmin } from '@/app/actions/admin';
import { AdminLogin } from '@/components/admin/AdminLogin';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, FileText, Settings, ShieldCheck, CreditCard, Bot } from 'lucide-react';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await verifyAdmin();

  if (!admin) {
    return <AdminLogin />;
  }

  const isSuperAdmin = admin.role === 'superadmin';
  const isReadonly = admin.role === 'readonly';

  return (
    <div className="h-screen bg-ground flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-64 bg-primary text-white flex flex-col h-auto md:h-full shrink-0 shadow-bespoke-md z-10">
        <div className="p-6">
          <h2 className="text-2xl font-black tracking-tight text-accent">Temari Admin</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider text-white/70">
              {admin.role}
            </span>
            <span className="text-xs font-medium text-white/50">@{admin.username}</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar mt-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm text-white/90">
            <LayoutDashboard className="w-5 h-5 text-white/70" />
            Dashboard
          </Link>
          <Link href="/admin/ai" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm text-white/90">
            <Bot className="w-5 h-5 text-white/70" />
            AI &amp; Gemini
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm text-white/90">
            <Users className="w-5 h-5 text-white/70" />
            Users
          </Link>
          <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm text-white/90">
            <CreditCard className="w-5 h-5 text-white/70" />
            Payments
          </Link>
          <Link href="/admin/questions" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm text-white/90">
            <BookOpen className="w-5 h-5 text-white/70" />
            Questions
          </Link>
          
          {/* Hide Upload Notes from Readonly admins */}
          {!isReadonly && (
            <Link href="/admin/upload-notes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm text-white/90">
              <FileText className="w-5 h-5 text-white/70" />
              Upload Notes
            </Link>
          )}

          {/* Superadmin Settings */}
          {isSuperAdmin && (
            <Link href="/admin/managers" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm text-white/90">
              <ShieldCheck className="w-5 h-5 text-white/70" />
              Manage Admins
            </Link>
          )}
        </nav>
        
        <div className="p-4 border-t border-white/10 shrink-0">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full w-full bg-ground custom-scrollbar relative">
        <div className="max-w-6xl mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
