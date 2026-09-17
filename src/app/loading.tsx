import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center p-5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-black/10 border-t-primary animate-spin" />
        <span className="text-sm font-bold text-tertiary tracking-tight">Loading...</span>
      </div>
    </div>
  );
}
