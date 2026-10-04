import React from 'react';

export default function NotesLoading() {
  return (
    <div className="min-h-screen bg-ground pb-28 text-foreground animate-fade-in">
      {/* Header bar skeleton */}
      <div className="sticky top-0 z-10 bg-ground/90 dark:bg-ground/95 backdrop-blur-xl border-b border-black/5 dark:border-white/8 px-5 pt-safe pt-5 pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-btn bg-black/[0.06] dark:bg-white/[0.08] animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-6 w-36 bg-black/[0.08] dark:bg-white/[0.1] rounded-md animate-pulse" />
            <div className="h-3.5 w-24 bg-black/[0.04] dark:bg-white/[0.06] rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Chapters list skeleton */}
      <div className="px-5 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-full h-20 bg-card rounded-card-lg border border-black/[0.08] dark:border-white/[0.08] p-4 flex items-center gap-3.5 animate-pulse"
          >
            <div className="w-10 h-10 rounded-btn bg-black/[0.06] dark:bg-white/[0.08] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-black/[0.08] dark:bg-white/[0.1] rounded" />
              <div className="h-3 w-1/3 bg-black/[0.04] dark:bg-white/[0.06] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
