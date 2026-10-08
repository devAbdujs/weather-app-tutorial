'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, FileText, ShieldCheck, CreditCard, Bot } from 'lucide-react';

interface AdminNavProps {
  role?: string;
  isReadonly?: boolean;
  isSuperAdmin?: boolean;
}

export function AdminNav({ role = 'readonly', isReadonly, isSuperAdmin }: AdminNavProps) {
  const pathname = usePathname();

  const isEditor = role === 'editor' || role === 'content_editor';
  const isFinancial = role === 'financial_admin';

  let links: Array<{ href: string; label: string; icon: any; exact?: boolean }> = [];

  if (isEditor) {
    // Content editors / uploaders ONLY see content-related tools
    links = [
      { href: '/admin/questions', label: 'Questions', icon: BookOpen },
      { href: '/admin/upload-notes', label: 'Upload Notes', icon: FileText },
    ];
  } else if (isFinancial) {
    // Financial admins see Dashboard, Payments, and Users
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
    // Superadmin has full access to all platform areas
    links = [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/ai', label: 'AI & Gemini', icon: Bot },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/questions', label: 'Questions', icon: BookOpen },
      { href: '/admin/upload-notes', label: 'Upload Notes', icon: FileText },
      { href: '/admin/managers', label: 'Manage Admins', icon: ShieldCheck },
    ];
  }

  return (
    <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar mt-4">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : (pathname === link.href || pathname.startsWith(link.href + '/'));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm active:translate-x-1 ${
              isActive
                ? 'bg-white/10 hover:bg-white/15 font-black text-white shadow-2xs border border-white/10'
                : 'font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon className={`w-5 h-5 stroke-[2.2] ${isActive ? 'text-accent-gold' : 'text-gray-400'}`} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
