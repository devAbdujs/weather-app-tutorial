'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart2, User } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { sounds } from '@/lib/sounds';

export const BottomNav = () => {
  const pathname = usePathname() || '';
  const { haptic } = useTelegram();

  // Hide during deep focus screens
  const isFocusMode =
    pathname.startsWith('/exam/') ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/flashcards/') ||
    pathname.startsWith('/practice/sessions');

  if (isFocusMode) return null;

  const navItems = [
    { name: 'Home',     href: '/dashboard', icon: Home },
    { name: 'Practice', href: '/practice',  icon: BookOpen },
    { name: 'Progress', href: '/mastery',   icon: BarChart2 },
    { name: 'Profile',  href: '/profile',   icon: User },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="
        fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto pb-safe
        bg-ground/90 dark:bg-ground/90
        backdrop-blur-xl
        border-t border-black/[0.08] dark:border-white/[0.08]
        shadow-tactile-nav
        transition-colors duration-200
      "
    >
      <div className="flex justify-around items-center h-16 px-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link 
              key={item.name} 
              href={item.href} 
              onClick={() => {
                sounds.playTap();
                haptic.selection();
              }}
              className="flex-1"
            >
              <div className="flex flex-col items-center justify-center gap-1 active:translate-y-[1px] transition-transform duration-100">
                <div
                  className={`
                    relative flex items-center justify-center w-12 h-7 rounded-control transition-all duration-150 ease-spring
                    ${isActive
                      ? 'bg-primary text-white shadow-tactile-xs border border-primary/40'
                      : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}
                  `}
                >
                  <Icon
                    className="w-4.5 h-4.5 transition-transform duration-150"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={`
                    text-micro tracking-tight transition-colors duration-150
                    ${isActive
                      ? 'font-black text-primary'
                      : 'font-semibold text-slate-500 dark:text-slate-400'}
                  `}
                >
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
