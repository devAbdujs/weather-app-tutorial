'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  FileText, 
  Compass, 
  Search, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Loader2, 
  Flame,
  ChevronRight,
  X
} from 'lucide-react';
import { TrackSummary, SubjectSummary, Question } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';
import { offlineDb, updateDailyStreak } from '@/lib/offlineDb';

interface TrackSelectorProps {
  onStartExam: (config: {
    examType: string;
    subject: string;
    year?: number;
    isSimulator: boolean;
    questions: Question[];
    title: string;
  }) => void;
}

const TRACK_ICONS: Record<string, React.ReactNode> = {
  entrance: <GraduationCap className="w-5 h-5" />,
  freshman: <BookOpen className="w-5 h-5" />,
  exit: <Award className="w-5 h-5" />,
  grade8: <FileText className="w-5 h-5" />,
  grade6: <Compass className="w-5 h-5" />,
};

export const TrackSelector: React.FC<TrackSelectorProps> = ({ onStartExam }) => {
  const { haptic, user } = useTelegram();
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const [activeTrack, setActiveTrack] = useState<string>('entrance');
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<'All' | 'Natural Science' | 'Social Science'>('All');
  const [streak, setStreak] = useState(1);

  // Setup modal state
  const [selectedSubject, setSelectedSubject] = useState<SubjectSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [examMode, setExamMode] = useState<'practice' | 'simulator'>('practice');
  const [isLaunching, setIsLaunching] = useState(false);

  // Load streak on mount
  useEffect(() => {
    updateDailyStreak().then((val) => setStreak(val));
  }, []);

  // Fetch tracks
  useEffect(() => {
    fetch('/api/tracks')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTracks(data.tracks);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch subjects whenever activeTrack changes
  useEffect(() => {
    setLoadingSubjects(true);
    fetch(`/api/subjects?track=${activeTrack}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubjects(data.subjects);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSubjects(false));
  }, [activeTrack]);

  // Filter subjects based on search & stream
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch = s.subject.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (activeTrack === 'entrance' && selectedStream !== 'All') {
        return s.category === selectedStream;
      }
      return true;
    });
  }, [subjects, searchQuery, selectedStream, activeTrack]);

  const handleSelectTrack = (trackId: string) => {
    haptic.selection();
    setActiveTrack(trackId);
    setSelectedStream('All');
    setSearchQuery('');
  };

  const handleOpenSetup = (sub: SubjectSummary) => {
    haptic.impact('light');
    setSelectedSubject(sub);
    setSelectedYear(sub.years.length > 0 ? sub.years[0] : 'all');
  };

  const handleLaunchExam = async () => {
    if (!selectedSubject) return;
    haptic.impact('medium');
    setIsLaunching(true);

    const yearParam = selectedYear === 'all' ? undefined : selectedYear;
    const cacheKey = `${activeTrack}_${selectedSubject.subject}_${selectedYear}`;

    try {
      let questions: Question[] = [];

      // Check IndexedDB cache first
      if (offlineDb) {
        const cached = await offlineDb.questionCache.get(cacheKey);
        if (cached && cached.questions.length > 0) {
          questions = cached.questions;
        }
      }

      // If not in cache, fetch from API
      if (questions.length === 0) {
        let url = `/api/questions?examType=${activeTrack}&subject=${encodeURIComponent(selectedSubject.subject)}&limit=50`;
        if (yearParam) {
          url += `&year=${yearParam}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.questions.length > 0) {
          questions = data.questions;
          // Save to IndexedDB cache
          if (offlineDb) {
            offlineDb.questionCache.put({
              key: cacheKey,
              cachedAt: new Date().toISOString(),
              questions,
            }).catch(console.error);
          }
        }
      }

      if (questions.length === 0) {
        alert('No questions found for this selection.');
        setIsLaunching(false);
        return;
      }

      const yearLabel = yearParam ? `${yearParam} E.C.` : 'Comprehensive';
      const title = `${selectedSubject.subject} — ${yearLabel}`;

      onStartExam({
        examType: activeTrack,
        subject: selectedSubject.subject,
        year: yearParam,
        isSimulator: examMode === 'simulator',
        questions,
        title,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load questions. Please check connection.');
    } finally {
      setIsLaunching(false);
      setSelectedSubject(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 p-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-sm text-white shadow-md shadow-blue-500/30">
                E
              </div>
              <span className="text-base font-bold text-white tracking-tight">EthioExam Master</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{streak} Days</span>
          </div>
        </div>

        {/* Track Selection Horizontal Scroller */}
        <div className="flex gap-2 overflow-x-auto mt-5 pb-1 no-scrollbar">
          {tracks.map((t) => {
            const isActive = activeTrack === t.exam_type;
            return (
              <button
                key={t.exam_type}
                onClick={() => handleSelectTrack(t.exam_type)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 border shrink-0 ${
                  isActive
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {TRACK_ICONS[t.exam_type] || <BookOpen className="w-4 h-4" />}
                <span>{t.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Track Details & Subjects Arena */}
      <div className="p-4 space-y-4">
        {/* Track Header Card */}
        {tracks.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div>
              <h2 className="text-sm font-bold text-white">
                {tracks.find((t) => t.exam_type === activeTrack)?.title}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {tracks.find((t) => t.exam_type === activeTrack)?.subtitle}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-blue-400">
                {tracks.find((t) => t.exam_type === activeTrack)?.questionCount.toLocaleString()}
              </span>
              <span className="block text-[10px] text-slate-500">Questions</span>
            </div>
          </div>
        )}

        {/* Entrance Stream Filters */}
        {activeTrack === 'entrance' && (
          <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            {(['All', 'Natural Science', 'Social Science'] as const).map((stream) => {
              const isSelected = selectedStream === stream;
              return (
                <button
                  key={stream}
                  onClick={() => {
                    haptic.selection();
                    setSelectedStream(stream);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {stream}
                </button>
              );
            })}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search subjects or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Subject Cards Grid */}
        {loadingSubjects ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading course catalog...</span>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No subjects matching your criteria.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredSubjects.map((sub) => (
              <div
                key={sub.subject}
                onClick={() => handleOpenSetup(sub)}
                className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-150 cursor-pointer active:scale-[0.99] flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {sub.subject.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {sub.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">
                        {sub.questionCount} Questions
                      </span>
                      {sub.years.length > 0 && (
                        <span className="text-[10px] text-slate-500">
                          • {sub.years.length} Years
                        </span>
                      )}
                      {sub.category && (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                          {sub.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-slate-500 group-hover:text-slate-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exam Setup Modal / Sheet */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-2 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedSubject.subject}</h3>
                <p className="text-[11px] text-slate-400">Configure your practice or exam session</p>
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Year Selector */}
            {selectedSubject.years.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Examination Year</label>
                <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-1">
                  <button
                    onClick={() => setSelectedYear('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      selectedYear === 'all'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    All Years (Mixed)
                  </button>
                  {selectedSubject.years.map((y) => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedYear === y
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {y} E.C.
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Session Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExamMode('practice')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    examMode === 'practice'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Practice Mode
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Instant answer verification, step explanations, & AI Tutor hints.
                  </p>
                </button>

                <button
                  onClick={() => setExamMode('simulator')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    examMode === 'simulator'
                      ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Exam Simulator
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Strict countdown timer, no answers revealed until scorecard.
                  </p>
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleLaunchExam}
              disabled={isLaunching}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing Examination...
                </>
              ) : (
                <>
                  Start Session
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
