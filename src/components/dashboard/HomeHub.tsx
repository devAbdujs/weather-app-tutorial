"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Flame, FileText, BookMarked, ArrowRight, Target, Sparkles, RefreshCw } from 'lucide-react';
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
    <div className="flex flex-col animate-fade-in">

      {/* ── GREETING HERO ── */}
      <div className="px-5 pt-5 pb-4 flex justify-between items-center">
        <div>
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest" suppressHydrationWarning>
            {getGreeting()} 👋
          </p>
          <h1 className="text-[28px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none mt-1">
            {firstName}
          </h1>
        </div>
        {/* Streak pill */}
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-[14px] border ${
          streak > 0
            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50'
            : 'bg-card dark:bg-card border-black/5 dark:border-white/8'
        }`}>
          <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-500 fill-amber-400' : 'text-gray-500 dark:text-gray-400'}`} />
          <span className={`text-sm font-black ${streak > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>{streak}</span>
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">day{streak !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── EXAM TYPE BADGE ── */}
      <div className="mx-5 mb-5">
        <div className="bg-primary/5 dark:bg-primary/15 border border-primary/10 dark:border-primary/25 rounded-[14px] px-4 py-2.5 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-gray-900/50 dark:text-gray-100/50 dark:text-gray-100/50 shrink-0" />
          <span className="text-xs font-bold text-gray-900/60 dark:text-gray-100/60 dark:text-gray-100/60">{examLabel(userProfile?.target_exam || null)}</span>
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* ── HERO CTA (Always present) ── */}
        <button
          onClick={() => { haptic.impact('heavy'); router.push('/practice'); }}
          className="w-full group bg-primary p-5 rounded-[24px] shadow-lg active:scale-[0.97] transition-all text-left relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">31,000+ real past papers</p>
            <h2 className="text-[22px] font-black text-white tracking-tight mb-4">Practice & Exams</h2>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="bg-white text-primary px-4 py-2 rounded-full font-black text-[13px] shadow-sm flex items-center gap-1.5 group-hover:scale-105 transition-transform">
              Start Practicing
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center group-hover:bg-white/25 transition-colors backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>

        {/* ── CONTINUE ROW ── */}
        {lastSession && (
          <button
            onClick={handleContinue}
            className="w-full group bg-card dark:bg-card p-4 rounded-[20px] border border-black/5 dark:border-white/8 hover:border-primary/20 shadow-sm active:scale-[0.97] transition-all text-left flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">Resume</p>
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">{lastSession.subject}</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{lastSession.label || 'Session'} • {lastSession.mode} mode</p>
            </div>
            <div className="w-10 h-10 bg-primary/5 dark:bg-primary/15 rounded-[12px] flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
              <ArrowRight className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            </div>
          </button>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { haptic.impact('medium'); router.push('/practice?mode=notes'); }}
            className="group bg-card dark:bg-card p-5 rounded-[20px] border border-black/5 dark:border-white/8 hover:border-primary/20 shadow-sm active:scale-[0.96] transition-all text-left"
          >
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-[12px] flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-[14px] font-black text-gray-900 dark:text-gray-100 leading-tight">Short Notes</h3>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">AI summaries</p>
          </button>

          <button
            onClick={() => { haptic.impact('medium'); router.push('/notebook/All'); }}
            className="group bg-card dark:bg-card p-5 rounded-[20px] border border-black/5 dark:border-white/8 hover:border-primary/20 shadow-sm active:scale-[0.96] transition-all text-left"
          >
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-[12px] flex items-center justify-center mb-3 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50 transition-colors">
              <BookMarked className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-[14px] font-black text-gray-900 dark:text-gray-100 leading-tight">My Notebook</h3>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">Saved questions</p>
          </button>
        </div>

        {/* ── AI DAILY TIP ── */}
        <div className="bg-card dark:bg-card border border-black/5 dark:border-white/8 rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Daily Insight</span>
            </div>
            <button
              onClick={() => { haptic.selection(); fetchTip(true); }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 dark:bg-white/5 dark:hover:bg-white/10 active:scale-90 transition-all"
              title="Get a new tip"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 ${tipLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {tipLoading ? (
            <div className="space-y-2">
              <div className="h-3.5 bg-black/5 dark:bg-white/8 rounded-full animate-pulse w-full" />
              <div className="h-3.5 bg-black/5 dark:bg-white/8 rounded-full animate-pulse w-4/5" />
            </div>
          ) : tip ? (
            <p className="text-sm font-medium text-gray-900/80 dark:text-gray-100/80 dark:text-gray-100/80 leading-relaxed animate-fade-in">
              {tip}
            </p>
          ) : null}
        </div>

      </div>
    </div>
  );
};
