'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10.28 15.688L9.988 19.824C10.404 19.824 10.584 19.644 10.8 19.428L12.752 17.548L16.8 20.536C17.544 20.948 18.068 20.732 18.264 19.864L20.92 7.348L20.924 7.344C21.156 6.248 20.528 5.82 19.808 6.088L4.256 12.084C3.204 12.504 3.22 13.092 4.068 13.352L8.048 14.596L17.288 8.772C17.724 8.48 18.12 8.644 17.776 8.948L10.28 15.688Z" fill="currentColor"/>
  </svg>
);

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
        bg-ground/90
        backdrop-blur-xl
        border-b border-black/[0.06] dark:border-white/[0.08]
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
              rounded-[12px]
              bg-card border border-black/[0.06] dark:border-white/[0.08]
              text-gray-600 dark:text-gray-400
              hover:text-gray-900 dark:hover:text-gray-100
              active:scale-90 transition-all
            "
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8.5 h-8.5 rounded-[12px] overflow-hidden shadow-sm border border-black/[0.06] dark:border-white/[0.08] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              src="/assets/temari logo.png"
              alt="Temari"
              className="w-full h-full object-cover"
              width={34}
              height={34}
            />
          </div>
        )}
      </div>

      {/* Center: title or Join button */}
      <div className="flex-1 flex items-center justify-center">
        {showLogo ? (
          <a
            href="https://t.me/temari_top"
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center gap-1.5 px-3.5 py-1.5 
              bg-[#229ED9] hover:bg-[#1C88BA] 
              text-white
              rounded-[12px] transition-all 
              font-bold text-[12px] tracking-tight shadow-sm shadow-[#229ED9]/25
              border border-white/20 active:scale-[0.98]
            "
          >
            <TelegramIcon className="w-3.5 h-3.5 shrink-0" />
            Join Channel
          </a>
        ) : (
          <h1 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate text-center">
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
            rounded-[12px]
            bg-card border border-black/[0.06] dark:border-white/[0.08]
            text-gray-600 dark:text-gray-400
            hover:text-gray-900 dark:hover:text-gray-100
            active:scale-90 transition-all
          "
        >
          {resolvedTheme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>

        {/* Avatar — links to profile */}
        <button
          onClick={() => router.push('/profile')}
          aria-label="Go to profile"
          className="
            w-9 h-9 rounded-[12px]
            bg-primary/10 border border-primary/20
            flex items-center justify-center
            text-primary font-black text-xs
            active:scale-[0.96] transition-transform
          "
        >
          {initial}
        </button>
      </div>
    </header>
  );
};
