'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookMarked, TreeDeciduous, BookOpen, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const DesktopSidebar = () => {
  const pathname = usePathname();
  const profile = useAppStore(s => s.userProfile);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'My Notebook', href: '/notebook/All', icon: BookMarked },
    { name: 'Mastery Map', href: '/mastery', icon: TreeDeciduous },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen bg-card border-r-2 border-black/5 p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 shrink-0">
      
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10 pl-2">
        <div className="w-10 h-10 bg-primary rounded-[12px] flex items-center justify-center shadow-brutal-sm rotate-[-3deg]">
          <BookOpen className="w-5 h-5 text-card" />
        </div>
        <span className="text-xl font-black text-primary tracking-tight">Ethio Scholar</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <div className="text-xs font-black text-tertiary uppercase tracking-widest pl-2 mb-4">Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('/')[1]));
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] font-bold transition-all active:scale-95 ${
                isActive 
                  ? 'bg-primary text-card shadow-brutal-sm translate-x-1' 
                  : 'text-secondary hover:bg-black/5 hover:text-primary'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-card' : 'text-tertiary'}`} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Mini */}
      <div className="mt-auto p-4 rounded-[20px] bg-ground border-2 border-black/5 flex items-center gap-3 cursor-pointer hover:border-black/10 transition-colors">
        <div className="w-10 h-10 bg-accent-blue/20 rounded-full flex items-center justify-center shrink-0">
          <span className="text-accent-blue font-black">{profile?.first_name?.charAt(0) || 'U'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-primary truncate">{profile?.first_name || 'Student'}</p>
          <p className="text-xs font-bold text-tertiary truncate capitalize">{profile?.target_exam || 'Setup pending'}</p>
        </div>
        <Settings className="w-5 h-5 text-tertiary" />
      </div>

    </aside>
  );
};
