import React from 'react';
import { verifyAdmin } from '@/app/actions/admin';
import { AdminLogin } from '@/components/admin/AdminLogin';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, FileText, Settings, LogOut } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-ground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-primary text-white flex flex-col md:min-h-screen shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-black tracking-tight text-accent-gold">Temari Admin</h2>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">Control Panel</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
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
          <Link href="/admin/upload-notes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-sm">
            <FileText className="w-5 h-5 text-white/80" />
            Upload Notes
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-error/20 text-error transition-colors font-bold text-sm">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
