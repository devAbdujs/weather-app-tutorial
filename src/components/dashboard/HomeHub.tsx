"use client";
import React, { useEffect } from 'react';
import { PenLine, BookMarked, TreeDeciduous, Flame, ChevronRight, FileText } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { } from '@/utils/supabase/client';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const HomeHub: React.FC = () => {
  const { user, haptic, setBackButton } = useTelegram();
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
          <h1 className="text-2xl font-black text-primary tracking-tight leading-none mb-1" suppressHydrationWarning>
            {getGreeting()}, {userProfile?.first_name || 'Scholar'} 👋
          </h1>
          <p className="text-sm font-bold text-tertiary">
            {getExamLabel(userProfile?.target_exam || null)} • {userProfile?.stream || 'No Stream'}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center bg-card border border-black/5 px-3 py-1.5 rounded-[16px] shadow-sm">
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
      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={() => { haptic.impact('heavy'); setSetupModalType('exam'); }}
          className="w-full group bg-primary p-6 rounded-[24px] shadow-md active:translate-y-1 active:shadow-none transition-all text-left relative overflow-hidden focus-ring flex items-center justify-between border border-primary/20"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
          <div className="relative z-10">
            <h2 className="text-[22px] font-black text-white mb-1 tracking-tight">Practice & Exams</h2>
            <p className="text-[13px] font-medium text-white/80">31,000+ real past papers</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors">
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { haptic.impact('medium'); setSetupModalType('notes'); }}
            className="group bg-card p-5 rounded-[20px] border border-black/5 hover:border-accent-blue/30 shadow-sm active:scale-[0.96] transition-all text-left flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-10 h-10 bg-primary/5 rounded-[12px] flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-primary leading-tight mb-0.5">Short Notes</h2>
              <p className="text-[11px] font-bold text-tertiary">Quick summaries</p>
            </div>
          </button>

          <button
            onClick={() => { haptic.impact('medium'); setSetupModalType('flashcards'); }}
            className="group bg-card p-5 rounded-[20px] border border-black/5 hover:border-accent-blue/30 shadow-sm active:scale-[0.96] transition-all text-left flex flex-col justify-between min-h-[110px]"
          >
            <div className="w-10 h-10 bg-primary/5 rounded-[12px] flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
              <BookMarked className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-primary leading-tight mb-0.5">My Notebook</h2>
              <p className="text-[11px] font-bold text-tertiary">Saved highlights</p>
            </div>
          </button>
        </div>

        <button
          onClick={() => { haptic.impact('light'); router.push('/mastery'); }}
          className="w-full group bg-card p-4 rounded-[20px] border border-black/5 hover:border-accent-blue/30 shadow-sm active:scale-[0.98] transition-all text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary/5 rounded-[14px] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <TreeDeciduous className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-[16px] font-black text-primary mb-0.5">Mastery Map</h2>
            <p className="text-xs font-bold text-tertiary">Track your syllabus progress</p>
          </div>
          <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-primary transition-colors group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
