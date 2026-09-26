'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { 
  Target, 
  Flame, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  BookOpen, 
  Zap, 
  AlertTriangle,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  BarChart3
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
  'Civics & Citizenship': '⚖️',
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

// Standard Ethiopian Curriculum Subjects by Stream
const CURRICULUM_SUBJECTS: Record<string, string[]> = {
  'Natural Science': [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Scholastic Aptitude (SAT)',
  ],
  'Social Science': [
    'Mathematics',
    'English',
    'Geography',
    'History',
    'Economics',
    'Scholastic Aptitude (SAT)',
  ],
};

export const MasteryTree: React.FC<MasteryTreeProps> = ({ stats, profile }) => {
  const router = useRouter();
  const { setBackButton, haptic } = useTelegram();

  const [filterMode, setFilterMode] = useState<'all' | 'needs_practice' | 'strong'>('all');

  useEffect(() => {
    setBackButton(true, () => router.push('/dashboard'));
  }, [setBackButton, router]);

  // Aggregate Metrics
  const totalAttempted = useMemo(() => stats.reduce((acc, s) => acc + (s.questions_attempted || 0), 0), [stats]);
  const totalCorrect = useMemo(() => stats.reduce((acc, s) => acc + (s.questions_correct || 0), 0), [stats]);
  const overallAccuracy = useMemo(() => totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0, [totalAttempted, totalCorrect]);
  const totalTimeSeconds = useMemo(() => stats.reduce((acc, s) => acc + (s.total_time_spent_seconds || 0), 0), [stats]);
  const avgPaceSeconds = useMemo(() => totalAttempted > 0 ? Math.round(totalTimeSeconds / totalAttempted) : 0, [totalAttempted, totalTimeSeconds]);

  // Curriculum Stream Context
  const isG12 = !profile?.target_exam || profile?.target_exam === 'entrance';
  const stream = profile?.stream || 'Natural Science';
  const targetCurriculum = CURRICULUM_SUBJECTS[stream] || CURRICULUM_SUBJECTS['Natural Science'];

  // Real Grade 12 score estimation out of 600 points
  const estimatedScore = useMemo(() => {
    if (totalAttempted === 0) return 0;
    if (isG12) {
      return Math.min(600, Math.round((overallAccuracy / 100) * 600));
    }
    return overallAccuracy;
  }, [totalAttempted, isG12, overallAccuracy]);

  // Cutoff benchmarks
  const scoreBenchmark = useMemo(() => {
    if (totalAttempted === 0) {
      return {
        status: 'Awaiting Practice',
        pillClass: 'bg-ground text-slate-400 dark:text-slate-500 border border-black/5 dark:border-white/5',
        barColor: 'bg-primary',
        summary: 'Solve past questions or take a quick quiz to generate your estimated exam score.',
        percent: 0,
      };
    }

    if (isG12) {
      const pct = Math.min(100, Math.round((estimatedScore / 600) * 100));
      if (estimatedScore >= 460) {
        return {
          status: 'Top Campus Qualified',
          pillClass: 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] border border-[hsl(145,42%,38%)]/20',
          barColor: 'bg-[hsl(145,42%,38%)]',
          summary: 'At this score, students typically qualify for AAU, ASTU, and top health & technology departments.',
          percent: pct,
        };
      }
      if (estimatedScore >= 360) {
        return {
          status: 'Above Pass Cutoff',
          pillClass: 'bg-primary/10 text-primary border border-primary/20',
          barColor: 'bg-primary',
          summary: 'You are on track to clear the 350-point national entrance pass mark. Push higher for preferred campus selection.',
          percent: pct,
        };
      }
      if (estimatedScore >= 300) {
        const gap = 350 - estimatedScore;
        return {
          status: 'Close to Cutoff',
          pillClass: 'bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] border border-[hsl(36,58%,42%)]/20',
          barColor: 'bg-[hsl(36,58%,42%)]',
          summary: `You need ~${gap} more points to reach the 350-point national university cutoff. Focus on your weakest subject.`,
          percent: pct,
        };
      }
      return {
        status: 'Below Cutoff',
        pillClass: 'bg-error/10 text-error border border-error/20',
        barColor: 'bg-error',
        summary: 'Currently below the 350-point passing mark. Increasing your daily question volume will build retention fast.',
        percent: pct,
      };
    }

    // Freshman / Exit Exam (Passing mark: 50%, Distinction: 75%+)
    if (overallAccuracy >= 75) {
      return {
        status: 'Distinction Standing',
        pillClass: 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] border border-[hsl(145,42%,38%)]/20',
        barColor: 'bg-[hsl(145,42%,38%)]',
        summary: 'Well above the 50% graduation requirement with distinction-tier accuracy.',
        percent: overallAccuracy,
      };
    }
    if (overallAccuracy >= 50) {
      return {
        status: 'Passing Standing',
        pillClass: 'bg-primary/10 text-primary border border-primary/20',
        barColor: 'bg-primary',
        summary: 'Meeting the 50% passing threshold. Practice timed questions to secure your safety margin.',
        percent: overallAccuracy,
      };
    }
    return {
      status: 'Needs Reinforcement',
      pillClass: 'bg-error/10 text-error border border-error/20',
      barColor: 'bg-error',
      summary: 'Currently below the 50% required passing grade. Review lecture summaries and re-drill missed topics.',
      percent: overallAccuracy,
    };
  }, [totalAttempted, isG12, estimatedScore, overallAccuracy]);

  // Weakest subject priority
  const weakestSubject = useMemo(() => {
    const active = stats.filter(s => s.questions_attempted >= 3);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => {
      const accA = a.questions_correct / a.questions_attempted;
      const accB = b.questions_correct / b.questions_attempted;
      return accA - accB;
    })[0];
  }, [stats]);

  // Unpracticed subjects in current stream curriculum
  const unpracticedSubjects = useMemo(() => {
    if (!isG12) return [];
    return targetCurriculum.filter(cur => {
      const match = stats.some(s => 
        s.subject.toLowerCase() === cur.toLowerCase() ||
        s.subject.toLowerCase().includes(cur.toLowerCase()) ||
        cur.toLowerCase().includes(s.subject.toLowerCase())
      );
      return !match;
    });
  }, [isG12, targetCurriculum, stats]);

  // Filtered Subject List
  const filteredStats = useMemo(() => {
    if (filterMode === 'needs_practice') {
      return stats.filter(s => {
        const acc = s.questions_attempted > 0 ? (s.questions_correct / s.questions_attempted) * 100 : 0;
        return acc < 65;
      });
    }
    if (filterMode === 'strong') {
      return stats.filter(s => {
        const acc = s.questions_attempted > 0 ? (s.questions_correct / s.questions_attempted) * 100 : 0;
        return acc >= 75;
      });
    }
    return stats;
  }, [stats, filterMode]);

  const examTrackTitle = useMemo(() => {
    if (!profile?.target_exam) return 'Grade 12 Entrance';
    const map: Record<string, string> = {
      entrance: 'Grade 12 Entrance',
      freshman: 'Freshman University',
      exit: 'Exit Exam',
    };
    const title = map[profile.target_exam] || profile.target_exam;
    return profile.stream ? `${title} • ${profile.stream}` : title;
  }, [profile]);

  return (
    <div className="flex flex-col pt-3 px-4 sm:px-5 pb-28 animate-fade-in bg-ground max-w-lg mx-auto w-full space-y-4">
      
      {/* ── 1. HEADER (DISCIPLINED & TYPOGRAPHIC) ────────────────────── */}
      <header className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-1">
            Exam Progress
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {examTrackTitle}
          </p>
        </div>

        {profile?.daily_streak ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] text-xs font-bold border border-[hsl(36,58%,42%)]/20 shadow-bespoke-sm">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="font-mono">{profile.daily_streak}</span>
            <span className="text-[10px] uppercase tracking-wider">days</span>
          </div>
        ) : null}
      </header>

      {/* ── 2. HERO ESTIMATED SCORECARD (BESPOKE CRAFTSMANSHIP) ───────── */}
      <section 
        aria-label="Estimated Exam Score"
        className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-5 shadow-bespoke-md space-y-4 relative overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
              Estimated Exam Score
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
                {totalAttempted > 0 ? (isG12 ? estimatedScore : `${overallAccuracy}%`) : '—'}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500 font-mono">
                {isG12 ? '/ 600 pts' : '/ 100%'}
              </span>
            </div>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full ${scoreBenchmark.pillClass}`}>
            {scoreBenchmark.status}
          </span>
        </div>

        {/* 3-Zone Benchmark Scale Bar */}
        <div className="space-y-2">
          <div className="w-full bg-ground border border-black/[0.06] dark:border-white/[0.08] h-3.5 rounded-full overflow-hidden p-0.5 relative">
            {/* Cutoff Reference Line at 350 pts (58.3%) */}
            {isG12 && (
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-slate-300 dark:bg-slate-600 z-10" 
                style={{ left: '58.3%' }} 
                title="350 Pass Mark"
              />
            )}
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-bespoke ${scoreBenchmark.barColor}`}
              style={{ width: `${Math.max(3, scoreBenchmark.percent)}%` }}
            />
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-0.5">
            <span>0</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {isG12 ? '350 Cutoff' : '50% Pass'}
            </span>
            <span>{isG12 ? '600' : '100%'}</span>
          </div>
        </div>

        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed border-t border-black/[0.04] dark:border-white/[0.04] pt-3">
          {scoreBenchmark.summary}
        </p>
      </section>

      {/* ── 3. FOUR TELEMETRY STATS (2x2 BENTO) ──────────────────────── */}
      <section 
        aria-label="Study Metrics"
        className="grid grid-cols-2 gap-3"
      >
        {/* Accuracy */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-4 shadow-bespoke-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" /> Accuracy
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {totalCorrect}/{totalAttempted}
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {overallAccuracy}%
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              correct answers
            </p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-4 shadow-bespoke-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" /> Solved
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {stats.length} subjects
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {totalAttempted}
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              questions practiced
            </p>
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-4 shadow-bespoke-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" /> Focus Time
          </span>
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {formatSeconds(totalTimeSeconds)}
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              in practice sessions
            </p>
          </div>
        </div>

        {/* Exam Pace Velocity */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-4 shadow-bespoke-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" /> Speed
          </span>
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {avgPaceSeconds > 0 ? `${avgPaceSeconds}s` : '—'}
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {avgPaceSeconds > 0 && avgPaceSeconds <= 85 ? 'Within 90s exam limit' : 'avg per question'}
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. WEAKEST SUBJECT ALERT (CONCRETE SCORE GAIN) ──────────── */}
      {weakestSubject && weakestSubject.questions_attempted >= 3 && (
        (() => {
          const acc = Math.round((weakestSubject.questions_correct / weakestSubject.questions_attempted) * 100);
          if (acc >= 75) return null;

          return (
            <section 
              aria-label="Priority Improvement Area"
              className="bg-card border border-amber-500/25 dark:border-amber-500/35 rounded-[22px] p-4.5 shadow-bespoke-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Priority Focus Area
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {acc}% accuracy
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {weakestSubject.subject}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      You answered {weakestSubject.questions_correct} of {weakestSubject.questions_attempted} correctly. Solving 20 more practice questions in {weakestSubject.subject} will boost your overall score the fastest.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptic.impact('medium');
                    router.push('/practice');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shrink-0 hover:bg-primary/95 active:scale-[0.98] transition-all shadow-sm flex items-center gap-1"
                >
                  <span>Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          );
        })()
      )}

      {/* ── 5. CURRICULUM COVERAGE CHECK (UNTOUCHED SUBJECTS) ───────── */}
      {unpracticedSubjects.length > 0 && (
        <section 
          aria-label="Curriculum Completeness"
          className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[22px] p-4.5 shadow-bespoke-sm space-y-3"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Exam Subjects Not Yet Practiced ({unpracticedSubjects.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            For an accurate total score prediction, try solving at least one quiz set for each exam subject:
          </p>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {unpracticedSubjects.map(sub => (
              <button
                key={sub}
                onClick={() => {
                  haptic.selection();
                  router.push('/practice');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ground border border-black/[0.06] dark:border-white/[0.08] hover:border-primary/30 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-all active:scale-95"
              >
                <span>{getSubjectEmoji(sub)}</span>
                <span>{sub}</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. SUBJECT PERFORMANCE LIST ──────────────────────────────── */}
      <section aria-label="Subject Scores" className="space-y-3">
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Subject Breakdown ({stats.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-ground border border-black/[0.06] dark:border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => {
                haptic.selection();
                setFilterMode('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-card text-gray-900 dark:text-gray-100 shadow-bespoke-sm border border-black/[0.06] dark:border-white/[0.08]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                haptic.selection();
                setFilterMode('needs_practice');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'needs_practice'
                  ? 'bg-card text-gray-900 dark:text-gray-100 shadow-bespoke-sm border border-black/[0.06] dark:border-white/[0.08]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Needs Work
            </button>
            <button
              onClick={() => {
                haptic.selection();
                setFilterMode('strong');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'strong'
                  ? 'bg-card text-gray-900 dark:text-gray-100 shadow-bespoke-sm border border-black/[0.06] dark:border-white/[0.08]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Strong
            </button>
          </div>
        </div>

        {/* Subject Cards */}
        {filteredStats.length === 0 ? (
          <div className="bg-card border border-dashed border-black/10 dark:border-white/10 rounded-[22px] p-6 text-center space-y-1">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
              No subjects in this category
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filterMode === 'needs_practice'
                ? 'All your practiced subjects are currently at 65% accuracy or higher!'
                : 'Solve more questions to build your subject scores.'}
            </p>
            <button
              onClick={() => setFilterMode('all')}
              className="text-xs font-bold text-primary hover:underline pt-2 block mx-auto"
            >
              Show all subjects
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStats.map(stat => {
              const accuracy = stat.questions_attempted > 0 
                ? Math.round((stat.questions_correct / stat.questions_attempted) * 100) 
                : 0;
              const emoji = getSubjectEmoji(stat.subject);
              const subjectTheme = getSubjectTheme(stat.subject);
              const pace = stat.questions_attempted > 0 
                ? Math.round((stat.total_time_spent_seconds || 0) / stat.questions_attempted) 
                : 0;

              const status = accuracy >= 75 
                ? { label: 'Strong', badge: 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]', bar: 'bg-[hsl(145,42%,38%)]' }
                : accuracy >= 55 
                ? { label: 'Fair', badge: 'bg-primary/10 text-primary', bar: 'bg-primary' }
                : { label: 'Needs Work', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' };

              return (
                <div
                  key={stat.subject}
                  className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[22px] p-4.5 shadow-bespoke-sm space-y-3 transition-all hover:border-black/15 dark:hover:border-white/15"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${subjectTheme}`}>
                        {emoji}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {stat.subject}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {stat.questions_correct} of {stat.questions_attempted} questions right
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 block">
                        {accuracy}%
                      </span>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="w-full bg-ground border border-black/[0.04] dark:border-white/[0.06] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-bespoke ${status.bar}`}
                      style={{ width: `${Math.max(4, accuracy)}%` }}
                    />
                  </div>

                  {/* Footer Stats & Quick Practice CTA */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                    <span>{formatSeconds(stat.total_time_spent_seconds)} studied{pace > 0 ? ` • ${pace}s/Q` : ''}</span>
                    <button
                      onClick={() => {
                        haptic.selection();
                        router.push('/practice');
                      }}
                      className="font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 active:scale-95 transition-all"
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

      {/* ── 7. EMPTY STATE (IF ZERO HISTORY) ─────────────────────────── */}
      {stats.length === 0 && (
        <section className="bg-card border-2 border-dashed border-black/10 dark:border-white/10 rounded-[24px] p-8 text-center flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-primary/40 mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
            No Practice Sessions Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
            Take a past exam or solve a practice set to see your estimated score, subject strengths, and exam pace.
          </p>
          <button
            onClick={() => {
              haptic.impact('medium');
              router.push('/practice');
            }}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-bespoke-sm active:scale-95 transition-all"
          >
            Start Practicing
          </button>
        </section>
      )}

    </div>
  );
};
