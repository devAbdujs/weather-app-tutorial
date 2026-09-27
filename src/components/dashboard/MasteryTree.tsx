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
      
      {/* ── 1. HEADER (DISCIPLINED & TYPOGRAPHIC) ────────────────────── */}
      <header className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-1">
            Exam Progress
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {examTrackTitle}
          </p>
        </div>

        {profile?.daily_streak ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-accent-gold/15 text-accent-gold text-xs font-black border-2 border-accent-gold/30 shadow-bespoke-sm">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="font-mono">{profile.daily_streak}</span>
            <span className="text-[10px] uppercase tracking-wider">days</span>
          </div>
        ) : null}
      </header>

      {/* ── 2. SCHOLAR LEVEL TIER CARD (DUOLINGO PROGRESSION) ───────── */}
      <section className="bg-card border-2 border-b-[5px] border-black/[0.08] dark:border-white/[0.08] rounded-[26px] p-4.5 shadow-bespoke-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentLevel.badge}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-primary">Level {currentLevel.level}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100">{currentLevel.title}</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                {currentLevel.titleAmharic}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-gray-900 dark:text-gray-100 tabular-nums">
              {xp} XP
            </span>
            {nextLevel && (
              <p className="text-[10px] font-bold text-slate-400 block">
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

      {/* ── 3. TEME STUDY BUDDY GUIDANCE ───────────────────────────── */}
      <section>
        <MascotBubble
          mood={overallAccuracy >= 75 ? 'celebrating' : weakestSubject ? 'studying' : 'happy'}
          mascotSize={60}
          message={
            overallAccuracy >= 75 ? (
              <span>🦁 Outstanding mastery! Your accuracy is sitting high at <strong>{overallAccuracy}%</strong>. Keep pushing to retain the knowledge!</span>
            ) : weakestSubject ? (
              <span>🎯 Focus target: Practicing <strong>{weakestSubject.subject}</strong> will give you the fastest exam score boost right now!</span>
            ) : (
              <span>📚 Ready to level up? Solve your first set of past questions to begin your mastery journey!</span>
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
        <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-4 shadow-bespoke-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-accent-emerald/15 text-accent-emerald flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              Accuracy
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
              {totalCorrect}/{totalAttempted}
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {overallAccuracy}%
            </span>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              correct answers
            </p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-4 shadow-bespoke-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              Solved
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
              {stats.length} sub
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {totalAttempted}
            </span>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              questions practiced
            </p>
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-4 shadow-bespoke-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-accent-purple/15 text-accent-purple flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            Focus Time
          </span>
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {formatSeconds(totalTimeSeconds)}
            </span>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              in practice sessions
            </p>
          </div>
        </div>

        {/* Exam Pace Velocity */}
        <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-4 shadow-bespoke-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-accent-gold/15 text-accent-gold flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            Speed
          </span>
          <div>
            <span className="text-2xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {avgPaceSeconds > 0 ? `${avgPaceSeconds}s` : '—'}
            </span>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {avgPaceSeconds > 0 && avgPaceSeconds <= 85 ? 'Within 90s exam limit' : 'avg per question'}
            </p>
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
              className="bg-card border-2 border-b-[4px] border-accent-gold/30 rounded-[22px] p-4 shadow-bespoke-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-accent-gold/15 text-accent-gold flex items-center justify-center shrink-0 border border-accent-gold/30">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-accent-gold">
                        Priority Focus Area
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
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
                  className="btn-3d-primary px-3.5 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1"
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
          className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-4.5 shadow-bespoke-sm space-y-3"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4.5 h-4.5 text-primary" />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ground border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] hover:border-primary/40 text-xs font-black text-gray-800 dark:text-gray-200 transition-all active:border-b-0 active:translate-y-[2px]"
              >
                <span>{getSubjectEmoji(sub)}</span>
                <span>{sub}</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. SUBJECT PERFORMANCE LIST ──────────────────────────────── */}
      <section aria-label="Subject Scores" className="space-y-3">
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Subject Breakdown ({stats.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-panel border-2 border-black/[0.08] dark:border-white/[0.08] p-1 rounded-xl">
            {(['all', 'needs_practice', 'strong'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  sounds.playTap();
                  haptic.selection();
                  setFilterMode(tab);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black capitalize transition-all ${
                  filterMode === tab
                    ? 'bg-card text-gray-900 dark:text-gray-100 shadow-bespoke-sm border-b-2 border-black/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-gray-900'
                }`}
              >
                {tab === 'needs_practice' ? 'Needs Work' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Cards */}
        {filteredStats.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-black/10 dark:border-white/10 rounded-[22px] p-6 text-center space-y-1">
            <p className="text-xs font-black text-gray-900 dark:text-gray-100">
              No subjects in this category
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                ? { label: '👑 Mastered', badge: 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30', bar: 'bg-accent-emerald' }
                : accuracy >= 55 
                ? { label: '🔥 On Track', badge: 'bg-primary/15 text-primary border border-primary/30', bar: 'bg-primary' }
                : { label: '🌱 Needs Work', badge: 'bg-accent-rose/15 text-accent-rose border border-accent-rose/30', bar: 'bg-accent-rose' };

              return (
                <div
                  key={stat.subject}
                  className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-[22px] p-4 shadow-bespoke-sm space-y-3 transition-all hover:border-black/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-10 h-10 rounded-[14px] flex items-center justify-center text-lg shrink-0 ${subjectTheme} shadow-xs`}>
                        {emoji}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
                          {stat.subject}
                        </h4>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {stat.questions_correct} of {stat.questions_attempted} correct
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 block">
                        {accuracy}%
                      </span>
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full ${status.badge}`}>
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
                        router.push('/practice');
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
        <section className="bg-card border-2 border-b-[5px] border-black/[0.08] dark:border-white/[0.08] rounded-[28px] p-8 text-center flex flex-col items-center shadow-bespoke-sm">
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
            className="btn-3d-primary px-6 py-3 rounded-[16px] text-xs font-black shadow-bespoke-sm"
          >
            Start Practicing (+10 XP)
          </button>
        </section>
      )}

    </div>
  );
};
