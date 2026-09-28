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
    { name: 'Home',     href: '/dashboard', icon: Home,      color: 'text-primary bg-primary/15 border-primary/30' },
    { name: 'Practice', href: '/practice',  icon: BookOpen,  color: 'text-accent-emerald bg-accent-emerald/15 border-accent-emerald/30' },
    { name: 'Progress', href: '/mastery',   icon: BarChart2, color: 'text-accent-gold bg-accent-gold/15 border-accent-gold/30' },
    { name: 'Profile',  href: '/profile',   icon: User,      color: 'text-accent-purple bg-accent-purple/15 border-accent-purple/30' },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="
        fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto pb-safe
        bg-card/95 dark:bg-card/95
        backdrop-blur-xl
        border-t border-black/[0.08] dark:border-white/[0.08]
        shadow-bespoke-nav
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
                    relative flex items-center justify-center w-12 h-7 rounded-[13px] transition-all duration-150 ease-spring
                    ${isActive
                      ? `${item.color} border border-current/25 shadow-xs`
                      : 'bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}
                  `}
                >
                  <Icon
                    className="w-[18px] h-[18px] transition-transform duration-150"
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                </div>
                <span
                  className={`
                    text-[10px] tracking-tight transition-colors duration-150
                    ${isActive
                      ? 'font-black text-gray-900 dark:text-gray-100'
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
