"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Flame, FileText, BookMarked, ArrowRight, Target, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { updateDailyStreak } from '@/app/actions/user';
import { useAppStore } from '@/store/useAppStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5)  return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface LastSession {
  subject: string;
  examType: string;
  sessionId: number;
  sessionSize: number;
  mode: string;
  label?: string;
}

const TIP_CACHE_KEY = 'temari_daily_tip';
const TIP_DATE_KEY  = 'temari_tip_date';

export const HomeHub: React.FC = () => {
  const { haptic, setBackButton } = useTelegram();

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get('error') === 'no_questions') {
      const subject = searchParams.get('subject') || 'this subject';
      const year = searchParams.get('year');
      toast.error(`We are still working on adding past papers for ${subject}${year && year !== 'any' ? ' (' + year + ')' : ''}. Try another combination!`);
      // Clean up the URL
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  const userProfile   = useAppStore(s => s.userProfile);
  const profileLoaded = useAppStore(s => s.profileLoaded);
  const setUserProfile = useAppStore(s => s.setUserProfile);
  const setSetupModalType = useAppStore(s => s.setSetupModalType);

  const [lastSession, setLastSession]   = useState<LastSession | null>(null);
  const [tip, setTip]                   = useState<string | null>(null);
  const [tipLoading, setTipLoading]     = useState(false);

  const fetchTip = useCallback(async (force = false) => {
    const today = new Date().toDateString();
    if (!force) {
      try {
        const cachedDate = localStorage.getItem(TIP_DATE_KEY);
        const cachedTip  = localStorage.getItem(TIP_CACHE_KEY);
        if (cachedDate === today && cachedTip) {
          setTip(cachedTip);
          return;
        }
      } catch {}
    }

    setTipLoading(true);
    try {
      const hour   = new Date().getHours();
      const streak = userProfile?.daily_streak || 0;
      const res = await fetch('/api/ai/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType: userProfile?.target_exam, streak, hour }),
      });
      if (!res.ok) throw new Error('tip fetch failed');
      const { tip: newTip } = await res.json();
      setTip(newTip);
      localStorage.setItem(TIP_CACHE_KEY, newTip);
      localStorage.setItem(TIP_DATE_KEY, today);
    } catch {
      setTip('Every question you practice today is one less surprise on exam day.');
    } finally {
      setTipLoading(false);
    }
  }, [userProfile?.target_exam, userProfile?.daily_streak]);

  useEffect(() => {
    setBackButton(false);
    updateDailyStreak().then(res => {
      if (res.success) {
        useAppStore.setState(state => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, daily_streak: res.streak }
            : null,
        }));
      }
    }).catch(() => {});

    try {
      const stored = localStorage.getItem('temari_last_session');
      if (stored) setLastSession(JSON.parse(stored));
    } catch {}
  }, [setBackButton]);

  // Fetch tip once profile is loaded
  useEffect(() => {
    if (profileLoaded && userProfile) fetchTip();
  }, [profileLoaded, userProfile, fetchTip]);

  if (!profileLoaded) return null;

  if (userProfile?.target_exam === null) {
    return (
      <WelcomeOnboarding
        onComplete={({ target, stream }) => setUserProfile({ target_exam: target, stream })}
      />
    );
  }

  const examLabel = (t: string | null) => {
    if (t === 'entrance') return 'Grade 12 EUEE';
    if (t === 'freshman') return 'University Freshman';
    if (t === 'exit') return 'University Exit Exam';
    return 'Exam Prep';
  };

  const streak    = userProfile?.daily_streak || 0;
  const firstName = userProfile?.first_name || 'Scholar';

  const handleContinue = () => {
    if (!lastSession) return;
    haptic.impact('heavy');
    const params = new URLSearchParams({
      examType:      lastSession.examType,
      subject:       lastSession.subject,
      sessionSize:   lastSession.sessionSize.toString(),
      sessionOffset: ((lastSession.sessionId - 1) * lastSession.sessionSize).toString(),
      mode:          lastSession.mode,
    });
    router.push(`/exam/session?${params.toString()}`);
  };

  return (
    <div className="flex flex-col animate-fade-in max-w-lg mx-auto w-full pb-8">

      {/* ── 1. GREETING & STREAK HEADER ── */}
      <div className="px-5 pt-4 pb-3 flex justify-between items-center">
        <div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest" suppressHydrationWarning>
            {getGreeting()} 👋
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none mt-1">
            {firstName}
          </h1>
        </div>

        {/* Streak Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-colors ${
          streak > 0
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm'
            : 'bg-card border-black/5 dark:border-white/[0.08] text-slate-400 dark:text-slate-500'
        }`}>
          <Flame className={`w-4 h-4 ${streak > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
          <span className="text-sm font-black font-mono leading-none">{streak}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">day{streak !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── 2. ACADEMIC GOAL CHIP ── */}
      <div className="px-5 mb-4">
        <button
          onClick={() => { haptic.selection(); router.push('/profile'); }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 dark:bg-primary/20 border border-primary/20 text-primary dark:text-blue-400 text-xs font-bold transition-all active:scale-[0.98]"
        >
          <Target className="w-3.5 h-3.5 shrink-0" />
          <span>{examLabel(userProfile?.target_exam || null)}</span>
          <ArrowRight className="w-3 h-3 opacity-60 ml-0.5" />
        </button>
      </div>

      <div className="px-5 space-y-4">

        {/* ── 3. HERO LAUNCHPAD ── */}
        <button
          onClick={() => { haptic.impact('heavy'); router.push('/practice'); }}
          className="w-full group bg-gradient-to-br from-primary to-blue-700 p-5 rounded-[24px] shadow-md shadow-primary/20 active:scale-[0.98] transition-all text-left relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <div className="relative z-10">
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">
              31,000+ Past Exam Questions
            </p>
            <h2 className="text-xl font-black text-white tracking-tight mb-4">
              Practice & Exam Simulator
            </h2>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="bg-white text-primary px-4 py-2 rounded-xl font-black text-xs shadow-sm flex items-center gap-1.5 group-hover:scale-105 transition-transform">
              Start Practicing
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>

        {/* ── 4. RESUME SESSION (IF ACTIVE) ── */}
        {lastSession && (
          <button
            onClick={handleContinue}
            className="w-full group bg-card p-4 rounded-[22px] border border-black/5 dark:border-white/[0.08] hover:border-primary/30 shadow-sm active:scale-[0.98] transition-all text-left flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Resume Study</p>
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm leading-snug">{lastSession.subject}</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{lastSession.label || 'Session'} • {lastSession.mode} mode</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* ── 5. BENTO QUICK TOOLS ── */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { haptic.impact('medium'); router.push('/practice?mode=notes'); }}
            className="group bg-card p-3.5 rounded-[22px] border border-black/5 dark:border-white/[0.08] hover:border-primary/30 shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-10 h-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 leading-tight">Short Notes</h3>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">Summaries</p>
          </button>

          <button
            onClick={() => { haptic.impact('medium'); router.push('/practice?mode=flashcards'); }}
            className="group bg-card p-3.5 rounded-[22px] border border-black/5 dark:border-white/[0.08] hover:border-primary/30 shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 leading-tight">Flashcards</h3>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">Speed Review</p>
          </button>

          <button
            onClick={() => { haptic.impact('medium'); router.push('/notebook/All'); }}
            className="group bg-card p-3.5 rounded-[22px] border border-black/5 dark:border-white/[0.08] hover:border-primary/30 shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-10 h-10 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <BookMarked className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 leading-tight">Notebook</h3>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">Saved Qs</p>
          </button>
        </div>

        {/* ── 6. TEMARI AI DAILY SPARK ── */}
        <div className="bg-card border border-black/5 dark:border-white/[0.08] rounded-[24px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Temari AI Daily Tip
              </span>
            </div>
            <button
              onClick={() => { haptic.selection(); fetchTip(true); }}
              className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-slate-400"
              title="Get a new tip"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tipLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {tipLoading ? (
            <div className="space-y-2 py-1">
              <div className="h-3 bg-black/5 dark:bg-white/5 rounded-full animate-pulse w-full" />
              <div className="h-3 bg-black/5 dark:bg-white/5 rounded-full animate-pulse w-3/4" />
            </div>
          ) : tip ? (
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed animate-fade-in pl-1">
              {tip}
            </p>
          ) : null}
        </div>

      </div>
    </div>
  );
};
