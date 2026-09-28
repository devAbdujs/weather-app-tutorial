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
      <aside className="w-full md:w-64 bg-[#10141D] text-white flex flex-col h-auto md:h-full shrink-0 border-r border-white/10 shadow-tactile-md z-10">
        <div className="p-6 pb-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center p-1 shadow-2xs shrink-0">
            <TemariMascot mood="happy" size={38} animate={false} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Temari</span>
              <span className="text-accent-gold text-xs px-2 py-0.5 rounded-full bg-accent-gold/20 border border-accent-gold/40 font-black">Admin</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 bg-white/10 border border-white/15 rounded text-[10px] font-black uppercase tracking-wider text-accent-gold">
                {admin.role}
              </span>
              <span className="text-xs font-bold text-gray-300">@{admin.username}</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar mt-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:translate-x-1 transition-all font-black text-sm text-white shadow-2xs border border-white/10">
            <LayoutDashboard className="w-5 h-5 text-accent-gold stroke-[2.2]" />
            Dashboard
          </Link>
          <Link href="/admin/ai" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 active:translate-x-1 transition-all font-bold text-sm text-gray-200 hover:text-white">
            <Bot className="w-5 h-5 text-accent-gold stroke-[2.2]" />
            AI &amp; Gemini
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 active:translate-x-1 transition-all font-bold text-sm text-gray-200 hover:text-white">
            <Users className="w-5 h-5 text-gray-300 stroke-[2.2]" />
            Users
          </Link>
          <Link href="/admin/payments" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 active:translate-x-1 transition-all font-bold text-sm text-gray-200 hover:text-white">
            <CreditCard className="w-5 h-5 text-gray-300 stroke-[2.2]" />
            Payments
          </Link>
          <Link href="/admin/questions" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 active:translate-x-1 transition-all font-bold text-sm text-gray-200 hover:text-white">
            <BookOpen className="w-5 h-5 text-gray-300 stroke-[2.2]" />
            Questions
          </Link>
          
          {/* Hide Upload Notes from Readonly admins */}
          {!isReadonly && (
            <Link href="/admin/upload-notes" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 active:translate-x-1 transition-all font-bold text-sm text-gray-200 hover:text-white">
              <FileText className="w-5 h-5 text-gray-300 stroke-[2.2]" />
              Upload Notes
            </Link>
          )}

          {/* Superadmin Settings */}
          {isSuperAdmin && (
            <Link href="/admin/managers" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/10 active:translate-x-1 transition-all font-bold text-sm text-gray-200 hover:text-white">
              <ShieldCheck className="w-5 h-5 text-gray-300 stroke-[2.2]" />
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
