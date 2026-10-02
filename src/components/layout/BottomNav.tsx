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
    pathname.startsWith('/practice/sessions');

  if (isFocusMode) return null;

  const handleCenterFab = () => {
    sounds.playCelebration();
    haptic.impact('heavy');
    setSetupModalType('exam');
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
          bg-card/95
          backdrop-blur-xl
          rounded-full
          border border-black/[0.08] dark:border-white/[0.09]
          shadow-tactile-lg
          px-3
          flex items-center justify-between
          transition-all duration-200
        "
      >
        {/* Left 2 icon tabs */}
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
                className="flex items-center justify-center p-2 rounded-2xl active:scale-90 transition-transform"
                aria-label={item.name}
                title={item.name}
              >
                <div className="relative flex flex-col items-center justify-center">
                  <Icon
                    className={`w-6 h-6 transition-all duration-150 ${
                      isActive
                        ? 'text-primary scale-110 drop-shadow-xs'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    strokeWidth={isActive ? 2.6 : 2}
                  />
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-sm shadow-orange-500/50 animate-fade-in" />
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
              relative -top-4
              w-13 h-13 rounded-full
              bg-gradient-to-tr from-[#EA580C] via-[#F96E10] to-[#FB923C]
              text-white
              shadow-xl shadow-orange-500/40
              border-4 border-ground
              flex items-center justify-center
              active:scale-90 transition-all duration-150
              hover:shadow-orange-500/60
            "
          >
            <Sparkles className="w-6 h-6 fill-white text-white drop-shadow-sm animate-pulse-soft" />
          </button>
        </div>

        {/* Right 2 icon tabs */}
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
                className="flex items-center justify-center p-2 rounded-2xl active:scale-90 transition-transform"
                aria-label={item.name}
                title={item.name}
              >
                <div className="relative flex flex-col items-center justify-center">
                  <Icon
                    className={`w-6 h-6 transition-all duration-150 ${
                      isActive
                        ? 'text-primary scale-110 drop-shadow-xs'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    strokeWidth={isActive ? 2.6 : 2}
                  />
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-sm shadow-orange-500/50 animate-fade-in" />
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
