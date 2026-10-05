'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('[Temari Application Error]:', error);
  }, [error]);

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const handleClearCacheAndReset = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        window.location.href = '/';
      }
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-5 text-center animate-fade-in">
      <div className="w-full max-w-sm bg-card border border-black/[0.08] dark:border-white/[0.08] rounded-modal p-6 shadow-tactile-md flex flex-col items-center">
        <div className="w-14 h-14 bg-red-500/10 border-2 border-red-500/20 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>

        <h2 className="text-xl font-black text-foreground tracking-tight mb-2">
          Something went wrong
        </h2>

        <p className="text-xs font-semibold text-muted-foreground mb-4 leading-relaxed">
          {error?.message && error.message !== 'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A hash of the error is shown below.'
            ? error.message
            : 'We encountered an unexpected error while loading this screen.'}
        </p>

        {error?.digest && (
          <div className="w-full mb-3 p-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono text-muted-foreground break-all select-all">
            Ref: {error.digest}
          </div>
        )}

        {(error?.stack || error?.message) && (
          <div className="w-full mb-4">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-bold text-muted-foreground flex items-center justify-center gap-1 mx-auto hover:text-foreground transition-colors"
            >
              <span>{showDetails ? 'Hide Diagnostics' : 'Show Diagnostics'}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showDetails && (
              <div className="mt-2 p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-[10px] font-mono text-left text-muted-foreground overflow-x-auto max-h-40 whitespace-pre-wrap select-all">
                {error.stack || error.message}
              </div>
            )}
          </div>
        )}

        <div className="w-full space-y-2.5">
          <button
            onClick={reset}
            className="w-full h-12 bg-gray-950 hover:bg-black text-white dark:bg-white dark:text-gray-950 rounded-2xl font-black shadow-tactile-sm active:translate-y-0.5 border-2 border-b-[4px] border-black dark:border-white transition-all flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            Try Again
          </button>

          <button
            onClick={handleGoHome}
            className="w-full h-11 bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 rounded-2xl font-bold border border-black/10 dark:border-white/10 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>

          <button
            onClick={handleClearCacheAndReset}
            className="w-full h-10 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl font-bold border border-red-500/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Cache &amp; Reset
          </button>
        </div>
      </div>
    </div>
  );
}
