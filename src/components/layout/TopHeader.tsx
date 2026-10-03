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
        w-full h-14 shrink-0 z-40
        bg-ground/90 dark:bg-ground/90
        backdrop-blur-xl
        border-b border-black/[0.08] dark:border-white/[0.08]
        flex items-center justify-between px-3.5 gap-2
      "
    >
      {/* Left: Back button OR Temari Logo + Brand */}
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            onClick={() => { sounds.playTap(); router.back(); }}
            aria-label="Go back"
            className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-b-[3px] border-black/10 dark:border-white/10 bg-card text-foreground hover:text-primary transition-all shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div 
            onClick={() => { sounds.playTap(); router.push('/dashboard'); }}
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-2xs border-2 border-b-[3px] border-primary/25 dark:border-primary/40 shrink-0 bg-primary/10 flex items-center justify-center p-1">
              <Image
                src="/assets/temari_icon.png"
                alt="Temari"
                className="w-full h-full object-contain"
                width={40}
                height={40}
                priority
              />
            </div>
            <span className="font-black text-lg text-foreground tracking-tight hidden xs:inline">
              Temari
            </span>
          </div>
        )}
      </div>

      {/* Center: Live Gamification Telemetry (Streak & XP - High Contrast) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Streak Pill - Warm Gold Flame */}
        <button
          onClick={() => { sounds.playStreak(); router.push('/mastery'); }}
          title={`${streak} Day Streak`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border-2 border-b-[3px] border-amber-500/30 text-amber-950 dark:text-amber-200 font-black text-xs active:translate-y-[1px] transition-all shadow-2xs"
        >
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span className="font-mono font-black tabular-nums" suppressHydrationWarning>{streak}</span>
        </button>

        {/* XP Counter Pill - High Contrast Gamification Gold */}
        <button
          onClick={() => { sounds.playCorrect(); router.push('/profile'); }}
          title={`${xp} Total XP`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-gold/15 border-2 border-b-[3px] border-accent-gold/30 text-amber-950 dark:text-amber-200 font-black text-xs active:translate-y-[1px] transition-all shadow-2xs"
        >
          <Zap className="w-4 h-4 fill-accent-gold text-accent-gold" />
          <span className="font-mono font-black tabular-nums" suppressHydrationWarning>{xp}</span>
        </button>
      </div>

      {/* Right: Pro Subscribe Pill + Sound toggle + Theme toggle */}
      <div className="flex items-center gap-1.5 justify-end">
        {/* Pro Pill (Upgrade or Active Badge) */}
        {userProfile?.subscription_status !== 'premium' ? (
          <button
            onClick={() => { sounds.playTap(); router.push('/upgrade'); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-b-[3px] border-amber-600 text-stone-950 font-black text-xs shadow-2xs active:translate-y-0.5 transition-all"
            title="Upgrade to Pro"
          >
            <span>👑</span>
            <span>PRO</span>
          </button>
        ) : (
          <button
            onClick={() => { sounds.playTap(); router.push('/upgrade'); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border-2 border-b-[3px] border-amber-500/30 text-amber-900 dark:text-amber-200 font-black text-xs shadow-2xs active:translate-y-0.5 transition-all"
            title="Temari PRO Active — View Benefits"
          >
            <span>👑</span>
            <span className="text-[11px] font-black tracking-tight">PRO</span>
          </button>
        )}

        {/* Sound FX Toggle */}
        <button
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
          title={soundEnabled ? 'Sound FX On' : 'Sound FX Muted'}
          className="w-9 h-9 flex items-center justify-center rounded-2xl border-2 border-b-[3px] border-black/10 dark:border-white/10 bg-card text-foreground hover:text-primary transition-all shadow-2xs"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-primary" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggle}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 flex items-center justify-center rounded-2xl border-2 border-b-[3px] border-black/10 dark:border-white/10 bg-card text-foreground hover:text-primary transition-all shadow-2xs"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-accent-gold" /> : <Moon className="w-4 h-4 text-gray-800" />}
        </button>
      </div>
    </header>
  );
};
