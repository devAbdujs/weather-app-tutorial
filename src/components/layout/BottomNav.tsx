'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookMarked, TreeDeciduous } from 'lucide-react';

export const BottomNav = () => {
  const pathname = usePathname() || '';

  // Hide BottomNav during active focus modes so it doesn't block footers
  const isFocusMode = pathname.startsWith('/exam/') || pathname.startsWith('/notebook/') || pathname.startsWith('/notes/');
  if (isFocusMode) return null;

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Notebook', href: '/notebook/All', icon: BookMarked },
    { name: 'Mastery', href: '/mastery', icon: TreeDeciduous },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-black/5 pb-safe pt-2 px-4 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] sm:max-w-md sm:mx-auto">
      <div className="flex justify-between items-center h-14">
        {navItems.map((item) => {
          // Precise active logic
          const isActive = 
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href.split('/')[1]);
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="flex-1">
              <div className="flex flex-col items-center justify-center gap-1 group active:scale-95 transition-transform">
                <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-colors ${
                  isActive ? 'bg-primary/10' : 'bg-transparent'
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-primary' : 'text-tertiary group-hover:text-secondary'
                  }`} />
                </div>
                <span className={`text-[10px] font-bold transition-colors ${
                  isActive ? 'text-primary' : 'text-tertiary'
                }`}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
