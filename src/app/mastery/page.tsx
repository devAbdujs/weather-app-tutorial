'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useEffect } from 'react';

export default function MasteryPage() {
  const router = useRouter();
  const { setBackButton } = useTelegram();

  useEffect(() => {
    setBackButton(true, () => router.push('/'));
  }, [setBackButton, router]);

  return (
    <main className="min-h-screen bg-ground text-primary flex flex-col font-sans">
      <div className="w-full max-w-lg mx-auto flex flex-col flex-1 items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="text-2xl font-black text-primary mb-2">Mastery Map</h1>
        <p className="text-secondary font-semibold mb-8 max-w-[260px] leading-relaxed">
          Your personal skill tree is coming soon. Keep practicing to unlock it!
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-primary text-white font-black rounded-2xl active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
