"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import { TopHeader } from './TopHeader';
import { CelebrationModal } from '@/components/gamification/CelebrationModal';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() || '';
  const isFocusMode =
    pathname.startsWith('/exam/') ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/practice/sessions');

  return (
    <div className="flex h-[100dvh] w-full bg-slate-100 dark:bg-black/90 justify-center overflow-hidden">
      {/* Mobile emulator wrapper for desktop, fills screen on mobile */}
      <main className="w-full h-full max-w-md bg-ground dark:bg-ground relative shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] flex flex-col overflow-hidden sm:border-x sm:border-black/[0.08] dark:border-white/[0.08]">

        {/* Native Top Header — fixed at top, context-aware */}
        <TopHeader />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" id="main-scroll-area">
          <div className={`w-full min-h-full flex flex-col relative ${isFocusMode ? '' : 'pb-24'}`}>
            {children}
          </div>
        </div>

        {/* Fixed Mobile Bottom Nav */}
        <BottomNav />

        {/* Global Gamification Celebration Overlay */}
        <CelebrationModal />
      </main>
    </div>
  );
};
