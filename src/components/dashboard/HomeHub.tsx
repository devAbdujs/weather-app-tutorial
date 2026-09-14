"use client";
import React, { useEffect } from 'react';
import { PenLine, BookMarked, TreeDeciduous, Flame, ChevronRight, FileText } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { } from '@/utils/supabase/client';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';

export const HomeHub: React.FC = () => {
  const { user, haptic } = useTelegram();
  const router = useRouter();
  const userProfile = useAppStore(s => s.userProfile);
  const profileLoaded = useAppStore(s => s.profileLoaded);
  const setUserProfile = useAppStore(s => s.setUserProfile);
  const setSetupModalType = useAppStore(s => s.setSetupModalType);

  useEffect(() => {
    // Hide Telegram native back button on the Hub
    setBackButton(false);
  }, [setBackButton]);

  // Profile is guaranteed to exist because of StoreInitializer
  if (!profileLoaded) return null;

  if (userProfile?.target_exam === null) {
    return (
      <WelcomeOnboarding
        onComplete={({ target, stream }) => {
          setUserProfile({ target_exam: target, stream });
        }}
      />
    );
  }

  const getExamLabel = (t: string | null) => {
    if (t === 'entrance') return 'Grade 12 Entrance';
    if (t === 'freshman') return 'University Freshman';
    if (t === 'exit') return 'Exit Exam';
    return 'Exam Prep';
  };

  return (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 overflow-y-auto animate-fade-in custom-scrollbar">
      {/* ── HEADER ── */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight leading-none mb-1">
            Hi, {userProfile?.first_name || 'Scholar'} 👋
          </h1>
          <p className="text-sm font-bold text-tertiary">
            {getExamLabel(userProfile?.target_exam || null)} • {userProfile?.stream || 'No Stream'}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center bg-card border-2 border-black/5 px-3 py-1.5 rounded-[16px] shadow-sm">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Flame className={`w-4 h-4 ${(userProfile?.daily_streak || 0) > 0 ? 'text-accent-amber fill-accent-amber' : 'text-tertiary'}`} />
            <span className={`text-base font-black leading-none ${(userProfile?.daily_streak || 0) > 0 ? 'text-primary' : 'text-tertiary'}`}>
              {userProfile?.daily_streak || 0}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-tertiary leading-none">Streak</span>
        </div>
      </header>

      {/* ── ACTION GRID ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => { haptic.impact('heavy'); setSetupModalType('exam'); }}
          className="col-span-2 group bg-card p-5 rounded-[24px] border-2 border-black/5 hover:border-primary/20 shadow-sm active:scale-[0.98] transition-all text-left relative overflow-hidden focus-ring"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-[16px] flex items-center justify-center mb-4">
                <PenLine className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-black text-primary mb-1">Practice & Exams</h2>
              <p className="text-sm font-bold text-tertiary">Real past papers</p>
            </div>
            <ChevronRight className="w-6 h-6 text-tertiary group-hover:text-primary transition-colors group-hover:translate-x-1" />
          </div>
        </button>

        <button
          onClick={() => { haptic.impact('medium'); setSetupModalType('notes'); }}
          className="group bg-card p-4 rounded-[20px] border-2 border-black/5 hover:border-purple-500/20 shadow-sm active:scale-[0.96] transition-all text-left focus-ring"
        >
          <div className="w-10 h-10 bg-purple-500/10 rounded-[14px] flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-base font-black text-primary leading-tight mb-1">Short Notes</h2>
          <p className="text-xs font-bold text-tertiary">Quick summaries</p>
        </button>

        <button
          onClick={() => { haptic.impact('medium'); setSetupModalType('flashcards'); }}
          className="group bg-card p-4 rounded-[20px] border-2 border-black/5 hover:border-accent-amber/30 shadow-sm active:scale-[0.96] transition-all text-left focus-ring"
        >
          <div className="w-10 h-10 bg-accent-amber/10 rounded-[14px] flex items-center justify-center mb-3">
            <BookMarked className="w-5 h-5 text-accent-amber" />
          </div>
          <h2 className="text-base font-black text-primary leading-tight mb-1">My Notebook</h2>
          <p className="text-xs font-bold text-tertiary">Saved highlights</p>
        </button>

        <button
          onClick={() => { haptic.impact('light'); router.push('/mastery'); }}
          className="col-span-2 group bg-primary/5 p-4 rounded-[20px] border-2 border-primary/10 hover:border-primary/20 shadow-sm active:scale-[0.98] transition-all text-left flex items-center gap-4 focus-ring"
        >
          <div className="w-12 h-12 bg-card rounded-[14px] flex items-center justify-center shadow-sm border border-black/5 shrink-0">
            <TreeDeciduous className="w-6 h-6 text-accent-emerald" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-primary mb-0.5">Mastery Map</h2>
            <p className="text-xs font-bold text-secondary">Track your syllabus progress</p>
          </div>
          <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-primary transition-colors group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
