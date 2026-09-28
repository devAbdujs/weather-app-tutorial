'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, BarChart2, User, Sparkles } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { sounds } from '@/lib/sounds';

export const BottomNav = () => {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { haptic } = useTelegram();
  const userProfile = useAppStore(s => s.userProfile);
  const setSetupModalType = useAppStore(s => s.setSetupModalType);

  // Hide during deep focus screens
  const isFocusMode =
    pathname.startsWith('/exam/') ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/flashcards/') ||
    pathname.startsWith('/practice/sessions');

  if (isFocusMode) return null;

  const handleCenterFab = () => {
    sounds.playCelebration();
    haptic.impact('heavy');
    const target = userProfile?.target_exam || 'entrance';
    setSetupModalType(target as any);
  };

  const leftNavItems = [
    { name: 'Home',     href: '/dashboard', icon: Home },
    { name: 'Practice', href: '/practice',  icon: BookOpen },
  ];

  const rightNavItems = [
    { name: 'Progress', href: '/mastery',   icon: BarChart2 },
    { name: 'Profile',  href: '/profile',   icon: User },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-50 max-w-md mx-auto px-4 pointer-events-none">
      <nav
        aria-label="Bottom Navigation"
        className="
          pointer-events-auto
          w-full h-16
          bg-white/95 dark:bg-[#151A22]/95
          backdrop-blur-xl
          rounded-full
          border border-black/[0.08] dark:border-white/[0.09]
          shadow-tactile-lg
          px-3
          flex items-center justify-between
          transition-all duration-200
        "
      >
        {/* Left 2 items */}
        <div className="flex items-center flex-1 justify-around">
          {leftNavItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/' || pathname === '/dashboard'
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
                className="flex-1 max-w-[68px]"
              >
                <div className="flex flex-col items-center justify-center gap-0.5 py-1 active:scale-95 transition-transform duration-100">
                  <div
                    className={`
                      relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-150
                      ${isActive
                        ? 'text-primary'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                    `}
                  >
                    <Icon
                      className="w-5 h-5 transition-transform duration-150"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  <span
                    className={`
                      text-[10px] font-black tracking-tight leading-none transition-colors duration-150
                      ${isActive
                        ? 'text-primary'
                        : 'text-slate-400 dark:text-slate-500'}
                    `}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-primary mt-0.5 animate-fade-in" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Center Glowing Orange FAB (Signature Chegg Inspiration) */}
        <div className="flex items-center justify-center px-1">
          <button
            onClick={handleCenterFab}
            aria-label="Start Quick Exam"
            title="Start Quick Exam Simulator"
            className="
              relative -top-3.5
              w-12 h-12 rounded-full
              bg-gradient-to-tr from-[#EA580C] via-[#F96E10] to-[#FB923C]
              text-white
              shadow-lg shadow-orange-500/40
              border-4 border-[#FAF9F5] dark:border-[#0C0F14]
              flex items-center justify-center
              active:scale-90 transition-all duration-150
              hover:shadow-orange-500/60
            "
          >
            <Sparkles className="w-5 h-5 fill-white text-white drop-shadow-sm animate-pulse-soft" />
          </button>
        </div>

        {/* Right 2 items */}
        <div className="flex items-center flex-1 justify-around">
          {rightNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  sounds.playTap();
                  haptic.selection();
                }}
                className="flex-1 max-w-[68px]"
              >
                <div className="flex flex-col items-center justify-center gap-0.5 py-1 active:scale-95 transition-transform duration-100">
                  <div
                    className={`
                      relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-150
                      ${isActive
                        ? 'text-primary'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                    `}
                  >
                    <Icon
                      className="w-5 h-5 transition-transform duration-150"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  <span
                    className={`
                      text-[10px] font-black tracking-tight leading-none transition-colors duration-150
                      ${isActive
                        ? 'text-primary'
                        : 'text-slate-400 dark:text-slate-500'}
                    `}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-primary mt-0.5 animate-fade-in" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
