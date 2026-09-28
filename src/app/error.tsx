'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Temari Application Error]:', error);
  }, [error]);

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-full max-w-sm bg-card border border-black/[0.08] dark:border-white/[0.08] rounded-modal p-7 shadow-tactile-md flex flex-col items-center">
        <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/20 rounded-2xl flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          Something went wrong
        </h2>

        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          We encountered an unexpected error while loading this screen.
        </p>

        {error?.digest && (
          <div className="w-full mb-6 p-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono text-gray-500 dark:text-gray-400 break-all select-all">
            Ref: {error.digest}
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={reset}
            className="w-full h-13 bg-gray-950 hover:bg-black text-white dark:bg-white dark:text-gray-950 rounded-2xl font-black shadow-tactile-sm active:translate-y-0.5 border-2 border-b-[4px] border-black dark:border-white transition-all flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            Try Again
          </button>

          <button
            onClick={handleGoHome}
            className="w-full h-12 bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 rounded-2xl font-bold border border-black/10 dark:border-white/10 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
