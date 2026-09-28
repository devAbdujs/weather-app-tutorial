import React from 'react';
import { verifyAdmin } from '@/app/actions/admin';
import { AdminLogin } from '@/components/admin/AdminLogin';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, FileText, Settings, ShieldCheck, CreditCard, Bot } from 'lucide-react';
import { LogoutButton } from '@/components/admin/LogoutButton';

import { TemariMascot } from '@/components/mascot/TemariMascot';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await verifyAdmin();

  if (!admin) {
    return <AdminLogin />;
  }

  const isSuperAdmin = admin.role === 'superadmin';
  const isReadonly = admin.role === 'readonly';

  return (
    <div className="h-screen bg-ground flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-64 bg-primary text-white flex flex-col h-auto md:h-full shrink-0 shadow-tactile-md z-10">
        <div className="p-6 pb-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center p-1 shadow-2xs shrink-0">
            <TemariMascot mood="happy" size={38} animate={false} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Temari</span>
              <span className="text-accent-gold text-xs px-2 py-0.5 rounded-full bg-white/10 font-bold">Admin</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.5 bg-white/15 rounded text-[10px] font-black uppercase tracking-wider text-white/90">
                {admin.role}
              </span>
              <span className="text-xs font-semibold text-white/60">@{admin.username}</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar mt-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/15 active:translate-x-1 transition-all font-bold text-sm text-white/90 hover:text-white">
            <LayoutDashboard className="w-5 h-5 text-white/80" />
            Dashboard
          </Link>
          <Link href="/admin/ai" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/15 active:translate-x-1 transition-all font-bold text-sm text-white/90 hover:text-white">
            <Bot className="w-5 h-5 text-accent-gold" />
            AI &amp; Gemini
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/15 active:translate-x-1 transition-all font-bold text-sm text-white/90 hover:text-white">
            <Users className="w-5 h-5 text-white/80" />
            Users
          </Link>
          <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/15 active:translate-x-1 transition-all font-bold text-sm text-white/90 hover:text-white">
            <CreditCard className="w-5 h-5 text-white/80" />
            Payments
          </Link>
          <Link href="/admin/questions" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/15 active:translate-x-1 transition-all font-bold text-sm text-white/90 hover:text-white">
            <BookOpen className="w-5 h-5 text-white/80" />
            Questions
          </Link>
          
          {/* Hide Upload Notes from Readonly admins */}
          {!isReadonly && (
            <Link href="/admin/upload-notes" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/15 active:translate-x-1 transition-all font-bold text-sm text-white/90 hover:text-white">
              <FileText className="w-5 h-5 text-white/80" />
              Upload Notes
            </Link>
          )}

          {/* Superadmin Settings */}
          {isSuperAdmin && (
            <Link href="/admin/managers" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/15 active:translate-x-1 transition-all font-bold text-sm text-white/90 hover:text-white">
              <ShieldCheck className="w-5 h-5 text-white/80" />
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
