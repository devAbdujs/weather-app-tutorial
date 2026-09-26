'use client';

import React, { useMemo, useState } from 'react';
import { 
  LogOut, 
  Award, 
  ChevronRight, 
  Zap, 
  GraduationCap, 
  Target, 
  BarChart3,
  Sparkles, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Check, 
  Copy, 
  ExternalLink, 
  TrendingUp, 
  MessageCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { logout } from '@/app/actions/user';
import { WelcomeOnboarding } from './WelcomeOnboarding';

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
  const [copiedId, setCopiedId] = useState(false);
  const toggleDevMode = useAppStore(s => s.toggleDevMode);
  const devMode = useAppStore(s => s.devMode);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
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
    haptic.selection();
    setIsChangingExam(true);
  };

  const handleAvatarClick = () => {
    setDevClicks(prev => {
      const next = prev + 1;
      if (next === 5) {
        haptic.notification('success');
        toggleDevMode();
        return 0;
      }
      return next;
    });
  };

  const handleCopyId = () => {
    if (!profile.telegram_id) return;
    navigator.clipboard.writeText(profile.telegram_id.toString());
    setCopiedId(true);
    haptic.selection();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isPremium = profile.subscription_status === 'premium';
  
  // Weekly Quota Calculations
  const weeklyCap = isPremium ? 150 : 5;
  const weeklyUsage = profile.ai_weekly_usage || 0;
  const usageClamped = Math.min(weeklyUsage, weeklyCap);
  const usagePercent = Math.min(100, Math.round((usageClamped / weeklyCap) * 100));
  const remainingQuestions = Math.max(0, weeklyCap - weeklyUsage);

  // Days until weekly reset calculation
  const daysUntilReset = useMemo(() => {
    if (!profile.ai_quota_reset_at) return 7;
    const resetDate = new Date(profile.ai_quota_reset_at);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    if (diffMs <= 0) return 1;
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [profile.ai_quota_reset_at]);

  // Dynamic progress bar color based on percentage used — soft desaturated tones
  const getProgressColor = () => {
    if (usagePercent < 65) return 'bg-[hsl(145,42%,38%)]';
    if (usagePercent < 85) return 'bg-[hsl(36,58%,42%)]';
    return 'bg-error';
  };

  const getTextColor = () => {
    if (usagePercent < 65) return 'text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]';
    if (usagePercent < 85) return 'text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)]';
    return 'text-error';
  };

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
      exit: 'Exit Exam Track',
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

      <div className="flex flex-col pt-3 px-3.5 sm:px-4 pb-28 animate-fade-in bg-ground max-w-lg mx-auto w-full space-y-4">
        
        {/* ── 1. STUDENT IDENTITY HERO CARD ───────────────────────────── */}
        <section 
          aria-label="Student Identity"
          className="relative bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-4.5 shadow-sm overflow-hidden"
        >
          {devMode && (
            <div className="absolute top-4 right-4 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Dev Mode
            </div>
          )}

          <div className="flex items-center gap-3.5">
            {/* Avatar with Squircle & Interactive Dev Tap */}
            <div 
              onClick={handleAvatarClick} 
              className="relative w-16 h-16 shrink-0 cursor-pointer active:scale-95 transition-transform"
              title="Student avatar (tap 5 times for dev tools)"
            >
              <div className="w-full h-full rounded-[20px] bg-primary/10 dark:bg-primary/20 p-0.5 border border-primary/20 shadow-sm">
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
                    <span className="text-lg font-black text-primary tracking-tight">{initials}</span>
                  )}
                </div>
              </div>

              {/* Status Badge floating on bottom right */}
              {isPremium ? (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[hsl(36,58%,42%)] border-2 border-card flex items-center justify-center shadow-sm text-white">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-ground text-muted flex items-center justify-center border-2 border-card shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-black text-gray-900 dark:text-gray-100 tracking-tight truncate">
                  {profile.full_name || 'Scholar'}
                </h1>
                {isPremium ? (
                  <span className="px-2 py-0.5 rounded-md bg-[hsl(36,58%,42%)]/10 border border-[hsl(36,58%,42%)]/20 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] text-[10px] font-black uppercase tracking-wider shrink-0">
                    PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-ground border border-border text-muted text-[10px] font-bold uppercase tracking-wider shrink-0">
                    Free
                  </span>
                )}
              </div>

              {/* Telegram Username or ID with Quick Copy */}
              <button 
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-2"
                title="Tap to copy ID"
              >
                <span>{profile.username ? `@${profile.username}` : `ID: ${profile.telegram_id}`}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]" />
                ) : (
                  <Copy className="w-3 h-3 opacity-60" />
                )}
              </button>

              {/* Academic Target Track Pill */}
              <div>
                <button 
                  onClick={handleRetakeOnboarding}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold transition-all active:scale-[0.98] text-left max-w-full"
                  title="Change curriculum track"
                >
                  <Target className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{getGoalDisplay()}</span>
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. AI REASONING QUOTA & SUBSCRIPTION CARD ───────────────── */}
        <section 
          aria-label="AI Reasoning Allowance"
          className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-4.5 shadow-sm relative overflow-hidden space-y-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Temari AI Allowance
                </h2>
                <p className="text-[11px] font-medium text-muted">
                  Weekly intelligent reasoning quota
                </p>
              </div>
            </div>

            {/* Reset Countdown */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ground border border-border text-[11px] font-semibold text-muted">
              <Clock className="w-3 h-3 text-primary" />
              <span>Resets in {daysUntilReset}d</span>
            </div>
          </div>

          {/* Meter & Number */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs font-semibold">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-black font-mono tracking-tight ${getTextColor()} tabular-nums`}>
                  {usageClamped}
                </span>
                <span className="text-xs text-muted font-mono">
                  / {weeklyCap} Qs used
                </span>
              </div>
              <span className="text-muted">
                {remainingQuestions} inquiries remaining
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full bg-ground border border-black/[0.06] dark:border-white/[0.08] h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full ${getProgressColor()} transition-all duration-700 ease-bespoke`}
                style={{ width: `${Math.max(4, usagePercent)}%` }}
              />
            </div>
          </div>

          {/* Upgrade Prompt / Active Membership */}
          {!isPremium ? (
            <div className="bg-ground border border-border rounded-[16px] p-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5">
                  Free Student Plan (5 Qs/week)
                </p>
                <p className="text-[11px] text-muted">
                  Unlock 150 AI queries/week + 31,000+ past exams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  haptic.impact('medium');
                  router.push('/upgrade');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all shrink-0 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Upgrade</span>
              </button>
            </div>
          ) : (
            <div className="bg-[hsl(145,42%,38%)]/10 border border-[hsl(145,42%,38%)]/20 rounded-[16px] p-3 flex items-center gap-2.5 text-[hsl(145,42%,35%)] dark:text-[hsl(145,35%,62%)] text-xs font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Temari PRO Active • 150 Inquiries / Week on Gemini Flash</span>
            </div>
          )}
        </section>

        {/* ── 3. ACADEMIC SNAPSHOT & PROGRESS GATEWAY ─────────────────── */}
        <section 
          aria-label="Academic Snapshot"
          className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-4.5 shadow-sm space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Academic Performance
            </h2>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Lifetime Summary
            </span>
          </div>

          {/* 3 Micro-Metrics Row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Streak */}
            <div className="bg-ground border border-black/[0.06] dark:border-white/[0.08] rounded-[16px] p-3 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-[10px] bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] flex items-center justify-center mb-1">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono leading-none mb-1 tabular-nums">
                {profile.daily_streak || 0}
              </span>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Streak
              </span>
            </div>

            {/* Questions */}
            <div className="bg-ground border border-black/[0.06] dark:border-white/[0.08] rounded-[16px] p-3 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center mb-1">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono leading-none mb-1 tabular-nums">
                {totalQuestions}
              </span>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Solved
              </span>
            </div>

            {/* Accuracy */}
            <div className="bg-ground border border-black/[0.06] dark:border-white/[0.08] rounded-[16px] p-3 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-[10px] bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] flex items-center justify-center mb-1">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] font-mono leading-none mb-1 tabular-nums">
                {overallAccuracy}%
              </span>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Accuracy
              </span>
            </div>
          </div>

          {/* Clean Gateway to Detailed Progress Page */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              router.push('/mastery');
            }}
            className="w-full bg-ground hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-[16px] p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Curriculum Breakdown & Radar
                </p>
                <p className="text-[11px] text-muted">
                  {stats.length > 0 ? `${stats.length} subjects analyzed with readiness score` : 'View subject ranks and exam pace'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </section>

        {/* ── 4. SETTINGS & SUPPORT GROUP ─────────────────────────────── */}
        <section 
          aria-label="Settings and Preferences"
          className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-1.5 shadow-sm divide-y divide-black/[0.04] dark:divide-white/[0.04]"
        >
          {/* Switch Exam Track */}
          <button 
            type="button"
            onClick={handleRetakeOnboarding}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] rounded-[16px] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8.5 h-8.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Switch Exam Track
                </p>
                <p className="text-[11px] text-muted">
                  Grade 12, Freshman courses, or Exit disciplines
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>

          {/* Subscription Link */}
          <button 
            type="button"
            onClick={() => {
              haptic.selection();
              router.push('/upgrade');
            }}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] rounded-[16px] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center ${
                isPremium 
                  ? 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]' 
                  : 'bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)]'
              }`}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {isPremium ? 'Temari PRO Membership' : 'Upgrade to Temari PRO'}
                </p>
                <p className="text-[11px] text-muted">
                  {isPremium ? 'Active subscription • Unlimited practice' : '199 ETB / term (CBE & Telebirr)'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>

          {/* Telegram Bot & Support */}
          <a 
            href="https://t.me/ethio_exam_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => haptic.selection()}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] rounded-[16px] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8.5 h-8.5 rounded-xl bg-[hsl(199,65%,40%)]/10 text-[hsl(199,65%,40%)] dark:text-[hsl(199,55%,62%)] flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Telegram Bot & Support
                </p>
                <p className="text-[11px] text-muted">
                  Connect with admins or report an issue
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted" />
          </a>
        </section>

        {/* ── 5. SIGN OUT (WEB ONLY) ──────────────────────────────────── */}
        {!isTelegram && (
          <button 
            disabled={isLoggingOut} 
            onClick={handleLogout} 
            className="w-full bg-card border border-red-500/15 rounded-[16px] p-3.5 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-500/5 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoggingOut ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out of Account'}</span>
          </button>
        )}

      </div>
    </>
  );
};
