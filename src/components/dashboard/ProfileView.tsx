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
  Award,
  Bell,
  CheckCircle2,
  FileQuestion,
  ShieldCheck,
  Headphones,
  Settings
} from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { logout } from '@/app/actions/user';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { useGamificationStore, getLevelForXp } from '@/store/useGamificationStore';
import { sounds } from '@/lib/sounds';
import { TemariMascot } from '@/components/mascot/TemariMascot';
import { safeSessionStorage, safeLocalStorage } from '@/lib/safeStorage';

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
      safeSessionStorage.setItem('temari_manual_logout', 'true');
      safeLocalStorage.removeItem('tg_web_user');
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

  const userProfile = useAppStore(s => s.userProfile);
  const isPremium = (userProfile?.subscription_status === 'premium') || (profile?.subscription_status === 'premium');
  
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
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 border-2 border-card flex items-center justify-center shadow-xs text-white text-[10px]">
                  👑
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-base font-black text-foreground tracking-tight truncate">
                  {profile.full_name || 'Scholar'}
                </h1>
                {isPremium ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-micro font-black uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs">
                    👑 PRO Member
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-panel border border-black/[0.08] dark:border-white/[0.08] text-slate-500 dark:text-slate-400 text-micro font-black uppercase tracking-wider shrink-0">
                    Free Tier
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tint-peach text-tint-peach-fg text-xs font-black transition-all active:scale-[0.98] text-left max-w-full border-2 border-b-[3px] border-tint-peach-border shadow-tactile-xs"
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                  <span className="truncate">{getGoalDisplay()}</span>
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-70 ml-0.5" />
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
                <span className="text-xs font-black text-foreground">
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
            className="px-3.5 py-1.5 rounded-xl bg-gray-950 text-white dark:bg-white dark:text-gray-950 text-xs font-black transition-all active:scale-95 shadow-tactile-xs border border-black/10 dark:border-white/10"
          >
            Scores
          </button>
        </section>

        {/* ── 3. ACADEMIC HIGHLIGHTS (Icon-first pastel stat cards) ── */}
        <section 
          aria-label="Quick Stats"
          className="grid grid-cols-3 gap-2.5"
        >
          {/* Attempted (Pastel Lavender) */}
          <div className="bg-tint-purple text-tint-purple-fg border-2 border-b-[3px] border-tint-purple-border rounded-2xl p-3 text-center shadow-2xs">
            <FileQuestion className="w-5 h-5 mx-auto mb-1 stroke-[2.5] text-purple-600 dark:text-purple-400" />
            <span className="text-xl font-black font-mono tabular-nums block text-gray-950 dark:text-white leading-tight">
              {totalQuestions}
            </span>
            <span className="text-micro font-black uppercase tracking-wider text-muted-foreground mt-0.5 block">
              Attempted
            </span>
          </div>

          {/* Solved (Pastel Mint) */}
          <div className="bg-tint-green text-tint-green-fg border-2 border-b-[3px] border-tint-green-border rounded-2xl p-3 text-center shadow-2xs">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 stroke-[2.5] text-current opacity-90" />
            <span className="text-xl font-black font-mono tabular-nums block text-current leading-tight">
              {totalCorrect}
            </span>
            <span className="text-micro font-black uppercase tracking-wider text-current opacity-75 mt-0.5 block">
              Solved
            </span>
          </div>

          {/* Accuracy (Pastel Sky) */}
          <div className="bg-tint-sky text-tint-sky-fg border-2 border-b-[3px] border-tint-sky-border rounded-2xl p-3 text-center shadow-2xs">
            <Target className="w-5 h-5 mx-auto mb-1 stroke-[2.5] text-current opacity-90" />
            <span className="text-xl font-black font-mono tabular-nums block text-current leading-tight">
              {overallAccuracy}%
            </span>
            <span className="text-micro font-black uppercase tracking-wider text-current opacity-75 mt-0.5 block">
              Accuracy
            </span>
          </div>
        </section>

        {/* ── 4. PRO MEMBERSHIP STATUS / UPGRADE BANNER ── */}
        {isPremium ? (
          <section 
            className="bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 border-2 border-b-[4px] border-amber-500/30 rounded-2xl p-4 shadow-tactile-xs relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-tactile-xs shrink-0 text-2xl font-black border border-amber-300/40">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-foreground tracking-tight leading-tight">
                      Temari PRO Active
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    150 AI queries/week • Full Exam Archives Unlocked
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Subscription</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  haptic.selection();
                  router.push('/upgrade');
                }}
                className="text-xs font-black text-primary hover:underline flex items-center gap-1"
              >
                <span>View Status</span>
                <span>↗</span>
              </button>
            </div>
          </section>
        ) : (
          <section 
            onClick={() => {
              sounds.playCelebration();
              haptic.impact('heavy');
              router.push('/upgrade');
            }}
            className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white rounded-2xl p-4 shadow-lg shadow-orange-500/25 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-300/40 backdrop-blur-xs flex items-center justify-center text-stone-900 shadow-2xs shrink-0 text-xl font-black border border-white/20">
                👑
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-tight leading-tight">
                  Temari Pro
                </h2>
                <p className="text-caption font-bold text-white/95 mt-0.5">
                  199 ETB • Unlimited AI Tutor
                </p>
              </div>
            </div>

            <button
              type="button"
              className="bg-stone-950 text-white px-3.5 py-2 rounded-full text-xs font-black shadow-md shrink-0 flex items-center gap-1 hover:bg-black transition-all"
            >
              <span>Upgrade</span>
              <span className="text-amber-400 text-sm">↗</span>
            </button>
          </section>
        )}

        {/* ── 5. AI QUOTA STATUS BAR ── */}
        <section 
          aria-label="AI Quota"
          className="bg-card border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 shadow-2xs space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-black text-foreground">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>AI Quota</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-muted-foreground">
              <span className="font-black text-foreground">{usageClamped}/{weeklyCap}</span>
              <span className="text-slate-400">•</span>
              <span>{daysUntilReset}d left</span>
            </div>
          </div>

          <div className="w-full bg-ground border border-black/[0.08] dark:border-white/[0.08] h-2.5 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-bespoke ${getProgressColor()}`}
              style={{ width: `${Math.max(4, usagePercent)}%` }}
            />
          </div>
        </section>

        {/* ── 6. SETTINGS & APP PREFERENCES ── */}
        <section aria-label="Account Settings" className="space-y-2.5">
          {/* Notifications / Sound */}
          <div 
            onClick={() => {
              toggleSound();
              haptic.selection();
            }}
            className="bg-card border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:border-primary/40 transition-colors cursor-pointer select-none active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/50 flex items-center justify-center shadow-2xs shrink-0">
                <Bell className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground leading-tight">
                  Sound Effects
                </h3>
                <p className="text-caption font-bold text-muted-foreground mt-0.5">
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Help & Support */}
          <a
            href="https://t.me/temari_support" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => { sounds.playTap(); haptic.selection(); }}
            className="bg-card border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:border-primary/40 transition-colors cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 border border-sky-200/50 flex items-center justify-center shadow-2xs shrink-0">
                <Headphones className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground leading-tight">
                  Help &amp; Community
                </h3>
                <p className="text-caption font-bold text-muted-foreground mt-0.5">
                  Telegram &amp; Support
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground stroke-[2.5]" />
          </a>

          {/* Settings / Preferences */}
          <button 
            type="button"
            onClick={handleRetakeOnboarding}
            className="w-full bg-card border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:border-primary/40 transition-colors text-left active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200/50 flex items-center justify-center shadow-2xs shrink-0">
                <Settings className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground leading-tight">
                  Curriculum Track
                </h3>
                <p className="text-caption font-bold text-muted-foreground mt-0.5">
                  {profile.stream || 'Natural Science'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground stroke-[2.5]" />
          </button>
        </section>

        {/* ── 7. SIGN OUT BUTTON (ui_inspiration3.png: FULL WIDTH PILL) ── */}
        <div className="pt-2">
          <button 
            disabled={isLoggingOut} 
            onClick={handleLogout} 
            className="w-full py-4 bg-card border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] rounded-full flex items-center justify-center gap-2.5 text-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400 font-black text-sm shadow-2xs transition-all active:translate-y-0.5 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>

      </div>
    </>
  );
};
