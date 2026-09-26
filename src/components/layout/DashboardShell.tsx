"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import { TopHeader } from './TopHeader';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() || '';
  const isFocusMode =
    pathname.startsWith('/exam/') ||
    pathname.startsWith('/notebook/') ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/practice/sessions');

  return (
    <div className="flex h-[100dvh] w-full bg-panel dark:bg-[hsl(224,26%,4%)] justify-center overflow-hidden">
      {/* Mobile emulator wrapper for desktop, fills screen on mobile */}
      <main className="w-full h-full max-w-md bg-ground dark:bg-ground relative shadow-bespoke-lg flex flex-col overflow-hidden sm:border-x sm:border-black/[0.06] dark:border-white/[0.07]">

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
      </main>
    </div>
  );
};
