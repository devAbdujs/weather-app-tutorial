'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { logoutAdmin } from '@/app/actions/admin';

export function LogoutButton() {
  return (
    <button 
      onClick={async () => {
        await logoutAdmin();
        window.location.href = '/admin';
      }}
      className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl hover:bg-error/10 text-error transition-all duration-150 ease-bespoke font-medium text-sm"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
