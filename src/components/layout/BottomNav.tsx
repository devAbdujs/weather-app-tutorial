'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart2, User } from 'lucide-react';

export const BottomNav = () => {
  const pathname = usePathname() || '';

  // Hide during deep focus screens
  const isFocusMode = pathname.startsWith('/exam/') || pathname.startsWith('/notebook/') || pathname.startsWith('/notes/');
  if (isFocusMode) return null;

  const navItems = [
    { name: 'Home',     href: '/',          icon: Home      },
    { name: 'Practice', href: '/practice',  icon: BookOpen  },
    { name: 'Progress', href: '/mastery',   icon: BarChart2 },
    { name: 'Profile',  href: '/profile',   icon: User      },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto pb-safe bg-card/95 backdrop-blur-xl border-t border-black/5 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-8px_24px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="flex-1">
              <div className="flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform duration-150">
                <div className={`relative flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-primary' : 'bg-transparent'
                }`}>
                  <Icon className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-tertiary'
                  }`} />
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-colors duration-200 ${
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
