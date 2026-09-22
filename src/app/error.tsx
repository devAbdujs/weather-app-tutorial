'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-full max-w-sm bg-card border border-black/5 dark:border-white/10 rounded-[32px] p-8 shadow-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">Something went wrong</h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
          We encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          className="w-full h-14 bg-primary text-white rounded-[16px] font-bold shadow-md active:scale-[0.98] active:opacity-80 transition-transform flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
