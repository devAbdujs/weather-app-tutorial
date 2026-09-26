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
  GraduationCap
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

// Standard Ethiopian Curriculum Subjects by Track
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

  // Overall Numbers
  const totalAttempted = useMemo(() => stats.reduce((acc, s) => acc + (s.questions_attempted || 0), 0), [stats]);
  const totalCorrect = useMemo(() => stats.reduce((acc, s) => acc + (s.questions_correct || 0), 0), [stats]);
  const overallAccuracy = useMemo(() => totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0, [totalAttempted, totalCorrect]);
  const totalTimeSeconds = useMemo(() => stats.reduce((acc, s) => acc + (s.total_time_spent_seconds || 0), 0), [stats]);
  const avgPaceSeconds = useMemo(() => totalAttempted > 0 ? Math.round(totalTimeSeconds / totalAttempted) : 0, [totalAttempted, totalTimeSeconds]);

  // Exam Track Logic
  const isG12 = !profile?.target_exam || profile?.target_exam === 'entrance';
  const stream = profile?.stream || 'Natural Science';
  const targetCurriculum = CURRICULUM_SUBJECTS[stream] || CURRICULUM_SUBJECTS['Natural Science'];

  // Grade 12 is scored out of 600 points (approx 6 main subjects * 100 points)
  const estimatedScore = useMemo(() => {
    if (totalAttempted === 0) return 0;
    if (isG12) {
      return Math.min(600, Math.round((overallAccuracy / 100) * 600));
    }
    return overallAccuracy; // for university freshman / exit, it is percentage out of 100%
  }, [totalAttempted, isG12, overallAccuracy]);

  // Real-world status based on actual Ethiopian university cutoffs
  const scoreStatus = useMemo(() => {
    if (totalAttempted === 0) {
      return {
        badgeText: 'No Data Yet',
        badgeClass: 'bg-ground text-muted border border-border',
        barColor: 'bg-primary',
        explanation: 'Complete your first practice quiz to see your estimated score.',
      };
    }

    if (isG12) {
      if (estimatedScore >= 460) {
        return {
          badgeText: 'Safe for Top Campuses',
          badgeClass: 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]',
          barColor: 'bg-[hsl(145,42%,38%)]',
          explanation: 'AAU, ASTU, and medicine programs usually admit at 450+ points. Keep this pace!',
        };
      }
      if (estimatedScore >= 360) {
        return {
          badgeText: 'Above Passing Cutoff',
          badgeClass: 'bg-primary/10 text-primary',
          barColor: 'bg-primary',
          explanation: 'On track to pass the university entrance mark (350 points). Push harder for higher university placement.',
        };
      }
      if (estimatedScore >= 300) {
        const gap = 350 - estimatedScore;
        return {
          badgeText: 'Close to Cutoff',
          badgeClass: 'bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)]',
          barColor: 'bg-[hsl(36,58%,42%)]',
          explanation: `You are about ${gap} points away from the 350-point pass mark. Focus on your weakest subjects.`,
        };
      }
      return {
        badgeText: 'Below Passing Mark',
        badgeClass: 'bg-error/10 text-error',
        barColor: 'bg-error',
        explanation: 'More practice is needed to cross the 350-point entrance requirement. Review mistakes regularly.',
      };
    }

    // Freshman / Exit Exam (Pass mark = 50%, Distinction = 75%+)
    if (overallAccuracy >= 75) {
      return {
        badgeText: 'Distinction Pace',
        badgeClass: 'bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]',
        barColor: 'bg-[hsl(145,42%,38%)]',
        explanation: 'Well above the 50% pass mark. Excellent retention across topics.',
      };
    }
    if (overallAccuracy >= 50) {
      return {
        badgeText: 'Passing Standing',
        badgeClass: 'bg-primary/10 text-primary',
        barColor: 'bg-primary',
        explanation: 'Meeting the 50% pass requirement. Review tricky areas to secure your margin.',
      };
    }
    return {
      badgeText: 'Below 50% Pass Mark',
      badgeClass: 'bg-error/10 text-error',
      barColor: 'bg-error',
      explanation: 'Currently below the 50% graduation/pass requirement. Spend more time on problem sets.',
    };
  }, [totalAttempted, isG12, estimatedScore, overallAccuracy]);

  // Find the subject that needs the most help
  const weakestSubject = useMemo(() => {
    const attemptedList = stats.filter(s => s.questions_attempted >= 3);
    if (attemptedList.length === 0) return null;
    return [...attemptedList].sort((a, b) => {
      const accA = a.questions_correct / a.questions_attempted;
      const accB = b.questions_correct / b.questions_attempted;
      return accA - accB;
    })[0];
  }, [stats]);

  // Find curriculum subjects the student hasn't touched yet
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

  const examLabel = useMemo(() => {
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
    <div className="flex flex-col pt-3 px-3.5 sm:px-4 pb-28 animate-fade-in bg-ground max-w-lg mx-auto w-full space-y-4">
      
      {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-1">
            My Exam Progress
          </h1>
          <p className="text-xs font-semibold text-muted">
            {examLabel}
          </p>
        </div>

        {profile?.daily_streak ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(36,58%,42%)]/10 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] text-xs font-bold border border-[hsl(36,58%,42%)]/20">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{profile.daily_streak}d streak</span>
          </div>
        ) : null}
      </header>

      {/* ── 2. SCORE ESTIMATOR CARD ──────────────────────────────────── */}
      <section 
        aria-label="Estimated Exam Score"
        className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-5 shadow-sm space-y-3.5"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
              Estimated Exam Score
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
                {totalAttempted > 0 ? (isG12 ? estimatedScore : `${overallAccuracy}%`) : '—'}
              </span>
              <span className="text-sm font-bold text-muted font-mono">
                {isG12 ? '/ 600 pts' : '/ 100%'}
              </span>
            </div>
          </div>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${scoreStatus.badgeClass}`}>
            {scoreStatus.badgeText}
          </span>
        </div>

        {/* Cutoff Benchmark Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-ground border border-black/[0.06] dark:border-white/[0.08] h-3 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-bespoke ${scoreStatus.barColor}`}
              style={{ width: `${Math.max(4, Math.min(100, isG12 ? (estimatedScore / 600) * 100 : overallAccuracy))}%` }}
            />
          </div>

          {/* Benchmark Marks */}
          <div className="flex justify-between items-center text-[10px] font-semibold text-muted px-0.5">
            <span>0 pts</span>
            <span className="text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] font-bold">
              Pass Cutoff: {isG12 ? '350 pts' : '50%'}
            </span>
            <span>{isG12 ? '600 pts' : '100%'}</span>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          {scoreStatus.explanation}
        </p>
      </section>

      {/* ── 3. FOUR CLEAR STUDY METRICS ──────────────────────────────── */}
      <section 
        aria-label="Practice Summary"
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

        {/* Questions Practiced */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[hsl(199,65%,40%)]" /> Practiced
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
            {totalAttempted}
          </span>
          <span className="text-[10px] font-semibold text-muted mt-1">
            questions solved
          </span>
        </div>

        {/* Time Spent */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[hsl(36,58%,42%)]" /> Study Time
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
            {formatSeconds(totalTimeSeconds)}
          </span>
          <span className="text-[10px] font-semibold text-muted mt-1">
            time in sessions
          </span>
        </div>

        {/* Speed */}
        <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[hsl(145,42%,38%)]" /> Avg Speed
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
            {avgPaceSeconds > 0 ? `${avgPaceSeconds}s` : '—'}
          </span>
          <span className="text-[10px] font-semibold text-muted mt-1">
            {avgPaceSeconds > 0 && avgPaceSeconds <= 85 ? 'Good pace (≤90s)' : 'per question'}
          </span>
        </div>
      </section>

      {/* ── 4. WEAKEST SUBJECT ALERT ─────────────────────────────────── */}
      {weakestSubject && weakestSubject.questions_attempted >= 3 && (
        (() => {
          const acc = Math.round((weakestSubject.questions_correct / weakestSubject.questions_attempted) * 100);
          if (acc >= 75) return null; // If all subjects are strong, don't show warning

          return (
            <section 
              aria-label="Subject Needing Attention"
              className="bg-card border border-amber-500/25 dark:border-amber-500/35 rounded-[20px] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-0.5">
                      Subject Needing Work
                    </h3>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {weakestSubject.subject} is at {acc}% correct
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      You got {weakestSubject.questions_correct} of {weakestSubject.questions_attempted} right. Practicing 20 more questions here will boost your total score the fastest.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptic.impact('light');
                    router.push('/practice');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shrink-0 hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                >
                  Practice
                </button>
              </div>
            </section>
          );
        })()
      )}

      {/* ── 5. UNPRACTICED CURRICULUM SUBJECTS ───────────────────────── */}
      {unpracticedSubjects.length > 0 && (
        <section 
          aria-label="Unpracticed Subjects"
          className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-4 shadow-sm space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Exam Subjects Not Yet Practiced ({unpracticedSubjects.length})
            </h3>
          </div>
          <p className="text-xs text-muted">
            To get a reliable score prediction, try solving at least one quiz for each exam subject:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {unpracticedSubjects.map(sub => (
              <button
                key={sub}
                onClick={() => {
                  haptic.selection();
                  router.push('/practice');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ground border border-border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-foreground transition-all active:scale-95"
              >
                <span>{getSubjectEmoji(sub)}</span>
                <span>{sub}</span>
                <ArrowRight className="w-3 h-3 text-muted" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. SUBJECT BY SUBJECT SCORES ─────────────────────────────── */}
      <section aria-label="Subject Performance List">
        <div className="flex items-center justify-between mb-3 pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted">
            Subject Scores ({stats.length})
          </h2>

          {/* Simple Filter Pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                haptic.selection();
                setFilterMode('all');
              }}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                haptic.selection();
                setFilterMode('needs_practice');
              }}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                filterMode === 'needs_practice'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Needs Work
            </button>
            <button
              onClick={() => {
                haptic.selection();
                setFilterMode('strong');
              }}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                filterMode === 'strong'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Strong
            </button>
          </div>
        </div>

        {/* Cards */}
        {filteredStats.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-[20px] p-6 text-center">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">
              No subjects in this view
            </p>
            <p className="text-xs text-muted mb-3">
              {filterMode === 'needs_practice'
                ? 'All your practiced subjects are currently at 65% accuracy or higher!'
                : 'Solve more questions to build your subject scores.'}
            </p>
            <button
              onClick={() => setFilterMode('all')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Show all subjects
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
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
                ? { label: 'Strong', badge: 'text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]', bar: 'bg-[hsl(145,42%,38%)]' }
                : accuracy >= 55 
                ? { label: 'Fair', badge: 'text-primary', bar: 'bg-primary' }
                : { label: 'Needs Practice', badge: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' };

              return (
                <div
                  key={stat.subject}
                  className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[20px] p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${subjectTheme}`}>
                        {emoji}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {stat.subject}
                        </h4>
                        <span className="text-[11px] text-muted">
                          {stat.questions_correct} of {stat.questions_attempted} correct
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black font-mono tracking-tight text-gray-900 dark:text-gray-100">
                        {accuracy}%
                      </span>
                      <span className={`block text-[10px] font-bold ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="w-full bg-ground border border-black/[0.04] dark:border-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
                      style={{ width: `${Math.max(4, accuracy)}%` }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                    <span>{formatSeconds(stat.total_time_spent_seconds)} studied{pace > 0 ? ` • ${pace}s/Q` : ''}</span>
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

      {/* ── 7. EMPTY STATE (IF 0 QUESTIONS EVER) ─────────────────────── */}
      {stats.length === 0 && (
        <section className="bg-card border-2 border-dashed border-border rounded-[24px] p-8 text-center flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-primary/40 mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
            No Practice Sessions Yet
          </h3>
          <p className="text-xs text-muted max-w-xs mb-5">
            Take a past exam or solve a practice set to see your estimated score, subject strengths, and exam pace.
          </p>
          <button
            onClick={() => {
              haptic.impact('medium');
              router.push('/practice');
            }}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            Start Practicing
          </button>
        </section>
      )}

    </div>
  );
};
