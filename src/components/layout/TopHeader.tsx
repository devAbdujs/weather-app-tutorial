'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export const TopHeader = () => {
  const pathname = usePathname() || '';
  const userProfile = useAppStore(s => s.userProfile);

  // Hide TopHeader during active focus modes so it doesn't block full-screen UIs
  const isFocusMode = pathname.startsWith('/exam/') || pathname.startsWith('/notebook/') || pathname.startsWith('/notes/');
  if (isFocusMode) return null;

  const initial = userProfile?.first_name ? userProfile.first_name.charAt(0).toUpperCase() : 'T';

  return (
    <header className="w-full h-14 bg-ground/90 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-4 z-40 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[8px] overflow-hidden shadow-sm border border-black/5">
          <img src="/assets/temari logo.png" alt="Temari" className="w-full h-full object-cover" />
        </div>
        <span className="font-black text-primary text-[17px] tracking-tight">Temari</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10 text-primary font-black text-sm">
        {initial}
      </div>
    </header>
  );
};
