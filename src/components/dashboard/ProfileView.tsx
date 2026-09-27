'use client';

import React, { useMemo, useState } from 'react';
import { 
  LogOut, 
  ChevronRight, 
  Zap, 
  Sparkles, 
  Flame, 
  ExternalLink, 
  TrendingUp, 
  MessageCircle,
  BarChart2,
  GraduationCap,
  Target,
  Volume2,
  VolumeX,
  Award
} from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { logout } from '@/app/actions/user';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { useGamificationStore, getLevelForXp } from '@/store/useGamificationStore';
import { sounds } from '@/lib/sounds';
import { TemariMascot } from '@/components/mascot/TemariMascot';

interface ProfileViewProps {
  profile: any;
  stats: any[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, stats }) => {
  const router = useRouter();
  const { haptic, isTelegram } = useTelegram();
  const updateProfile = useAppStore(s => s.setUserProfile);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChangingExam, setIsChangingExam] = useState(false);
  const [devClicks, setDevClicks] = useState(0);
  const toggleDevMode = useAppStore(s => s.toggleDevMode);
  const devMode = useAppStore(s => s.devMode);

  const { xp, soundEnabled, toggleSound } = useGamificationStore();
  const currentLevel = getLevelForXp(xp);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    sounds.playTap();
    haptic.impact('heavy');
    try {
      await logout();
      window.location.href = '/';
    } catch (e) {
      console.error('Logout failed', e);
      setIsLoggingOut(false);
    }
  };

  const handleRetakeOnboarding = () => {
    sounds.playTap();
    haptic.selection();
    setIsChangingExam(true);
  };

  const handleAvatarClick = () => {
    setDevClicks(prev => {
      const next = prev + 1;
      if (next === 5) {
        sounds.playCelebration();
        haptic.notification('success');
        toggleDevMode();
        return 0;
      }
      sounds.playTap();
      return next;
    });
  };

  const isPremium = profile.subscription_status === 'premium';
  
  // Weekly Quota Calculations
  const weeklyCap = isPremium ? 150 : 5;
  const weeklyUsage = profile.ai_weekly_usage || 0;
  const usageClamped = Math.min(weeklyUsage, weeklyCap);
  const usagePercent = Math.min(100, Math.round((usageClamped / weeklyCap) * 100));

  const getProgressColor = () => {
    if (usagePercent < 65) return 'bg-accent-emerald';
    if (usagePercent < 85) return 'bg-accent-gold';
    return 'bg-accent-rose';
  };

  // Days until weekly reset calculation
  const daysUntilReset = useMemo(() => {
    if (!profile.ai_quota_reset_at) return 7;
    const resetDate = new Date(profile.ai_quota_reset_at);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    if (diffMs <= 0) return 1;
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [profile.ai_quota_reset_at]);

  // Initials for avatar fallback
  const initials = useMemo(() => {
    const name = profile.full_name || 'Scholar';
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [profile.full_name]);

  // Overall Stats
  const totalQuestions = stats.reduce((acc, curr) => acc + (curr.questions_attempted || 0), 0);
  const totalCorrect = stats.reduce((acc, curr) => acc + (curr.questions_correct || 0), 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Formatted goal display
  const getGoalDisplay = () => {
    const examMap: Record<string, string> = {
      entrance: 'Grade 12 Entrance',
      freshman: 'Freshman University',
      exit: 'Exit Exam',
    };
    const exam = examMap[profile.target_exam] || profile.target_exam || 'National Exam';
    const stream = profile.stream ? ` • ${profile.stream}` : '';
    return `${exam}${stream}`;
  };

  return (
    <>
      {isChangingExam && (
        <WelcomeOnboarding 
          onComplete={(res) => {
            updateProfile({ target_exam: res.target, stream: res.stream });
            setIsChangingExam(false);
            router.refresh();
          }}
          onCancel={() => setIsChangingExam(false)}
        />
      )}

      <div className="flex flex-col pt-3 px-4 sm:px-5 pb-28 animate-fade-in bg-ground max-w-lg mx-auto w-full space-y-4">
        
        {/* ── 1. CLEAN STUDENT IDENTITY CARD ─────────────────────────── */}
        <section 
          aria-label="Student Identity"
          className="relative bg-card border-2 border-b-[5px] border-black/[0.08] dark:border-white/[0.08] rounded-[26px] p-5 shadow-bespoke-sm"
        >
          {devMode && (
            <div className="absolute top-4 right-4 text-[10px] font-black text-accent-gold uppercase tracking-widest bg-accent-gold/10 border border-accent-gold/20 px-2 py-0.5 rounded-full">
              Dev
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div 
              onClick={handleAvatarClick} 
              className="relative w-16 h-16 shrink-0 cursor-pointer active:scale-95 transition-transform"
              title="Student avatar (tap 5 times for dev tools)"
            >
              <div className="w-full h-full rounded-[22px] bg-primary/10 dark:bg-primary/20 p-0.5 border-2 border-primary/25 shadow-bespoke-sm">
                <div className="w-full h-full bg-ground rounded-[18px] overflow-hidden flex items-center justify-center">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'Avatar'} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xl font-black text-primary tracking-tight font-mono">{initials}</span>
                  )}
                </div>
              </div>

              {isPremium && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent-gold border-2 border-card flex items-center justify-center shadow-sm text-white">
                  <Zap className="w-3 h-3 fill-current" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-base font-black text-gray-900 dark:text-gray-100 tracking-tight truncate">
                  {profile.full_name || 'Scholar'}
                </h1>
                {isPremium ? (
                  <span className="px-2 py-0.5 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-[10px] font-black uppercase tracking-wider shrink-0">
                    PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-panel border border-black/[0.08] dark:border-white/[0.08] text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                    Free
                  </span>
                )}
              </div>

              {profile.username && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2 truncate">
                  @{profile.username}
                </p>
              )}

              {/* Target Track Button */}
              <div>
                <button 
                  onClick={handleRetakeOnboarding}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-black transition-all active:scale-[0.98] text-left max-w-full border border-primary/20"
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{getGoalDisplay()}</span>
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-60 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. GAMIFICATION SCHOLAR TIER CARD ─────────────────────── */}
        <section className="bg-card border-2 border-b-[5px] border-black/[0.08] dark:border-white/[0.08] rounded-[24px] p-4.5 shadow-bespoke-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TemariMascot mood="happy" size={54} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{currentLevel.badge}</span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                  Level {currentLevel.level}: {currentLevel.title}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                {currentLevel.titleAmharic} • <span className="text-primary font-black">{xp} XP Earned</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => { sounds.playTap(); haptic.selection(); router.push('/mastery'); }}
            className="px-3 py-1.5 rounded-xl bg-ground border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] hover:border-primary/40 text-xs font-black text-primary transition-all active:border-b-0 active:translate-y-[2px]"
          >
            Scores
          </button>
        </section>

        {/* ── 3. ACADEMIC HIGHLIGHTS (CLEAN 3-PILLAR BAR) ─────────────── */}
        <section 
          aria-label="Quick Stats"
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-3.5 text-center shadow-bespoke-sm">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <Flame className="w-3.5 h-3.5 text-accent-gold" />
              <span>Streak</span>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono tabular-nums">
              {profile.daily_streak || 0}d
            </span>
          </div>

          <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-3.5 text-center shadow-bespoke-sm">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span>Solved</span>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono tabular-nums">
              {totalQuestions}
            </span>
          </div>

          <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-3.5 text-center shadow-bespoke-sm">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-accent-emerald" />
              <span>Accuracy</span>
            </div>
            <span className="text-xl font-black text-accent-emerald font-mono tabular-nums">
              {overallAccuracy}%
            </span>
          </div>
        </section>

        {/* ── 4. AI QUOTA (CLEAN & COMPACT) ────────────────────────────── */}
        <section 
          aria-label="AI Quota"
          className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-4 shadow-bespoke-sm space-y-2.5"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-black text-gray-900 dark:text-gray-100">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>AI Tutor Quota</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-bold text-gray-900 dark:text-gray-100">{usageClamped}/{weeklyCap}</span>
              <span>•</span>
              <span>Resets in {daysUntilReset}d</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-ground border border-black/[0.06] dark:border-white/[0.08] h-2.5 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-bespoke ${getProgressColor()}`}
              style={{ width: `${Math.max(4, usagePercent)}%` }}
            />
          </div>

          {!isPremium && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Upgrade for 150 inquiries/wk &amp; past exams
              </span>
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  haptic.selection();
                  router.push('/upgrade');
                }}
                className="text-xs font-black text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Upgrade</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </section>

        {/* ── 5. SETTINGS & APP PREFERENCES ───────────────────────────── */}
        <section 
          aria-label="Account Settings"
          className="bg-card border-2 border-b-[5px] border-black/[0.08] dark:border-white/[0.08] rounded-[24px] shadow-bespoke-sm divide-y divide-black/[0.05] dark:divide-white/[0.05] overflow-hidden"
        >
          {/* Sound Effects Toggle */}
          <div 
            onClick={() => {
              toggleSound();
              haptic.selection();
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${soundEnabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                Sound Effects
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                {soundEnabled ? 'On' : 'Muted'}
              </span>
              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          {/* Progress & Scores */}
          <button 
            type="button"
            onClick={() => {
              sounds.playTap();
              haptic.selection();
              router.push('/mastery');
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                Exam Progress &amp; Scores
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span className="font-mono font-bold">{overallAccuracy}% avg</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Switch Exam Track */}
          <button 
            type="button"
            onClick={handleRetakeOnboarding}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                Curriculum Track
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span className="truncate max-w-[140px] font-bold">{profile.stream || 'Natural'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Subscription */}
          <button 
            type="button"
            onClick={() => {
              sounds.playTap();
              haptic.selection();
              router.push('/upgrade');
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                Subscription Plan
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span className="font-bold">{isPremium ? 'PRO Active' : 'Free (199 ETB)'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Telegram Support */}
          <a 
            href="https://t.me/ethio_exam_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => { sounds.playTap(); haptic.selection(); }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                Support &amp; Community
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span className="font-bold">@ethio_exam_bot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>
        </section>

        {/* ── 6. SIGN OUT (WEB ONLY) ──────────────────────────────────── */}
        {!isTelegram && (
          <div className="pt-2">
            <button 
              disabled={isLoggingOut} 
              onClick={handleLogout} 
              className="w-full py-3 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-black text-xs hover:underline active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoggingOut ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        )}

      </div>
    </>
  );
};
