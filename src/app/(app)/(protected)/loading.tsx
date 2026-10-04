import React from 'react';

export default function ProtectedLoading() {
  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-5 space-y-4 animate-fade-in">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="h-9 w-28 bg-black/[0.06] dark:bg-white/[0.08] rounded-xl animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-16 bg-black/[0.06] dark:bg-white/[0.08] rounded-xl animate-pulse" />
          <div className="h-9 w-9 bg-black/[0.06] dark:bg-white/[0.08] rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Hero card skeleton */}
      <div className="w-full h-36 bg-black/[0.05] dark:bg-white/[0.06] rounded-hero p-5 flex flex-col justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-black/[0.08] dark:bg-white/[0.1] rounded-md" />
          <div className="h-6 w-48 bg-black/[0.1] dark:bg-white/[0.12] rounded-md" />
        </div>
        <div className="h-8 w-24 bg-black/[0.08] dark:bg-white/[0.1] rounded-btn" />
      </div>

      {/* Grid items skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 bg-black/[0.04] dark:bg-white/[0.05] rounded-card-sm p-4 animate-pulse" />
        <div className="h-28 bg-black/[0.04] dark:bg-white/[0.05] rounded-card-sm p-4 animate-pulse" />
      </div>

      {/* List item skeleton */}
      <div className="space-y-2.5 pt-2">
        <div className="h-16 w-full bg-black/[0.04] dark:bg-white/[0.05] rounded-card p-4 animate-pulse" />
        <div className="h-16 w-full bg-black/[0.04] dark:bg-white/[0.05] rounded-card p-4 animate-pulse" />
      </div>
    </div>
  );
}
