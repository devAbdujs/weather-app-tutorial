'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { logoutAdmin } from '@/app/actions/admin';

export function LogoutButton() {
  return (
    <button 
      onClick={async () => {
        await logoutAdmin();
        window.location.reload();
      }}
      className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-error/20 text-error transition-colors font-bold text-sm"
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </button>
  );
}
