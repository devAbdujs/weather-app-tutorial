'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-full max-w-sm bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[32px] p-8 shadow-bespoke-md flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">Page Not Found</h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="w-full h-14 bg-primary text-white rounded-[16px] font-bold shadow-bespoke-md active:scale-[0.98] transition-all duration-200 ease-bespoke flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
