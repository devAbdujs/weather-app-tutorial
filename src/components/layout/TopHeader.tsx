'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, Sun, Moon, Flame, Zap, Volume2, VolumeX } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { useGamificationStore } from '@/store/useGamificationStore';
import { sounds } from '@/lib/sounds';

// Map routes to display titles
const ROUTE_TITLES: Record<string, string> = {
  '/':          'Temari',
  '/dashboard': 'Temari',
  '/practice':  'Practice Hub',
  '/mastery':   'Progress',
  '/profile':   'Profile',
};

export const TopHeader = () => {
  const pathname = usePathname() || '';
  const router = useRouter();
  const userProfile = useAppStore(s => s.userProfile);
  const { resolvedTheme, toggle } = useTheme();
  const { xp, soundEnabled, toggleSound } = useGamificationStore();

  // Hide during full-focus screens (exam, notes, practice sessions)
  const isFocusMode =
    pathname.startsWith('/exam/') ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/practice/sessions');

  if (isFocusMode) return null;

  const isHome = pathname === '/' || pathname === '/dashboard';
  const showBack = !isHome && !Object.keys(ROUTE_TITLES).includes(pathname);
  const title = ROUTE_TITLES[pathname] ?? 'Temari';
  const streak = userProfile?.daily_streak || 0;

  return (
    <header
      className="
        w-full h-15 shrink-0 z-40
        bg-card/95 dark:bg-card/95
        backdrop-blur-xl
        border-b border-black/[0.08] dark:border-white/[0.08]
        shadow-sm
        flex items-center justify-between px-3.5 gap-2
      "
    >
      {/* Left: Back button OR Temari Logo + Brand */}
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            onClick={() => { sounds.playTap(); router.back(); }}
            aria-label="Go back"
            className="
              w-9 h-9 flex items-center justify-center
              rounded-[13px]
              bg-card border border-black/[0.08] dark:border-white/[0.12] border-b-2 border-b-black/[0.15] dark:border-b-white/[0.18]
              text-gray-700 dark:text-gray-300
              hover:text-gray-900 dark:hover:text-gray-100
              active:translate-y-[1px] transition-all shadow-xs
            "
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div 
            onClick={() => { sounds.playTap(); router.push('/dashboard'); }}
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-[13px] overflow-hidden shadow-xs border border-black/[0.08] dark:border-white/[0.12] border-b-2 border-b-black/[0.15] dark:border-b-white/[0.18] shrink-0 bg-primary/10 flex items-center justify-center">
              <Image
                src="/assets/temari logo.png"
                alt="Temari"
                className="w-full h-full object-cover"
                width={36}
                height={36}
              />
            </div>
            <span className="font-black text-base text-gray-900 dark:text-gray-100 tracking-tight hidden xs:inline">
              Temari
            </span>
          </div>
        )}
      </div>

      {/* Center: Live Gamification Telemetry (Streak & XP) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Streak Pill */}
        <button
          onClick={() => { sounds.playStreak(); router.push('/mastery'); }}
          title={`${streak} Day Streak`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-gold/12 border border-accent-gold/25 border-b-2 border-b-accent-gold/40 text-accent-gold font-black text-xs active:translate-y-[1px] transition-all shadow-xs"
        >
          <Flame className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
          <span className="font-mono tabular-nums">{streak}</span>
        </button>

        {/* XP Counter Pill */}
        <button
          onClick={() => { sounds.playCorrect(); router.push('/profile'); }}
          title={`${xp} Total XP`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-gold/15 border border-accent-gold/30 border-b-2 border-b-accent-gold/50 text-accent-gold font-black text-xs active:translate-y-[1px] transition-all shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
          <span className="font-mono tabular-nums">{xp} XP</span>
        </button>
      </div>

      {/* Right: Sound toggle + Theme toggle */}
      <div className="flex items-center gap-1.5 justify-end">
        {/* Sound FX Toggle */}
        <button
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
          title={soundEnabled ? 'Sound FX On' : 'Sound FX Muted'}
          className="
            w-9 h-9 flex items-center justify-center
            rounded-[13px]
            bg-card border border-black/[0.08] dark:border-white/[0.12] border-b-2 border-b-black/[0.15] dark:border-b-white/[0.18]
            text-gray-700 dark:text-gray-200
            hover:text-primary dark:hover:text-primary
            active:translate-y-[1px] transition-all shadow-xs
          "
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-primary" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          )}
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggle}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="
            w-9 h-9 flex items-center justify-center
            rounded-[13px]
            bg-card border border-black/[0.08] dark:border-white/[0.12] border-b-2 border-b-black/[0.15] dark:border-b-white/[0.18]
            text-gray-700 dark:text-gray-200
            hover:text-gray-900 dark:hover:text-gray-100
            active:translate-y-[1px] transition-all shadow-xs
          "
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-accent-gold" /> : <Moon className="w-4 h-4 text-gray-700" />}
        </button>
      </div>
    </header>
  );
};
