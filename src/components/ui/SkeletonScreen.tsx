import React from 'react';

export const SkeletonScreen = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="min-h-screen bg-ground w-full flex flex-col p-5 space-y-6 pt-safe animate-fade-in">
      
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mt-2">
        <div className="space-y-2">
          <div className="h-4 w-12 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
          <div className="h-6 w-32 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
          <div className="h-9 w-9 bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Loading Message */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4">
        <div className="w-8 h-8 border-3 border-black/10 dark:border-white/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{message}</p>
      </div>

      {/* Main Stats Card Skeleton */}
      <div className="w-full h-36 bg-black/5 dark:bg-white/5 rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] animate-pulse mt-4" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] animate-pulse" />
        <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] animate-pulse" />
        <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] animate-pulse" />
        <div className="h-32 bg-black/5 dark:bg-white/5 rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] animate-pulse" />
      </div>

    </div>
  );
};
