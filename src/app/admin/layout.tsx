import React from 'react';
import { verifyAdmin } from '@/app/actions/admin';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminNav } from '@/components/admin/AdminNav';
import { LogoutButton } from '@/components/admin/LogoutButton';

import { TemariMascot } from '@/components/mascot/TemariMascot';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await verifyAdmin();

  if (!admin) {
    return <AdminLogin />;
  }

  const isSuperAdmin = admin.role === 'superadmin';
  const isReadonly = admin.role === 'readonly';
  const isAmbassador = admin.role === 'ambassador';
  const isEditor = admin.role === 'editor' || admin.role === 'content_editor';

  const roleLabel = 
    isSuperAdmin ? 'Super Admin' :
    isAmbassador ? 'College Ambassador' :
    isEditor ? 'Content Editor' :
    admin.role === 'financial_admin' ? 'Financial Admin' : 'Viewer';

  const roleBadgeStyle = 
    isSuperAdmin ? 'text-accent-gold bg-accent-gold/20 border-accent-gold/40' :
    isAmbassador ? 'text-blue-400 bg-blue-500/20 border-blue-500/40' :
    isEditor ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' :
    'text-gray-300 bg-white/10 border-white/20';

  return (
    <div className="h-screen bg-ground flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-64 bg-gray-950 dark:bg-card text-white flex flex-col h-auto md:h-full shrink-0 border-r border-white/10 shadow-tactile-md z-10">
        <div className="p-6 pb-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center p-1 shadow-2xs shrink-0">
            <TemariMascot mood="happy" size={38} animate={false} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Temari</span>
              <span className="text-blue-400 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 font-black">Admin</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-2 py-0.5 border rounded text-[10px] font-black uppercase tracking-wider ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
              <span className="text-xs font-bold text-gray-300">@{admin.username}</span>
            </div>
          </div>
        </div>
        
        <AdminNav role={admin.role} isReadonly={isReadonly} isSuperAdmin={isSuperAdmin} />
        
        <div className="p-4 border-t border-white/10 shrink-0">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full w-full bg-ground custom-scrollbar relative">
        <div className="max-w-6xl mx-auto pb-24 md:pb-8">
          {/* Sub-admin friendly banner */}
          {isAmbassador && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🎓</span>
                <div>
                  <span className="font-black text-blue-900 dark:text-blue-200">Campus Ambassador Mode:</span>{' '}
                  <span className="text-muted-foreground font-medium">Recruit students from your campus and earn 50 ETB for every PRO subscriber.</span>
                </div>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[11px] shadow-tactile-xs">
                Active Code: ref_{admin.username}
              </span>
            </div>
          )}

          {isEditor && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">✍️</span>
                <div>
                  <span className="font-black text-emerald-900 dark:text-emerald-200">Content Editor Mode:</span>{' '}
                  <span className="text-muted-foreground font-medium">You have direct write access to past exam question banks and textbook study notes.</span>
                </div>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] shadow-tactile-xs">
                Editor Studio
              </span>
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
