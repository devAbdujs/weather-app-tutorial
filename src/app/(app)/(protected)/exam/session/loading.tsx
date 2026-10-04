import React from 'react';

export default function ExamSessionLoading() {
  return (
    <div className="min-h-screen bg-ground p-4 max-w-lg mx-auto flex flex-col justify-between animate-fade-in">
      {/* Top Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/8">
        <div className="w-10 h-10 rounded-btn bg-black/[0.06] dark:bg-white/[0.08] animate-pulse" />
        <div className="h-6 w-24 bg-black/[0.06] dark:bg-white/[0.08] rounded-full animate-pulse" />
        <div className="w-16 h-8 rounded-btn bg-black/[0.06] dark:bg-white/[0.08] animate-pulse" />
      </div>

      {/* Question Card skeleton */}
      <div className="my-auto py-6 space-y-5">
        <div className="h-4 w-28 bg-black/[0.05] dark:bg-white/[0.06] rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-full bg-black/[0.08] dark:bg-white/[0.1] rounded animate-pulse" />
          <div className="h-5 w-5/6 bg-black/[0.08] dark:bg-white/[0.1] rounded animate-pulse" />
          <div className="h-5 w-2/3 bg-black/[0.08] dark:bg-white/[0.1] rounded animate-pulse" />
        </div>

        {/* Options skeleton */}
        <div className="space-y-2.5 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 w-full bg-card rounded-card border border-black/[0.06] dark:border-white/[0.08] animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Bottom Nav skeleton */}
      <div className="pt-4 flex gap-3">
        <div className="h-12 flex-1 bg-black/[0.06] dark:bg-white/[0.08] rounded-card-sm animate-pulse" />
        <div className="h-12 flex-1 bg-black/[0.06] dark:bg-white/[0.08] rounded-card-sm animate-pulse" />
      </div>
    </div>
  );
}
