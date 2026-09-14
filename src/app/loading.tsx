import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-ground w-full flex flex-col p-5 space-y-6 pt-safe">
      
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mt-2">
        <div className="space-y-2">
          <div className="h-4 w-12 bg-black/5 rounded animate-pulse" />
          <div className="h-6 w-32 bg-black/5 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 bg-black/5 rounded-full animate-pulse" />
          <div className="h-9 w-9 bg-black/5 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main Stats Card Skeleton */}
      <div className="w-full h-36 bg-black/5 rounded-[24px] border-2 border-black/5 animate-pulse mt-4" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="h-32 bg-black/5 rounded-[24px] border-2 border-black/5 animate-pulse" />
        <div className="h-32 bg-black/5 rounded-[24px] border-2 border-black/5 animate-pulse" />
        <div className="h-32 bg-black/5 rounded-[24px] border-2 border-black/5 animate-pulse" />
        <div className="h-32 bg-black/5 rounded-[24px] border-2 border-black/5 animate-pulse" />
      </div>

    </div>
  );
}
