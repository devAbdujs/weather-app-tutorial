'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import Image from 'next/image';

// Map routes to display titles
const ROUTE_TITLES: Record<string, string> = {
  '/':          'Temari',
  '/practice':  'Practice',
  '/mastery':   'Progress',
  '/profile':   'Profile',
};

export const TopHeader = () => {
  const pathname = usePathname() || '';
  const router = useRouter();
  const userProfile = useAppStore(s => s.userProfile);
  const { resolvedTheme, toggle } = useTheme();

  // Hide during full-focus screens (exam, notebook, notes, practice sessions)
  const isFocusMode =
    pathname.startsWith('/exam/') ||
    pathname.startsWith('/notebook/') ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/practice/sessions');

  if (isFocusMode) return null;

  // Determine title and whether to show back button
  const isRoot = pathname === '/' || Object.keys(ROUTE_TITLES).includes(pathname);
  const title = ROUTE_TITLES[pathname] ?? 'Temari';
  const showBack = !isRoot;
  const showLogo = pathname === '/';

  const initial = userProfile?.first_name
    ? userProfile.first_name.charAt(0).toUpperCase()
    : 'T';

  return (
    <header
      className="
        w-full h-14 shrink-0 z-40
        bg-ground/90 dark:bg-ground/95
        backdrop-blur-xl
        border-b border-black/5 dark:border-white/8
        flex items-center px-4 gap-3
      "
    >
      {/* Left: back button or logo */}
      <div className="flex items-center gap-2 min-w-[40px]">
        {showBack ? (
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="
              w-9 h-9 flex items-center justify-center
              rounded-full
              text-gray-600 dark:text-gray-400
              hover:bg-black/5 dark:hover:bg-white/10
              active:scale-90 transition-all
            "
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-[10px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/temari logo.png"
              alt="Temari"
              className="w-full h-full object-cover"
              width={32}
              height={32}
            />
          </div>
        )}
      </div>

      {/* Center: title */}
      <div className="flex-1 flex items-center justify-center">
        {showLogo ? (
          <span className="text-[17px] font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Temari
          </span>
        ) : (
          <h1 className="text-[17px] font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate text-center">
            {title}
          </h1>
        )}
      </div>

      {/* Right: theme toggle + avatar */}
      <div className="flex items-center gap-2 min-w-[40px] justify-end">
        <button
          onClick={toggle}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="
            w-9 h-9 flex items-center justify-center
            rounded-full
            text-gray-600 dark:text-gray-400
            hover:bg-black/5 dark:hover:bg-white/10
            active:scale-90 transition-all
          "
        >
          {resolvedTheme === 'dark'
            ? <Sun className="w-4.5 h-4.5" />
            : <Moon className="w-4.5 h-4.5" />
          }
        </button>

        {/* Avatar — links to profile */}
        <button
          onClick={() => router.push('/profile')}
          aria-label="Go to profile"
          className="
            w-8 h-8 rounded-full
            bg-primary/10 dark:bg-primary/20
            flex items-center justify-center
            border border-primary/15 dark:border-primary/30
            text-gray-900 dark:text-gray-100
            font-black text-sm
            active:scale-[0.96] transition-transform
          "
        >
          {initial}
        </button>
      </div>
    </header>
  );
};
