'use client';

import React from 'react';
import { useGamificationStore } from '@/store/useGamificationStore';
import { TemariMascot } from '@/components/mascot/TemariMascot';
import { Zap, Target, Flame, ArrowRight, X } from 'lucide-react';
import { celebrationConfettiPalette } from '@/styles/tokens';
import { sounds } from '@/lib/sounds';

export const CelebrationModal: React.FC = () => {
  const { activeCelebration, dismissCelebration } = useGamificationStore();

  React.useEffect(() => {
    if (activeCelebration) {
      sounds.playCelebration();
      // Dynamically import canvas-confetti only when a celebration fires —
      // keeps it out of the initial JS bundle for all dashboard routes.
      import('canvas-confetti').then(({ default: confetti }) => {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: [...celebrationConfettiPalette],
          });
        } catch {}
      });
    }
  }, [activeCelebration]);

  if (!activeCelebration) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={() => { sounds.playTap(); dismissCelebration(); }}
    >
      <div 
        className="w-full max-w-sm bg-card rounded-hero border border-black/[0.12] dark:border-white/[0.12] border-b-bevel-lg p-6 shadow-2xl animate-scale-bounce text-center relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={() => { sounds.playTap(); dismissCelebration(); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full btn-3d-card flex items-center justify-center text-slate-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mascot Centerpiece */}
        <div className="flex justify-center mb-3 pt-2">
          <TemariMascot 
            mood={activeCelebration.mascotMood || 'celebrating'} 
            size="xl" 
          />
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-1.5">
          {activeCelebration.title}
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto mb-5">
          {activeCelebration.subtitle}
        </p>

        {/* Stats Pill Row */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {activeCelebration.xpEarned > 0 && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-accent-gold/15 border border-accent-gold/30 border-b-2 text-accent-gold font-black text-sm shadow-tactile-xs">
              <Zap className="w-4 h-4 fill-current" />
              <span>+{activeCelebration.xpEarned} XP</span>
            </div>
          )}

          {typeof activeCelebration.accuracy === 'number' && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-accent-emerald/15 border border-accent-emerald/30 border-b-2 text-accent-emerald font-black text-sm shadow-tactile-xs">
              <Target className="w-4 h-4" />
              <span>{activeCelebration.accuracy}%</span>
            </div>
          )}

          {typeof activeCelebration.streakCount === 'number' && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-accent-rose/15 border border-accent-rose/30 border-b-2 text-accent-rose font-black text-sm shadow-tactile-xs">
              <Flame className="w-4 h-4 fill-current" />
              <span>{activeCelebration.streakCount}d</span>
            </div>
          )}
        </div>

        {/* Chunky Tactile 3D Action Button */}
        <button
          onClick={dismissCelebration}
          className="btn-3d-primary w-full py-3.5 rounded-card-sm text-sm flex items-center justify-center gap-2"
        >
          <span>Continue (ቀጥል)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
