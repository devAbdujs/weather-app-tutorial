"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Flame, FileText, ArrowRight, Target, Sparkles, RefreshCw, Zap, BarChart2, CheckCircle2, ChevronRight, Camera, Mic } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { updateDailyStreak } from '@/app/actions/user';
import { useAppStore } from '@/store/useAppStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { TemariMascot, MascotBubble } from '@/components/mascot/TemariMascot';
import { useGamificationStore, getLevelForXp } from '@/store/useGamificationStore';
import { sounds } from '@/lib/sounds';

import dynamic from 'next/dynamic';

const AITutorDrawer = dynamic(() => import('@/components/ai/AITutorDrawer').then(m => m.AITutorDrawer), { ssr: false });

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

  const [showAI, setShowAI]             = useState(false);
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
          <div className="flex items-center gap-1.5 text-caption font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest" suppressHydrationWarning>
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
            className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary text-xs font-black transition-all active:scale-95"
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[100px]">{examLabel(userProfile?.target_exam || null)}</span>
          </button>

          {/* Flame Pill */}
          <div 
            onClick={() => { sounds.playStreak(); router.push('/mastery'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-b-bevel transition-all cursor-pointer active:translate-y-[1px] ${
              streak > 0
                ? 'bg-accent-gold/15 border-accent-gold/30 border-b-accent-gold/45 text-accent-gold shadow-tactile-xs'
                : 'bg-card border-black/[0.08] dark:border-white/[0.08] text-slate-400 dark:text-slate-500'
            }`}
          >
            <Flame className={`w-4 h-4 ${streak > 0 ? 'fill-accent-gold text-accent-gold animate-pulse' : 'text-slate-400'}`} />
            <span className="text-sm font-black font-mono leading-none">{streak}</span>
            <span className="text-micro font-black uppercase tracking-wider">d</span>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4 mt-2">

        {/* ── 2. AI BUDDY HERO BANNER (ui_inspiration2.png: "Start With Chegg") ── */}
        <div className="bg-tint-cream text-tint-cream-fg border-2 border-b-[4px] border-tint-cream-border rounded-3xl p-5 shadow-tactile-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white dark:bg-black/40 border-2 border-orange-300/60 dark:border-orange-900/60 p-0.5 shadow-2xs shrink-0 flex items-center justify-center">
                <TemariMascot mood="happy" size={40} animate={false} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider block opacity-90">
                  Your A.I Study Buddy
                </span>
                <h2 className="text-lg font-black tracking-tight leading-tight">
                  Start With <span className="text-primary font-black">Teme</span>
                </h2>
              </div>
            </div>

            {/* Mascot Buddy illustration */}
            <div className="shrink-0 -mr-1">
              <TemariMascot mood="studying" size={54} />
            </div>
          </div>

          {/* Quick Question Input Search Bar with Camera & Mic (ui_inspiration2.png) */}
          <div 
            onClick={() => { sounds.playTap(); haptic.selection(); setShowAI(true); }}
            className="mt-4 flex items-center justify-between bg-white dark:bg-black/50 border-2 border-black/[0.08] dark:border-white/[0.1] rounded-full pl-2 pr-1.5 py-1.5 shadow-xs cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button 
                type="button" 
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-primary transition-colors shrink-0 shadow-2xs"
                title="Scan problem with camera"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-primary transition-colors shrink-0 shadow-2xs"
                title="Voice inquiry"
              >
                <Mic className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 select-none pl-1 truncate">
                Ask an expert question...
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                aria-label="Ask AI"
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. DAILY QUEST XP GOAL METER ── */}
        <div className="card-chunky p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent-gold/20 text-accent-gold border border-accent-gold/40 flex items-center justify-center font-black text-sm shadow-2xs">
                ⚡
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 leading-tight">
                  Daily Quest Goal
                </h3>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {dailyXp >= dailyXpGoal ? 'Goal achieved! You are on fire 🔥' : 'Earn XP by solving past questions'}
                </p>
              </div>
            </div>

            <span className="font-mono font-black text-sm text-gray-900 dark:text-gray-100 tabular-nums">
              {dailyXp} <span className="text-gray-500 font-bold text-xs">/ {dailyXpGoal} XP</span>
            </span>
          </div>

          {/* Progress Trough */}
          <div className="w-full bg-panel border-2 border-black/[0.08] dark:border-white/[0.08] h-3.5 rounded-full overflow-hidden p-0.5 relative">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-accent-gold via-amber-500 to-accent-emerald transition-all duration-500 ease-bespoke"
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
        </div>

        {/* ── 4. "LIBRARY" FEATURED CARD (ui_inspiration2.png: "See Chegg Solutions In Action") ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Library
            </h2>
            <button
              onClick={() => { sounds.playTap(); router.push('/practice'); }}
              className="text-xs font-black text-gray-700 dark:text-gray-300 hover:text-primary flex items-center gap-0.5 transition-colors"
            >
              <span>See All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            onClick={() => { sounds.playTap(); haptic.impact('heavy'); router.push('/practice'); }}
            className="group relative bg-tint-green text-tint-green-fg border-2 border-b-[4px] border-tint-green-border rounded-3xl p-5 shadow-tactile-xs cursor-pointer active:translate-y-0.5 active:border-b-2 transition-all overflow-hidden"
          >
            {/* Visual Icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/90 dark:bg-black/40 backdrop-blur-xs flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-2xs mb-4 border border-emerald-500/20">
              <BookOpen className="w-8 h-8 stroke-[2.4]" />
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 bg-white/80 dark:bg-black/40 border border-emerald-500/30 px-3 py-1 rounded-full inline-block mb-2 shadow-2xs">
                  31,000+ Past Papers
                </span>
                <h3 className="text-xl font-black tracking-tight leading-snug">
                  See <span className="text-primary font-black">Temari Solutions</span> In Action
                </h3>
                <p className="text-xs font-bold opacity-90 mt-1 max-w-[250px]">
                  Real national entrance and university exams with step-by-step guidance.
                </p>
              </div>

              {/* Large Round Orange Action Button (ui_inspiration2.png) */}
              <div className="w-13 h-13 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/35 group-hover:scale-105 active:scale-95 transition-all">
                <ArrowRight className="w-6 h-6 stroke-[2.6]" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. RESUME STUDY SESSION (IF ACTIVE) ── */}
        {lastSession && (
          <button
            onClick={() => { sounds.playTap(); handleContinue(); }}
            className="w-full btn-3d-card p-4 rounded-3xl text-left flex items-center justify-between transition-all"
          >
            <div>
              <div className="flex items-center gap-1.5 text-micro font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Resume Active Study</span>
              </div>
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm leading-snug">{lastSession.subject}</h3>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">{lastSession.label || 'Session'} • {lastSession.mode} mode</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 border-2 border-primary/20 text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
              <ArrowRight className="w-5 h-5 stroke-[2.4]" />
            </div>
          </button>
        )}

        {/* ── 6. "MADE JUST FOR YOU" (ui_inspiration2.png) ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-base font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Made just for you
            </h2>
            <button
              onClick={() => { sounds.playTap(); router.push('/practice'); }}
              className="text-xs font-black text-gray-700 dark:text-gray-300 hover:text-primary flex items-center gap-0.5 transition-colors"
            >
              <span>See All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Short Notes Card (Pastel Lavender) */}
            <button
              onClick={() => { sounds.playTap(); haptic.impact('medium'); router.push('/practice?mode=notes'); }}
              className="bg-tint-purple text-tint-purple-fg border-2 border-b-[4px] border-tint-purple-border p-4.5 rounded-3xl text-left group shadow-tactile-xs hover:-translate-y-0.5 transition-all active:translate-y-0 active:border-b-2"
            >
              <div className="w-11 h-11 bg-white dark:bg-black/40 text-purple-700 dark:text-purple-300 border border-purple-300/40 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                <FileText className="w-5 h-5 stroke-[2.4]" />
              </div>
              <h3 className="text-sm font-black leading-tight">Short Notes</h3>
              <p className="text-xs font-bold opacity-90 mt-0.5 truncate">Summaries &amp; Concepts</p>
              <div className="mt-3 text-micro font-black px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/40 border border-current/10 inline-flex items-center shadow-2xs">
                +20 XP / unit
              </div>
            </button>

            {/* Flashcards Card (Pastel Peach) */}
            <button
              onClick={() => { sounds.playTap(); haptic.impact('medium'); router.push('/practice?mode=flashcards'); }}
              className="bg-tint-peach text-tint-peach-fg border-2 border-b-[4px] border-tint-peach-border p-4.5 rounded-3xl text-left group shadow-tactile-xs hover:-translate-y-0.5 transition-all active:translate-y-0 active:border-b-2"
            >
              <div className="w-11 h-11 bg-white dark:bg-black/40 text-amber-700 dark:text-amber-300 border border-amber-300/40 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                <Zap className="w-5 h-5 stroke-[2.4]" />
              </div>
              <h3 className="text-sm font-black leading-tight">Flashcards</h3>
              <p className="text-xs font-bold opacity-90 mt-0.5 truncate">Rapid-Fire Drills</p>
              <div className="mt-3 text-micro font-black px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/40 border border-current/10 inline-flex items-center shadow-2xs">
                +15 XP / deck
              </div>
            </button>
          </div>
        </div>

        {/* ── 7. TEMARI AI DAILY SPARK WITH MASCOT ── */}
        <div className="card-chunky p-4.5 bg-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <TemariMascot mood="studying" size="sm" animate={false} />
              <div>
                <span className="text-caption font-black text-accent-gold uppercase tracking-widest block">
                  Teme&apos;s Daily Study Tip
                </span>
                <span className="text-micro font-bold text-slate-500 dark:text-slate-400">High-Yield Exam Strategy</span>
              </div>
            </div>
            <button
              onClick={() => { sounds.playTap(); haptic.selection(); fetchTip(true); }}
              className="w-8 h-8 flex items-center justify-center rounded-control btn-3d-card text-slate-600 dark:text-slate-300"
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

      {/* Dynamic AI Tutor Drawer for Quick Questions */}
      {showAI && (
        <AITutorDrawer
          isOpen={showAI}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
};
