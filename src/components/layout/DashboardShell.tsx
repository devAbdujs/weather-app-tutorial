import React from 'react';
import { BottomNav } from './BottomNav';
import { TopHeader } from './TopHeader';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-[100dvh] w-full bg-[#EFEFF3] justify-center overflow-hidden">
      {/* Mobile emulator wrapper for desktop, fills screen on mobile */}
      <main className="w-full h-full max-w-md bg-ground relative shadow-2xl flex flex-col overflow-hidden sm:border-x sm:border-black/5">
        
        {/* Global Branding Header */}
        <TopHeader />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
          <div className="w-full min-h-full flex flex-col relative">
            {children}
          </div>
        </div>

        {/* Fixed Mobile Bottom Nav */}
        <BottomNav />
      </main>
    </div>
  );
};
