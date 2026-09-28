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
          className="relative bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-card-lg p-5 shadow-tactile-sm"
        >
          {devMode && (
            <div className="absolute top-4 right-4 text-micro font-black text-accent-gold uppercase tracking-widest bg-accent-gold/10 border border-accent-gold/20 px-2 py-0.5 rounded-full">
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
              <div className="w-full h-full rounded-card bg-primary/10 dark:bg-primary/20 p-0.5 border border-primary/25 shadow-tactile-xs">
                <div className="w-full h-full bg-ground rounded-card-sm overflow-hidden flex items-center justify-center">
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
                  <span className="px-2 py-0.5 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-micro font-black uppercase tracking-wider shrink-0">
                    PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-panel border border-black/[0.08] dark:border-white/[0.08] text-slate-500 dark:text-slate-400 text-micro font-black uppercase tracking-wider shrink-0">
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
        <section className="bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-card-lg p-4 shadow-tactile-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TemariMascot mood="happy" size={54} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{currentLevel.badge}</span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                  Level {currentLevel.level}: {currentLevel.title}
                </span>
              </div>
              <p className="text-caption font-bold text-slate-500 dark:text-slate-400">
                {currentLevel.titleAmharic} • <span className="text-primary font-black">{xp} XP Earned</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => { sounds.playTap(); haptic.selection(); router.push('/mastery'); }}
            className="px-3 py-1.5 rounded-xl bg-ground border border-black/[0.08] dark:border-white/[0.08] border-b-2 hover:border-primary/40 text-xs font-black text-primary transition-all active:translate-y-[1px]"
          >
            Scores
          </button>
        </section>

        {/* ── 3. ACADEMIC HIGHLIGHTS (ui_inspiration3.png: 3 COLORFUL PASTEL STAT CARDS) ── */}
        <section 
          aria-label="Quick Stats"
          className="grid grid-cols-3 gap-3"
        >
          {/* Questions (Pastel Lavender) */}
          <div className="bg-tint-purple text-tint-purple-fg border border-tint-purple-border rounded-2xl p-3 text-center shadow-xs">
            <span className="text-xl font-black font-mono tabular-nums block">
              {totalQuestions}
            </span>
            <span className="text-micro font-black uppercase tracking-wider opacity-80 mt-0.5 block">
              Questions
            </span>
          </div>

          {/* Solved (Pastel Mint) */}
          <div className="bg-tint-green text-tint-green-fg border border-tint-green-border rounded-2xl p-3 text-center shadow-xs">
            <span className="text-xl font-black font-mono tabular-nums block">
              {totalCorrect}
            </span>
            <span className="text-micro font-black uppercase tracking-wider opacity-80 mt-0.5 block">
              Solved
            </span>
          </div>

          {/* Saved / Accuracy (Pastel Sky) */}
          <div className="bg-tint-sky text-tint-sky-fg border border-tint-sky-border rounded-2xl p-3 text-center shadow-xs">
            <span className="text-xl font-black font-mono tabular-nums block">
              {overallAccuracy}%
            </span>
            <span className="text-micro font-black uppercase tracking-wider opacity-80 mt-0.5 block">
              Accuracy
            </span>
          </div>
        </section>

        {/* ── 4. "UPGRADE TO PREMIUM" BANNER (ui_inspiration3.png) ── */}
        <section 
          onClick={() => {
            sounds.playCelebration();
            haptic.impact('heavy');
            router.push('/upgrade');
          }}
          className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white rounded-3xl p-4.5 shadow-lg shadow-orange-500/25 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-300/40 backdrop-blur-xs flex items-center justify-center text-stone-900 shadow-2xs shrink-0 text-xl font-black border border-white/20">
              👑
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight leading-tight">
                Upgrade To Premium
              </h2>
              <p className="text-caption font-medium text-white/90 mt-0.5 line-clamp-1 max-w-[190px]">
                Unlock Unlimited AI Tutor &amp; Past Exams
              </p>
            </div>
          </div>

          <button
            type="button"
            className="bg-stone-950 text-white px-3.5 py-2 rounded-full text-xs font-black shadow-md shrink-0 flex items-center gap-1 hover:bg-black transition-all"
          >
            <span>Upgrade</span>
            <span className="text-amber-400">↗</span>
          </button>
        </section>

        {/* ── 5. AI QUOTA STATUS BAR ── */}
        <section 
          aria-label="AI Quota"
          className="bg-card border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-black text-gray-900 dark:text-gray-100">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Weekly AI Quota</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-caption text-slate-500 dark:text-slate-400">
              <span className="font-bold text-gray-900 dark:text-gray-100">{usageClamped}/{weeklyCap}</span>
              <span>•</span>
              <span>Resets in {daysUntilReset}d</span>
            </div>
          </div>

          <div className="w-full bg-ground border border-black/[0.06] dark:border-white/[0.08] h-2.5 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-bespoke ${getProgressColor()}`}
              style={{ width: `${Math.max(4, usagePercent)}%` }}
            />
          </div>
        </section>

        {/* ── 6. SETTINGS & APP PREFERENCES (ui_inspiration3.png SEPARATE CARDS) ── */}
        <section aria-label="Account Settings" className="space-y-2.5">
          {/* Sound & Notifications */}
          <div 
            onClick={() => {
              toggleSound();
              haptic.selection();
            }}
            className="bg-card border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors cursor-pointer select-none active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-primary border border-orange-200/40 flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 dark:text-gray-100">
                  Sound &amp; Notifications
                </h3>
                <p className="text-caption font-medium text-slate-500 dark:text-slate-400">
                  Sound Effects {soundEnabled ? 'Enabled' : 'Muted'}
                </p>
              </div>
            </div>
            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Help & Support (ui_inspiration3.png) */}
          <a
            href="https://t.me/ethio_exam_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => { sounds.playTap(); haptic.selection(); }}
            className="bg-card border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 border border-sky-200/40 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 dark:text-gray-100">
                  Help &amp; Support
                </h3>
                <p className="text-caption font-medium text-slate-500 dark:text-slate-400">
                  Telegram Bot, FAQ &amp; Community Support
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>

          {/* Settings / Curriculum Track (ui_inspiration3.png) */}
          <button 
            type="button"
            onClick={handleRetakeOnboarding}
            className="w-full bg-card border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between shadow-xs hover:border-primary/40 transition-colors text-left active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200/40 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 dark:text-gray-100">
                  Settings &amp; Preferences
                </h3>
                <p className="text-caption font-medium text-slate-500 dark:text-slate-400">
                  Curriculum: {profile.stream || 'Natural Science'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </section>

        {/* ── 7. SIGN OUT BUTTON (ui_inspiration3.png: FULL WIDTH PILL) ── */}
        {!isTelegram && (
          <div className="pt-2">
            <button 
              disabled={isLoggingOut} 
              onClick={handleLogout} 
              className="w-full py-3.5 bg-card border border-black/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-center gap-2 text-gray-800 dark:text-gray-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 font-black text-xs shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        )}

      </div>
    </>
  );
};
