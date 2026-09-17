'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-full max-w-sm bg-card border border-black/5 rounded-[32px] p-8 shadow-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-black text-primary tracking-tight mb-2">Page Not Found</h2>
        <p className="text-sm font-medium text-tertiary mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="w-full h-14 bg-primary text-white rounded-[16px] font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
