import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full bg-ground overflow-hidden">
      <DesktopSidebar />
      <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar">
        {/* We keep a max-width wrapper inside the main content area so text doesn't stretch infinitely on ultrawide monitors, but we increase it from max-w-lg (phone) to max-w-5xl (desktop). */}
        <div className="w-full max-w-5xl mx-auto min-h-full flex flex-col relative">
          {children}
        </div>
      </main>
    </div>
  );
};
