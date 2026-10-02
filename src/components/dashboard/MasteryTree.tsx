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
  BarChart3,
  Award
} from 'lucide-react';
import { getSubjectTheme } from '@/components/practice/PracticeHub';
import { useGamificationStore, getLevelForXp, LEVELS } from '@/store/useGamificationStore';
import { sounds } from '@/lib/sounds';
import { MascotBubble, TemariMascot } from '@/components/mascot/TemariMascot';

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
  const { xp } = useGamificationStore();
  const currentLevel = getLevelForXp(xp);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  const xpInLevel = xp - currentLevel.minXp;
  const xpNeededInLevel = nextLevel ? nextLevel.minXp - currentLevel.minXp : 100;
  const levelProgress = nextLevel ? Math.min(100, Math.round((xpInLevel / xpNeededInLevel) * 100)) : 100;
  const xpRemaining = nextLevel ? nextLevel.minXp - xp : 0;

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
      
      {/* ── 1. HEADER ────────────────────── */}
      <header className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-1">
            Progress
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {examTrackTitle}
          </p>
        </div>
      </header>

      {/* ── 2. SCHOLAR LEVEL TIER CARD (DUOLINGO PROGRESSION) ───────── */}
      <section className="bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-card-lg p-4 shadow-tactile-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentLevel.badge}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-primary">Level {currentLevel.level}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100">{currentLevel.title}</span>
              </div>
              <p className="text-caption font-bold text-slate-500 dark:text-slate-400">
                {currentLevel.titleAmharic}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-gray-900 dark:text-gray-100 tabular-nums">
              {xp} XP
            </span>
            {nextLevel && (
              <p className="text-micro font-bold text-slate-500 dark:text-slate-400 block">
                {xpRemaining} XP to Lv.{nextLevel.level}
              </p>
            )}
          </div>
        </div>

        {/* Chunky XP Bar */}
        <div className="h-3 w-full bg-ground border border-black/[0.08] dark:border-white/[0.08] rounded-full p-0.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-accent-gold to-amber-400 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${levelProgress}%` }}
          >
            <div className="absolute inset-0 bg-white/25 h-1 rounded-full top-0" />
          </div>
        </div>
      </section>

      {/* ── 3. TEME GUIDANCE ───────────────────────────── */}
      <section>
        <MascotBubble
          mood={overallAccuracy >= 75 ? 'celebrating' : weakestSubject ? 'studying' : 'happy'}
          mascotSize={52}
          message={
            overallAccuracy >= 75 ? (
              <span>High accuracy at <strong>{overallAccuracy}%</strong>! Keep the streak alive 🔥</span>
            ) : weakestSubject ? (
              <span>Focus tip: Practicing <strong>{weakestSubject.subject}</strong> will boost your score fastest!</span>
            ) : (
              <span>Solve your first questions to unlock topic analytics!</span>
            )
          }
        />
      </section>

      {/* ── 4. FOUR TELEMETRY STATS (2x2 BENTO) ──────────────────────── */}
      <section 
        aria-label="Study Metrics"
        className="grid grid-cols-2 gap-3"
      >
        {/* Accuracy */}
        <div className="bg-tint-green text-tint-green-fg border-2 border-b-[3px] border-tint-green-border rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-black/40 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-2xs">
              <Target className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-micro font-black uppercase tracking-wider opacity-80 font-mono">
              {totalCorrect}/{totalAttempted}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono tracking-tight tabular-nums block">
              {overallAccuracy}%
            </span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 block">
              Accuracy
            </span>
          </div>
        </div>

        {/* Total Questions Solved */}
        <div className="bg-tint-sky text-tint-sky-fg border-2 border-b-[3px] border-tint-sky-border rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-black/40 flex items-center justify-center text-sky-600 dark:text-sky-300 shadow-2xs">
              <BookOpen className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-micro font-black uppercase tracking-wider opacity-80">
              {stats.length} Subjects
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono tracking-tight tabular-nums block">
              {totalAttempted}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 block">
              Solved
            </span>
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-tint-purple text-tint-purple-fg border-2 border-b-[3px] border-tint-purple-border rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-black/40 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-2xs">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono tracking-tight tabular-nums block">
              {formatSeconds(totalTimeSeconds)}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 block">
              Focus Time
            </span>
          </div>
        </div>

        {/* Speed / Pace */}
        <div className="bg-tint-peach text-tint-peach-fg border-2 border-b-[3px] border-tint-peach-border rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-black/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shadow-2xs">
            <Zap className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono tracking-tight tabular-nums block">
              {avgPaceSeconds > 0 ? `${avgPaceSeconds}s` : '—'}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 block">
              Pace / Q
            </span>
          </div>
        </div>
      </section>

      {/* ── 5. WEAKEST SUBJECT ALERT (CONCRETE SCORE GAIN) ──────────── */}
      {weakestSubject && weakestSubject.questions_attempted >= 3 && (
        (() => {
          const acc = Math.round((weakestSubject.questions_correct / weakestSubject.questions_attempted) * 100);
          if (acc >= 75) return null;

          return (
            <section 
              aria-label="Priority Improvement Area"
              className="bg-card border border-accent-gold/30 border-b-bevel rounded-card p-4 shadow-tactile-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-card-sm bg-accent-gold/15 text-accent-gold flex items-center justify-center shrink-0 border border-accent-gold/30">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-micro font-black uppercase tracking-wider text-accent-gold">
                        Priority Focus Area
                      </span>
                      <span className="text-micro font-mono font-bold text-slate-400">
                        {acc}% accuracy
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
                      {weakestSubject.subject}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      You answered {weakestSubject.questions_correct} of {weakestSubject.questions_attempted} correctly. Solving 20 more practice questions in {weakestSubject.subject} will boost your overall score the fastest.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sounds.playTap();
                    haptic.impact('medium');
                    router.push('/practice');
                  }}
                  className="btn-3d-primary px-3.5 py-2 rounded-control text-xs font-black shrink-0 flex items-center gap-1"
                >
                  <span>Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          );
        })()
      )}

      {/* ── 6. CURRICULUM COVERAGE CHECK (UNTOUCHED SUBJECTS) ───────── */}
      {unpracticedSubjects.length > 0 && (
        <section 
          aria-label="Curriculum Completeness"
          className="bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-card p-4.5 shadow-tactile-sm space-y-3"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Exam Subjects Not Yet Practiced ({unpracticedSubjects.length})
            </h3>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            For an accurate total score prediction, try solving at least one quiz set for each exam subject:
          </p>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {unpracticedSubjects.map(sub => (
              <button
                key={sub}
                onClick={() => {
                  sounds.playTap();
                  haptic.selection();
                  router.push('/practice');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-ground border border-black/[0.08] dark:border-white/[0.08] border-b-2 hover:border-primary/40 text-xs font-black text-gray-800 dark:text-gray-200 transition-all active:translate-y-[1px]"
              >
                <span>{getSubjectEmoji(sub)}</span>
                <span>{sub}</span>
                <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. SUBJECT PERFORMANCE LIST ──────────────────────────────── */}
      <section aria-label="Subject Scores" className="space-y-3">
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Subject Breakdown ({stats.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-panel border-2 border-black/[0.08] dark:border-white/[0.08] p-1 rounded-2xl shadow-inner">
            {(['all', 'needs_practice', 'strong'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  sounds.playTap();
                  haptic.selection();
                  setFilterMode(tab);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all ${
                  filterMode === tab
                    ? 'bg-card text-gray-950 dark:text-white shadow-tactile-xs border border-black/[0.08] dark:border-white/[0.08]'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white font-bold'
                }`}
              >
                {tab === 'needs_practice' ? 'Needs Work' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Cards */}
        {filteredStats.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-black/10 dark:border-white/10 rounded-card-lg p-6 text-center space-y-1">
            <p className="text-xs font-black text-gray-900 dark:text-gray-100">
              No subjects in this category
            </p>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {filterMode === 'needs_practice'
                ? 'All your practiced subjects are currently at 65% accuracy or higher!'
                : 'Solve more questions to build your subject scores.'}
            </p>
            <button
              onClick={() => { sounds.playTap(); setFilterMode('all'); }}
              className="text-xs font-black text-primary hover:underline pt-2 block mx-auto"
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
                ? { label: '👑 Mastered', badge: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/40 font-black', bar: 'bg-accent-emerald' }
                : accuracy >= 55 
                ? { label: '🔥 On Track', badge: 'bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/40 font-black', bar: 'bg-accent-gold' }
                : { label: '🌱 Needs Work', badge: 'bg-rose-500/20 text-rose-950 dark:text-rose-200 border border-rose-500/40 font-black', bar: 'bg-accent-rose' };

              return (
                <div
                  key={stat.subject}
                  className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-card p-4 shadow-tactile-xs space-y-3 transition-all hover:border-black/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-10 h-10 rounded-btn flex items-center justify-center text-lg shrink-0 ${subjectTheme} shadow-tactile-xs`}>
                        {emoji}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
                          {stat.subject}
                        </h4>
                        <span className="text-caption font-bold text-slate-500 dark:text-slate-400">
                          {stat.questions_correct} of {stat.questions_attempted} correct
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 block">
                        {accuracy}%
                      </span>
                      <span className={`inline-block text-micro font-black px-2 py-0.5 rounded-full ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="w-full bg-ground border border-black/[0.06] dark:border-white/[0.06] h-2.5 rounded-full p-0.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${status.bar}`}
                      style={{ width: `${Math.max(6, accuracy)}%` }}
                    />
                  </div>

                  {/* Footer Stats & Quick Practice CTA */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
                    <span>{formatSeconds(stat.total_time_spent_seconds)} studied{pace > 0 ? ` • ${pace}s/Q` : ''}</span>
                    <button
                      onClick={() => {
                        sounds.playTap();
                        haptic.selection();
                        router.push('/practice?subject=' + encodeURIComponent(stat.subject));
                      }}
                      className="font-black text-primary hover:text-primary/80 flex items-center gap-0.5 active:scale-95 transition-all text-xs"
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

      {/* ── 8. EMPTY STATE (IF ZERO HISTORY) ─────────────────────────── */}
      {stats.length === 0 && (
        <section className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-hero p-8 text-center flex flex-col items-center shadow-tactile-sm">
          <TemariMascot mood="happy" size={90} className="mb-2" />
          <h3 className="text-base font-black text-gray-900 dark:text-gray-100 mb-1">
            Start Your Exam Prep!
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xs mb-5">
            Take a past exam or solve a practice set to unlock your accuracy stats, level up, and earn XP.
          </p>
          <button
            onClick={() => {
              sounds.playTap();
              haptic.impact('medium');
              router.push('/practice');
            }}
            className="btn-3d-primary px-6 py-3 rounded-card-sm text-xs font-black shadow-tactile-sm"
          >
            Start Practicing (+10 XP)
          </button>
        </section>
      )}

    </div>
  );
};
