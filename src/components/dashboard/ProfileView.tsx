'use client';

import React, { useMemo, useState } from 'react';
import { 
  LogOut, 
  Award, 
  ChevronRight, 
  Zap, 
  GraduationCap, 
  Target, 
  BarChart2,
  Sparkles,
  Flame,
  Clock,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  BookOpen,
  TrendingUp,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { logout } from '@/app/actions/user';
import { WelcomeOnboarding } from './WelcomeOnboarding';

export const ProfileView = ({ profile, stats }: { profile: any; stats: any[] }) => {
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

  // Dynamic progress bar gradient based on percentage used
  const getProgressColor = () => {
    if (usagePercent < 60) return 'from-emerald-500 to-teal-400';
    if (usagePercent < 85) return 'from-amber-500 to-orange-400';
    return 'from-rose-500 to-red-500';
  };

  const getTextColor = () => {
    if (usagePercent < 60) return 'text-emerald-500 dark:text-emerald-400';
    if (usagePercent < 85) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-500 dark:text-rose-400';
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

      <div className="flex flex-col pt-4 px-4 pb-28 animate-fade-in bg-ground max-w-lg mx-auto w-full space-y-5">
        
        {/* ── 1. SLICK STUDENT HERO CARD ─────────────────────────────── */}
        <div className="relative bg-card border border-black/5 dark:border-white/10 rounded-[28px] p-5 shadow-sm overflow-hidden">
          {/* Ambient subtle glow background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          {devMode && (
            <div className="absolute top-4 right-4 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-full">
              Dev Mode
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Avatar with Squircle & Interactive Dev Tap */}
            <div 
              onClick={handleAvatarClick} 
              className="relative w-20 h-20 shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-full h-full rounded-[24px] bg-gradient-to-tr from-primary via-blue-500 to-indigo-500 p-0.5 shadow-md shadow-primary/20">
                <div className="w-full h-full bg-ground rounded-[22px] overflow-hidden flex items-center justify-center">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'Avatar'} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-2xl font-black text-primary tracking-tight">{initials}</span>
                  )}
                </div>
              </div>

              {/* Status Badge floating on bottom right */}
              {isPremium ? (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-md border-2 border-card">
                  <Zap className="w-3.5 h-3.5 fill-white text-white" />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-sm border-2 border-card">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight truncate">
                  {profile.full_name || 'Scholar'}
                </h1>
                {isPremium && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                    PRO
                  </span>
                )}
              </div>

              {/* Telegram Username or ID with Quick Copy */}
              <button 
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium hover:text-primary transition-colors mb-2"
              >
                <span>{profile.username ? `@${profile.username}` : `ID: ${profile.telegram_id}`}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </button>

              {/* Academic Goal Chip */}
              <button 
                onClick={handleRetakeOnboarding}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors active:scale-95 text-left max-w-full truncate"
              >
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{getGoalDisplay()}</span>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. INDIVIDUAL AI QUOTA & USAGE DASHBOARD ────────────────── */}
        <div className="bg-card border border-black/5 dark:border-white/10 rounded-[28px] p-5 shadow-sm relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-gray-100">
                  Temari AI Allowance
                </h2>
                <p className="text-[11px] font-semibold text-gray-400">
                  Weekly intelligent reasoning quota
                </p>
              </div>
            </div>

            {/* Reset Countdown Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ground border border-black/5 dark:border-white/5 text-[11px] font-bold text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 text-primary" />
              <span>Resets in {daysUntilReset}d</span>
            </div>
          </div>

          {/* Numbers & Progress Meter */}
          <div className="space-y-2 mb-4">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl font-black font-mono tracking-tight ${getTextColor()}`}>
                  {usageClamped}
                </span>
                <span className="text-sm font-bold text-gray-400 font-mono">
                  / {weeklyCap} Qs
                </span>
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {remainingQuestions} inquiries remaining
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full bg-ground border border-black/5 dark:border-white/5 h-3 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-700 ease-out`}
                style={{ width: `${Math.max(4, usagePercent)}%` }}
              />
            </div>
          </div>

          {/* Free Tier vs Premium Tier Hook */}
          {!isPremium ? (
            <div className="bg-gradient-to-r from-primary/5 via-blue-500/5 to-primary/10 border border-primary/20 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 dark:text-gray-100 mb-0.5">
                  Free Student Plan (5 Qs/week)
                </p>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Upgrade to unlock 150 AI questions/week + 31k past exams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  haptic.impact('medium');
                  router.push('/upgrade');
                }}
                className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                Upgrade
              </button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Premium Activated • 150 Inquiries / Week on Gemini 3.6 Flash</span>
            </div>
          )}
        </div>

        {/* ── 3. ACADEMIC PERFORMANCE OVERVIEW ───────────────────────── */}
        <div className="bg-card border border-black/5 dark:border-white/10 rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Performance Overview
            </h2>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Lifetime Stats
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Streak */}
            <div className="bg-ground border border-black/5 dark:border-white/5 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1.5">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100 font-mono leading-none mb-1">
                {profile.daily_streak || 0}
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Day Streak
              </span>
            </div>

            {/* Drills Solved */}
            <div className="bg-ground border border-black/5 dark:border-white/5 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1.5">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100 font-mono leading-none mb-1">
                {totalQuestions}
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Questions
              </span>
            </div>

            {/* Accuracy */}
            <div className="bg-ground border border-black/5 dark:border-white/5 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none mb-1">
                {overallAccuracy}%
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Accuracy
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. SUBJECT MASTERY BREAKDOWN ────────────────────────────── */}
        <div className="bg-card border border-black/5 dark:border-white/10 rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Subject Mastery
            </h2>
            <span className="text-[11px] font-bold text-gray-400">
              {stats.length} Subjects Tracked
            </span>
          </div>

          {stats.length > 0 ? (
            <div className="space-y-3">
              {stats
                .sort((a, b) => (b.questions_attempted || 0) - (a.questions_attempted || 0))
                .map((s) => {
                  const acc = s.questions_attempted > 0 
                    ? Math.round((s.questions_correct / s.questions_attempted) * 100) 
                    : 0;

                  return (
                    <div 
                      key={s.subject} 
                      className="bg-ground/60 border border-black/5 dark:border-white/5 rounded-2xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-gray-100">
                            {s.subject}
                          </p>
                          <p className="text-[10px] font-medium text-gray-400">
                            {s.questions_attempted} Qs attempted • {s.questions_correct} correct
                          </p>
                        </div>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                          acc >= 75 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : acc >= 50 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {acc}%
                        </span>
                      </div>

                      {/* Visual mastery bar */}
                      <div className="w-full bg-black/5 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            acc >= 75 ? 'bg-emerald-500' : acc >= 50 ? 'bg-primary' : 'bg-amber-500'
                          }`}
                          style={{ width: `${acc}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-ground/50 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                No Exam Drills Completed Yet
              </p>
              <p className="text-[11px] text-gray-400 mb-4 max-w-xs mx-auto">
                Practice past exams or take quick quizzes to unlock your subject analytics.
              </p>
              <button
                type="button"
                onClick={() => router.push('/practice')}
                className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                Go to Practice Hub
              </button>
            </div>
          )}
        </div>

        {/* ── 5. SETTINGS & COMMUNITY ACTIONS ─────────────────────────── */}
        <div className="bg-card border border-black/5 dark:border-white/10 rounded-[28px] p-2 shadow-sm divide-y divide-black/5 dark:divide-white/5">
          {/* Retake Onboarding */}
          <button 
            type="button"
            onClick={handleRetakeOnboarding}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Switch Exam Track
                </p>
                <p className="text-[11px] text-gray-400">
                  Change Grade 12, Freshman, or Exit discipline
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Upgrade Link (if free) or Subscription Status (if premium) */}
          <button 
            type="button"
            onClick={() => router.push('/upgrade')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isPremium 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {isPremium ? 'Temari Premium Active' : 'Upgrade to Premium'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {isPremium ? 'Unlimited exams & 150 AI questions/wk' : '199 ETB / term (CBE & Telebirr)'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Community & Bot Help */}
          <a 
            href="https://t.me/ethio_exam_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Telegram Bot & Support
                </p>
                <p className="text-[11px] text-gray-400">
                  Connect with admins or report an issue
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>

        {/* ── 6. SIGN OUT BUTTON (ONLY ON WEB) ────────────────────────── */}
        {!isTelegram && (
          <button 
            disabled={isLoggingOut} 
            onClick={handleLogout} 
            className="w-full bg-card border border-red-500/15 rounded-2xl p-4 flex items-center justify-center gap-2 text-red-500 font-bold text-sm hover:bg-red-500/5 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoggingOut ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        )}

      </div>
    </>
  );
};
