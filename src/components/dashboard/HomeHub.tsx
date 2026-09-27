"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Flame, FileText, ArrowRight, Target, Sparkles, RefreshCw, Zap, BarChart2, CheckCircle2 } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { updateDailyStreak } from '@/app/actions/user';
import { useAppStore } from '@/store/useAppStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { TemariMascot, MascotBubble } from '@/components/mascot/TemariMascot';
import { useGamificationStore, getLevelForXp } from '@/store/useGamificationStore';
import { sounds } from '@/lib/sounds';

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

  const { xp, dailyXp, dailyXpGoal } = useGamificationStore();
  const currentLevel = getLevelForXp(xp);
  const dailyPercent = Math.min(100, Math.round((dailyXp / dailyXpGoal) * 100));

  return (
    <div className="flex flex-col animate-fade-in max-w-lg mx-auto w-full pb-8">

      {/* ── 1. GREETING & GAMIFIED IDENTITY HEADER ── */}
      <div className="px-5 pt-4 pb-2 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest" suppressHydrationWarning>
            <span>{getGreeting()}</span>
            <span>•</span>
            <span className="text-primary font-black">{currentLevel.badge} Lv.{currentLevel.level}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none mt-1">
            {firstName}
          </h1>
        </div>

        {/* Streak & XP Badges */}
        <div className="flex items-center gap-2">
          {/* Target Exam Chip */}
          <button
            onClick={() => { sounds.playTap(); router.push('/profile'); }}
            className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary text-xs font-black transition-all active:scale-95"
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[100px]">{examLabel(userProfile?.target_exam || null)}</span>
          </button>

          {/* Flame Pill */}
          <div 
            onClick={() => { sounds.playStreak(); router.push('/mastery'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 border-b-[3px] transition-all cursor-pointer active:translate-y-[1px] active:border-b-2 ${
              streak > 0
                ? 'bg-accent-gold/15 border-accent-gold/30 text-accent-gold shadow-sm'
                : 'bg-card border-black/[0.08] dark:border-white/[0.08] text-slate-400 dark:text-slate-500'
            }`}
          >
            <Flame className={`w-4 h-4 ${streak > 0 ? 'fill-accent-gold text-accent-gold animate-pulse' : 'text-slate-400'}`} />
            <span className="text-sm font-black font-mono leading-none">{streak}</span>
            <span className="text-[10px] font-black uppercase tracking-wider">d</span>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4 mt-2">

        {/* ── 2. MASCOT STUDY BUDDY GREETING (TEME SPEECH BUBBLE) ── */}
        <MascotBubble
          mood={streak > 0 ? 'streak_fire' : 'happy'}
          message={
            streak > 0 
              ? `You're on a ${streak}-day streak, ${firstName}! 🔥` 
              : `ሰላም ${firstName}! Let's build your study habit!`
          }
          subtext={
            streak > 0 
              ? `Complete today's practice set to protect your flame and earn +20 XP!` 
              : `Pick a subject below to take your first test and earn your daily badge.`
          }
          action={{
            label: streak > 0 ? 'Practice Now ⚡' : 'Start Goal 🎯',
            onClick: () => {
              sounds.playTap();
              haptic.impact('heavy');
              router.push('/practice');
            }
          }}
        />

        {/* ── 3. DAILY QUEST XP GOAL METER ── */}
        <div className="card-chunky p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-accent-gold/15 text-accent-gold border border-accent-gold/30 flex items-center justify-center font-black text-xs">
                ⚡
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 leading-tight">
                  Daily Quest Goal
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {dailyXp >= dailyXpGoal ? 'Goal achieved! You are on fire 🔥' : 'Earn XP by solving past questions'}
                </p>
              </div>
            </div>

            <span className="font-mono font-black text-xs text-gray-900 dark:text-gray-100 tabular-nums">
              {dailyXp} <span className="text-slate-400 font-normal">/ {dailyXpGoal} XP</span>
            </span>
          </div>

          {/* Chunky Progress Trough */}
          <div className="w-full bg-panel border-2 border-black/[0.06] dark:border-white/[0.08] h-3.5 rounded-full overflow-hidden p-0.5 relative">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-accent-gold via-accent-amber to-accent-emerald transition-all duration-500 ease-bespoke"
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
        </div>

        {/* ── 4. CHUNKY 3D HERO LAUNCHPAD ── */}
        <button
          onClick={() => { sounds.playTap(); haptic.impact('heavy'); router.push('/practice'); }}
          className="w-full text-left p-5 rounded-[26px] bg-primary text-white border-b-[6px] border-[hsl(224,75%,20%)] active:translate-y-[3px] active:border-b-[2px] transition-all relative overflow-hidden group shadow-md"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/[0.08] rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-black uppercase tracking-widest mb-1.5 border border-white/20">
              <Zap className="w-3 h-3 fill-accent-gold text-accent-gold" />
              <span>31,000+ Past Exam Papers</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mb-4">
              Practice &amp; Exam Simulator
            </h2>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="bg-white text-primary px-4 py-2.5 rounded-[16px] font-black text-xs shadow-sm flex items-center gap-1.5 group-hover:scale-[1.03] transition-transform duration-150">
              Start Practicing
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="w-10 h-10 bg-white/[0.15] rounded-[16px] flex items-center justify-center group-hover:bg-white/[0.22] transition-colors duration-150">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>

        {/* ── 5. RESUME STUDY SESSION (IF ACTIVE) ── */}
        {lastSession && (
          <button
            onClick={() => { sounds.playTap(); handleContinue(); }}
            className="w-full btn-3d-card p-4 rounded-[22px] text-left flex items-center justify-between transition-all"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-accent-gold uppercase tracking-widest mb-0.5">
                <Flame className="w-3 h-3 fill-current" />
                <span>Resume Active Study</span>
              </div>
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm leading-snug">{lastSession.subject}</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{lastSession.label || 'Session'} • {lastSession.mode} mode</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* ── 6. BENTO QUICK TOOLS (TACTILE 3D TILES) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Short Notes */}
          <button
            onClick={() => { sounds.playTap(); haptic.impact('medium'); router.push('/practice?mode=notes'); }}
            className="btn-3d-card p-4 rounded-[24px] text-left group"
          >
            <div className="w-11 h-11 bg-accent-purple/15 text-accent-purple border-2 border-b-[3px] border-accent-purple/30 rounded-[16px] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 leading-tight">Short Notes</h3>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">Summaries &amp; Concepts</p>
            <div className="mt-2 text-[10px] font-black text-accent-purple inline-block bg-accent-purple/10 px-2 py-0.5 rounded-full">
              +20 XP / unit
            </div>
          </button>

          {/* Flashcards */}
          <button
            onClick={() => { sounds.playTap(); haptic.impact('medium'); router.push('/practice?mode=flashcards'); }}
            className="btn-3d-card p-4 rounded-[24px] text-left group"
          >
            <div className="w-11 h-11 bg-accent-gold/15 text-accent-gold border-2 border-b-[3px] border-accent-gold/30 rounded-[16px] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 leading-tight">Flashcards</h3>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">Rapid-Fire Drills</p>
            <div className="mt-2 text-[10px] font-black text-accent-gold inline-block bg-accent-gold/10 px-2 py-0.5 rounded-full">
              +15 XP / deck
            </div>
          </button>
        </div>

        {/* ── 7. TEMARI AI DAILY SPARK WITH MASCOT ── */}
        <div className="card-chunky p-4.5 bg-gradient-to-br from-card via-card to-accent-gold/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <TemariMascot mood="studying" size="sm" animate={false} />
              <div>
                <span className="text-[11px] font-black text-accent-gold uppercase tracking-widest block">
                  Teme&apos;s Daily Study Tip
                </span>
                <span className="text-[10px] font-bold text-slate-400">High-Yield Exam Strategy</span>
              </div>
            </div>
            <button
              onClick={() => { sounds.playTap(); haptic.selection(); fetchTip(true); }}
              className="w-8 h-8 flex items-center justify-center rounded-[12px] bg-ground/80 border border-black/[0.08] hover:bg-black/5 dark:hover:bg-white/10 active:translate-y-[1px] transition-all text-slate-500"
              title="Get a new tip"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tipLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {tipLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-3 bg-black/5 dark:bg-white/5 rounded-full animate-pulse w-full" />
              <div className="h-3 bg-black/5 dark:bg-white/5 rounded-full animate-pulse w-3/4" />
            </div>
          ) : tip ? (
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-relaxed pl-1 pt-1">
              &ldquo;{tip}&rdquo;
            </p>
          ) : null}
        </div>

      </div>
    </div>
  );
};
