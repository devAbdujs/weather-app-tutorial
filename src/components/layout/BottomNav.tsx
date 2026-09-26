'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart2, User } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';

export const BottomNav = () => {
  const pathname = usePathname() || '';
  const { haptic } = useTelegram();

  // Hide during deep focus screens
  const isFocusMode =
    pathname.startsWith('/exam/') ||
    pathname.startsWith('/notebook/') ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/flashcards/') ||
    pathname.startsWith('/practice/sessions');

  if (isFocusMode) return null;

  const navItems = [
    { name: 'Home',     href: '/dashboard', icon: Home      },
    { name: 'Practice', href: '/practice',  icon: BookOpen  },
    { name: 'Progress', href: '/mastery',   icon: BarChart2 },
    { name: 'Profile',  href: '/profile',   icon: User      },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="
        fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto pb-safe
        bg-card/90 dark:bg-card/95
        backdrop-blur-xl
        border-t border-black/[0.06] dark:border-white/[0.08]
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
              onClick={() => haptic.selection()}
              className="flex-1"
            >
              <div className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform duration-150">
                <div
                  className={`
                    relative flex items-center justify-center w-11 h-7 rounded-xl transition-all duration-200 ease-bespoke
                    ${isActive
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                      : 'bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}
                  `}
                >
                  <Icon
                    className="w-[18px] h-[18px] transition-transform duration-200"
                    strokeWidth={isActive ? 2.5 : 1.9}
                  />
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={`
                    text-[10px] tracking-tight transition-colors duration-200
                    ${isActive
                      ? 'font-black text-primary'
                      : 'font-semibold text-gray-400 dark:text-gray-500'}
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
