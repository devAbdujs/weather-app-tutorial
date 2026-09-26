'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { 
  Target, 
  Brain, 
  Flame, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Compass, 
  SlidersHorizontal,
  Award,
  Zap,
  ChevronRight
} from 'lucide-react';
import { getSubjectTheme } from '@/components/practice/PracticeHub';

export interface SubjectStat {
  subject: string;
  questions_attempted: number;
  questions_correct: number;
  total_time_spent_seconds: number;
  last_practiced: string;
}

interface StudentProfile {
  target_exam?: string | null;
  stream?: string | null;
  full_name?: string | null;
  daily_streak?: number;
}

interface MasteryTreeProps {
  stats: SubjectStat[];
  profile?: StudentProfile;
}

interface LevelInfo {
  tierName: string;
  level: number;
  currentThreshold: number;
  nextThreshold: number;
  progress: number;
  isMax: boolean;
}

const MASTERY_TIERS = [
  { level: 1, name: 'Foundational', threshold: 0 },
  { level: 2, name: 'Developing',   threshold: 25 },
  { level: 3, name: 'Competent',    threshold: 60 },
  { level: 4, name: 'Advanced',     threshold: 120 },
  { level: 5, name: 'Mastery',      threshold: 200 },
];

function calculateLevelInfo(correct: number): LevelInfo {
  let currentTierIndex = 0;
  for (let i = 0; i < MASTERY_TIERS.length; i++) {
    if (correct >= MASTERY_TIERS[i].threshold) {
      currentTierIndex = i;
    } else {
      break;
    }
  }

  const currentTier = MASTERY_TIERS[currentTierIndex];
  const nextTier = MASTERY_TIERS[currentTierIndex + 1];
  const isMax = !nextTier;

  const currentThreshold = currentTier.threshold;
  const nextThreshold = nextTier ? nextTier.threshold : currentThreshold;
  const progress = isMax 
    ? 100 
    : Math.max(0, Math.min(100, Math.round(((correct - currentThreshold) / (nextThreshold - currentThreshold)) * 100)));

  return {
    tierName: currentTier.name,
    level: currentTier.level,
    currentThreshold,
    nextThreshold,
    progress,
    isMax,
  };
}

const SUBJECT_EMOJI: Record<string, string> = {
  'Mathematics': '📐',
  'Applied Mathematics': '📐',
  'Mathematics for Natural Sciences': '📐',
  'Mathematics for Social Sciences': '📐',
  'Physics': '⚛️',
  'Chemistry': '🧪',
  'Biology': '🧬',
  'Economics': '📈',
  'History': '📜',
  'Geography': '🌍',
  'English': '📝',
  'Logic': '🧠',
  'Civics': '⚖️',
  'Psychology': '💡',
  'Computer Science': '💻',
  'Software Engineering': '🖥️',
  'Emerging Technology': '🚀',
  'Aptitude': '🎯',
  'Scholastic Aptitude (SAT)': '🎯',
  'GAT (Graduate Admission Test)': '🎯',
};

const getSubjectEmoji = (name: string): string => {
  if (SUBJECT_EMOJI[name]) return SUBJECT_EMOJI[name];
  for (const [key, emoji] of Object.entries(SUBJECT_EMOJI)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '📚';
};

const formatSeconds = (sec: number): string => {
  if (!sec || sec < 60) return `${Math.max(1, Math.round(sec || 0))}s`;
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
};

export const MasteryTree: React.FC<MasteryTreeProps> = ({ stats, profile }) => {
  const router = useRouter();
  const { setBackButton, haptic } = useTelegram();

  const [filterMode, setFilterMode] = useState<'all' | 'focus' | 'mastered'>('all');
  const [sortMode, setSortMode] = useState<'accuracy' | 'attempted' | 'time'>('accuracy');

  useEffect(() => {
    setBackButton(true, () => router.push('/dashboard'));
  }, [setBackButton, router]);

  // Aggregate Intelligence
  const totalAttempted = useMemo(() => stats.reduce((acc, s) => acc + (s.questions_attempted || 0), 0), [stats]);
  const totalCorrect = useMemo(() => stats.reduce((acc, s) => acc + (s.questions_correct || 0), 0), [stats]);
  const overallAccuracy = useMemo(() => totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0, [totalAttempted, totalCorrect]);
  const totalTimeSeconds = useMemo(() => stats.reduce((acc, s) => acc + (s.total_time_spent_seconds || 0), 0), [stats]);
  const avgPaceSeconds = useMemo(() => totalAttempted > 0 ? Math.round(totalTimeSeconds / totalAttempted) : 0, [totalAttempted, totalTimeSeconds]);

  // Composite Readiness Score (0-100%)
  const readiness = useMemo(() => {
    if (totalAttempted === 0) return { score: 0, label: 'Not Started', description: 'Complete your first practice drill to unlock diagnostic assessment.' };

    const accuracyWeight = overallAccuracy * 0.50; // up to 50
    const breadthWeight = Math.min(25, (stats.length / 5) * 25); // up to 25
    const volumeWeight = Math.min(25, (totalAttempted / 120) * 25); // up to 25
    const score = Math.min(100, Math.round(accuracyWeight + breadthWeight + volumeWeight));

    let label = 'Foundational Phase';
    let description = 'Early practice detected. Expand drill volume across subjects to boost confidence.';
    if (score >= 82) {
      label = 'Exam Ready';
      description = 'High composite accuracy and wide curriculum coverage. Maintain steady recall drills.';
    } else if (score >= 68) {
      label = 'Strong Standing';
      description = 'Solid academic foundation. Reinforce weak areas to push toward high distinction.';
    } else if (score >= 50) {
      label = 'Developing';
      description = 'Good momentum underway. Focus on slower subjects and review incorrect answers.';
    }

    return { score, label, description };
  }, [totalAttempted, overallAccuracy, stats.length]);

  // Smart Focus Area & Strongest Subject
  const { focusSubject, topSubject } = useMemo(() => {
    if (stats.length === 0) return { focusSubject: null, topSubject: null };

    const activeStats = [...stats].filter(s => s.questions_attempted >= 2);
    if (activeStats.length === 0) return { focusSubject: stats[0], topSubject: stats[0] };

    // Sort by accuracy ascending for focus
    const sortedAsc = [...activeStats].sort((a, b) => {
      const accA = a.questions_correct / a.questions_attempted;
      const accB = b.questions_correct / b.questions_attempted;
      return accA - accB;
    });

    // Sort by accuracy descending for top
    const sortedDesc = [...activeStats].sort((a, b) => {
      const accA = a.questions_correct / a.questions_attempted;
      const accB = b.questions_correct / b.questions_attempted;
      return accB - accA;
    });

    return {
      focusSubject: sortedAsc[0] || null,
      topSubject: sortedDesc[0] || null,
    };
  }, [stats]);

  // Filtered & Sorted Subject List
  const processedStats = useMemo(() => {
    let list = [...stats];

    if (filterMode === 'focus') {
      list = list.filter(s => {
        const acc = s.questions_attempted > 0 ? (s.questions_correct / s.questions_attempted) * 100 : 0;
        return acc < 68;
      });
    } else if (filterMode === 'mastered') {
      list = list.filter(s => {
        const acc = s.questions_attempted > 0 ? (s.questions_correct / s.questions_attempted) * 100 : 0;
        return acc >= 75;
      });
    }

    list.sort((a, b) => {
      if (sortMode === 'accuracy') {
        const accA = a.questions_attempted > 0 ? a.questions_correct / a.questions_attempted : 0;
        const accB = b.questions_attempted > 0 ? b.questions_correct / b.questions_attempted : 0;
        return accB - accA;
      }
      if (sortMode === 'attempted') {
        return b.questions_attempted - a.questions_attempted;
      }
      if (sortMode === 'time') {
        return (b.total_time_spent_seconds || 0) - (a.total_time_spent_seconds || 0);
      }
      return 0;
    });

    return list;
  }, [stats, filterMode, sortMode]);

  const examTrackLabel = useMemo(() => {
    if (!profile?.target_exam) return 'National Exam Curriculum';
    const map: Record<string, string> = {
      entrance: 'Grade 12 Entrance',
      freshman: 'Freshman University',
      exit: 'Exit Exam Track',
    };
    const track = map[profile.target_exam] || profile.target_exam;
    return profile.stream ? `${track} • ${profile.stream}` : track;
  }, [profile]);

  return (
    <div className="flex flex-col pt-3 px-3.5 sm:px-4 pb-28 animate-fade-in bg-ground max-w-lg mx-auto w-full space-y-4">
      
      {/* ── 1. ACADEMIC READINESS HEADER ───────────────────────────────── */}
      <header className="flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">
                Exam Readiness
              </h1>
              <span className="text-[11px] font-semibold text-muted tracking-tight">
                {examTrackLabel}
              </span>
            </div>
          </div>
          {profile?.daily_streak ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] text-xs font-bold border border-[hsl(36,58%,42%)]/20">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{profile.daily_streak}d streak</span>
            </div>
          ) : null}
        </div>
      </header>

      {/* ── 2. INTELLIGENT COMPOSITE RADAR ───────────────────────────── */}
      <section 
        aria-label="Exam Readiness Radar"
        className="relative bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-4.5 shadow-sm overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 mb-3.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-1">
              <Compass className="w-3.5 h-3.5 text-primary" />
              Composite Readiness Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
                {readiness.score}%
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                readiness.score >= 80 
                  ? 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]' 
                  : readiness.score >= 60 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)]'
              }`}>
                {readiness.label}
              </span>
            </div>
          </div>
          
          <div className="w-12 h-12 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Readiness Meter Bar */}
        <div className="w-full bg-ground border border-black/[0.06] dark:border-white/[0.08] h-2.5 rounded-full overflow-hidden p-0.5 mb-3">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-bespoke ${
              readiness.score >= 80 
                ? 'bg-[hsl(145,42%,38%)]' 
                : readiness.score >= 60 
                ? 'bg-primary' 
                : 'bg-[hsl(36,58%,42%)]'
            }`}
            style={{ width: `${Math.max(4, readiness.score)}%` }}
          />
        </div>

        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
          {readiness.description}
        </p>
      </section>

      {/* ── 3. FOUR KEY DIAGNOSTIC METRICS ───────────────────────────── */}
      <section 
        aria-label="Academic Diagnostic Metrics"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
      >
        {/* Accuracy */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-primary" /> Accuracy
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
            {overallAccuracy}%
          </span>
          <span className="text-[10px] font-semibold text-muted mt-1">
            {totalCorrect} of {totalAttempted} right
          </span>
        </div>

        {/* Questions Solved */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[hsl(199,65%,40%)]" /> Drills Solved
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
            {totalAttempted}
          </span>
          <span className="text-[10px] font-semibold text-muted mt-1">
            across {stats.length} subjects
          </span>
        </div>

        {/* Time Invested */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[hsl(36,58%,42%)]" /> Study Time
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
            {formatSeconds(totalTimeSeconds)}
          </span>
          <span className="text-[10px] font-semibold text-muted mt-1">
            focus time logged
          </span>
        </div>

        {/* Pace Velocity */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[hsl(145,42%,38%)]" /> Answer Pace
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
            {avgPaceSeconds > 0 ? `${avgPaceSeconds}s` : '—'}
          </span>
          <span className="text-[10px] font-semibold text-muted mt-1">
            {avgPaceSeconds > 0 && avgPaceSeconds <= 75 ? 'Optimal tempo' : 'per question avg'}
          </span>
        </div>
      </section>

      {/* ── 4. HIGH-YIELD FOCUS ACTION CARD ──────────────────────────── */}
      {focusSubject && focusSubject.questions_attempted > 0 && (
        <section 
          aria-label="Diagnostic Recommendation"
          className="bg-card border border-primary/20 dark:border-primary/30 rounded-[20px] p-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-base">
                {getSubjectEmoji(focusSubject.subject)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    High-Yield Focus Area
                  </span>
                  <span className="w-1 h-1 rounded-full bg-primary/40" />
                  <span className="text-[10px] font-bold text-muted">
                    {Math.round((focusSubject.questions_correct / focusSubject.questions_attempted) * 100)}% accuracy
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {focusSubject.subject}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Targeted drills in this subject will yield the biggest boost to your composite exam score.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                haptic.impact('light');
                router.push('/practice');
              }}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 hover:bg-primary/95 active:scale-95 transition-all shrink-0 shadow-sm"
            >
              <span>Drill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* ── 5. SUBJECT MASTERY LIST WITH FILTERS ─────────────────────── */}
      <section aria-label="Curriculum Subject Mastery">
        <div className="flex items-center justify-between mb-3 pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            Subject Mastery Breakdown
          </h2>
          <span className="text-[11px] font-semibold text-muted">
            {stats.length} Subjects
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => {
              haptic.selection();
              setFilterMode('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted border border-border hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            All ({stats.length})
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setFilterMode('focus');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterMode === 'focus'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted border border-border hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Needs Focus
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setFilterMode('mastered');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterMode === 'mastered'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted border border-border hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Mastered (≥75%)
          </button>
        </div>

        {/* Subject Cards */}
        {processedStats.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-[20px] p-6 text-center">
            <Compass className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">
              No subjects in this category
            </p>
            <p className="text-[11px] text-muted mb-3">
              {filterMode === 'focus' 
                ? 'Great job! You have no subjects below 68% accuracy.' 
                : 'Keep practicing to master your curriculum subjects.'}
            </p>
            <button
              onClick={() => setFilterMode('all')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {processedStats.map(stat => {
              const accuracy = stat.questions_attempted > 0 
                ? Math.round((stat.questions_correct / stat.questions_attempted) * 100) 
                : 0;
              const levelInfo = calculateLevelInfo(stat.questions_correct);
              const subjectTheme = getSubjectTheme(stat.subject);
              const emoji = getSubjectEmoji(stat.subject);
              const pace = stat.questions_attempted > 0 
                ? Math.round((stat.total_time_spent_seconds || 0) / stat.questions_attempted) 
                : 0;

              return (
                <div
                  key={stat.subject}
                  className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-4 shadow-sm transition-all hover:border-black/15 dark:hover:border-white/15"
                >
                  {/* Row 1: Subject info & Accuracy */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${subjectTheme}`}>
                        {emoji}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {stat.subject}
                        </h4>
                        <span className="text-[10px] font-semibold text-muted">
                          Level {levelInfo.level} • {levelInfo.tierName}
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-black px-2 py-0.5 rounded-md tabular-nums shrink-0 ${
                      accuracy >= 75 
                        ? 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]' 
                        : accuracy >= 55 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)]'
                    }`}>
                      {accuracy}%
                    </span>
                  </div>

                  {/* Row 2: Level Progress Meter */}
                  <div className="space-y-1 mb-2.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-muted">
                      <span>{levelInfo.isMax ? 'Mastery Cap' : `Progress to Lvl ${levelInfo.level + 1}`}</span>
                      <span>{levelInfo.isMax ? `${stat.questions_correct} correct` : `${stat.questions_correct} / ${levelInfo.nextThreshold}`}</span>
                    </div>
                    <div className="w-full bg-ground border border-black/[0.04] dark:border-white/[0.06] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-bespoke"
                        style={{ width: `${Math.max(3, levelInfo.progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Row 3: Quantitative Metrics & Drill CTA */}
                  <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04] text-[11px] text-muted font-medium">
                    <div className="flex items-center gap-2.5">
                      <span>{stat.questions_correct}/{stat.questions_attempted} Qs</span>
                      <span>•</span>
                      <span>{formatSeconds(stat.total_time_spent_seconds || 0)}</span>
                      {pace > 0 && (
                        <>
                          <span>•</span>
                          <span>{pace}s/Q</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        haptic.selection();
                        router.push('/practice');
                      }}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 active:scale-95 transition-all"
                    >
                      <span>Practice</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 6. EMPTY STATE (IF 0 STATS EVER) ─────────────────────────── */}
      {stats.length === 0 && (
        <section className="bg-card border-2 border-dashed border-border rounded-[24px] p-8 text-center flex flex-col items-center">
          <Compass className="w-12 h-12 text-primary/40 mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
            Readiness Tree is Awaiting Data
          </h3>
          <p className="text-xs text-muted max-w-xs mb-5">
            Take past entrance exams or short diagnostic quizzes to activate your intelligent readiness radar and strength mapping.
          </p>
          <button
            onClick={() => {
              haptic.impact('medium');
              router.push('/practice');
            }}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            Start First Drill
          </button>
        </section>
      )}

    </div>
  );
};
