'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-full max-w-sm bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-modal p-8 shadow-tactile-md flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-black text-foreground tracking-tight mb-2">Page Not Found</h2>
        <p className="text-sm font-medium text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-black shadow-tactile-sm active:translate-y-0.5 border-2 border-b-[4px] border-primary/80 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4 stroke-[2.5]" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
