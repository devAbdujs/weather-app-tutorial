'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Bot, 
  GraduationCap, 
  LogOut 
} from 'lucide-react';
import { TemariMascot } from '@/components/mascot/TemariMascot';
import { LogoutButton } from '@/components/admin/LogoutButton';

interface AdminMobileNavProps {
  role: string;
  username: string;
  roleLabel: string;
  roleBadgeStyle: string;
}

export function AdminMobileNav({
  role,
  username,
  roleLabel,
  roleBadgeStyle,
}: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isEditor = role === 'editor' || role === 'content_editor';
  const isAmbassador = role === 'ambassador';
  const isFinancial = role === 'financial_admin';

  let links: Array<{ href: string; label: string; icon: any; exact?: boolean }> = [];

  if (isEditor) {
    links = [
      { href: '/admin/questions', label: 'Questions Studio', icon: BookOpen },
      { href: '/admin/upload-notes', label: 'Upload Notes', icon: FileText },
    ];
  } else if (isAmbassador) {
    links = [
      { href: '/admin/ambassador', label: 'Campus Ambassador', icon: GraduationCap, exact: true },
    ];
  } else if (isFinancial) {
    links = [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/users', label: 'Users', icon: Users },
    ];
  } else if (role === 'readonly') {
    links = [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/questions', label: 'Questions', icon: BookOpen },
      { href: '/admin/users', label: 'Users', icon: Users },
    ];
  } else {
    // Superadmin
    links = [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/ambassador', label: 'Ambassadors', icon: GraduationCap },
      { href: '/admin/ai', label: 'AI & Gemini', icon: Bot },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/questions', label: 'Questions Studio', icon: BookOpen },
      { href: '/admin/upload-notes', label: 'Upload Notes', icon: FileText },
      { href: '/admin/managers', label: 'Manage Admins', icon: ShieldCheck },
    ];
  }

  return (
    <div className="md:hidden sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-tactile-sm">
      {/* Native App Top Header Bar */}
      <div className="flex items-center justify-between px-4 h-15">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center p-0.5 shadow-2xs shrink-0">
            <TemariMascot mood="happy" size={26} animate={false} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-white">Temari</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className={`px-1 rounded text-[9px] font-bold ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
              <span className="text-gray-400 font-mono">@{username}</span>
            </div>
          </div>
        </Link>

        {/* Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center active:scale-95 transition-transform"
        >
          {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Slide-over / Dropdown Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-15 z-50 bg-black/70 backdrop-blur-sm animate-fade-in flex flex-col justify-between">
          <div className="bg-slate-900 border-b border-slate-800 p-4 space-y-1.5 max-h-[calc(100vh-60px)] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="px-2 pb-2 mb-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-micro font-black uppercase tracking-wider text-gray-400">
                Admin Navigation
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                @{username} • {roleLabel}
              </span>
            </div>

            {links.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? pathname === link.href
                : (pathname === link.href || pathname.startsWith(link.href + '/'));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all text-sm font-bold min-h-[44px] ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-white/10">
              <LogoutButton />
            </div>
          </div>

          {/* Tap-outside area */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
