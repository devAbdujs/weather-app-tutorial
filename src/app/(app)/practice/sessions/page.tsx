'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { getSessionCounts } from '@/app/actions/practice';
import { BookOpen, ChevronLeft, CheckCircle2, ArrowRight, Layers, Clock } from 'lucide-react';

const MIDTERM_SIZE = 25;
const FINAL_SIZE = 50;

type SessionTab = 'midterm' | 'final';

interface SessionItem {
  id: number;
  count: number;
  offset: number;
  label: string;
  year?: number;
}

function SessionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { haptic, setBackButton } = useTelegram();

  const examType = searchParams.get('examType');
  const subject = searchParams.get('subject') || '';
  const year = searchParams.get('year') || '';

  const [loading, setLoading] = useState(true);
  const [midtermCount, setMidtermCount] = useState(0);
  const [finalCount, setFinalCount] = useState(0);
  const [untaggedCount, setUntaggedCount] = useState(0);
  const [entranceYears, setEntranceYears] = useState<{year: number, count: number}[]>([]);
  const [activeTab, setActiveTab] = useState<SessionTab>('midterm');
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  useEffect(() => {
    setBackButton(true, () => router.back());
    return () => setBackButton(false);
  }, [setBackButton, router]);

  const isFreshman = examType === 'freshman';
  const isEntrance = examType === 'entrance';
  const STANDARD_SIZE = 50;
  const EUEE_YEARS = [2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      const base = { examType: examType || undefined, subject: subject || undefined };

      if (isFreshman) {
        const total = await getSessionCounts(base);
        const half = Math.floor(total / 2);
        setMidtermCount(half);
        setFinalCount(total - half);
        setUntaggedCount(total);
      } else if (isEntrance) {
        // Fetch counts for all years in parallel
        const yearCounts = await Promise.all(
          EUEE_YEARS.map(async y => {
            const c = await getSessionCounts({ ...base, year: y });
            return { year: y, count: c };
          })
        );
        setEntranceYears(yearCounts.filter(yc => yc.count > 0));
        // We still fetch total just for display if needed
        const total = yearCounts.reduce((acc, curr) => acc + curr.count, 0);
        setUntaggedCount(total);
      } else {
        const total = await getSessionCounts({ ...base, year: year || undefined });
        setUntaggedCount(total);
      }
      setLoading(false);
    };
    fetchCounts();
  }, [examType, subject, year, isFreshman, isEntrance]);

  // Build session lists from counts
  const midtermSessions = useMemo((): SessionItem[] => {
    if (!isFreshman || midtermCount === 0) return [];
    const full = Math.floor(midtermCount / MIDTERM_SIZE);
    const rem = midtermCount % MIDTERM_SIZE;
    const list: SessionItem[] = Array.from({ length: full }, (_, i) => ({
      id: i + 1,
      count: MIDTERM_SIZE,
      offset: i * MIDTERM_SIZE,
      label: `Midterm Exam ${i + 1}`,
    }));
    if (rem >= 10) list.push({ id: full + 1, count: rem, offset: full * MIDTERM_SIZE, label: `Midterm Exam ${full + 1}` });
    return list;
  }, [midtermCount, isFreshman]);

  const finalSessions = useMemo((): SessionItem[] => {
    if (isFreshman) {
      if (finalCount === 0) return [];
      const full = Math.floor(finalCount / FINAL_SIZE);
      const rem = finalCount % FINAL_SIZE;
      const finalBaseOffset = midtermCount; 
      const list: SessionItem[] = Array.from({ length: full }, (_, i) => ({
        id: i + 1,
        count: FINAL_SIZE,
        offset: finalBaseOffset + (i * FINAL_SIZE),
        label: `Final Exam ${i + 1}`,
      }));
      if (rem >= 10) list.push({ id: full + 1, count: rem, offset: finalBaseOffset + (full * FINAL_SIZE), label: `Final Exam ${full + 1}` });
      return list;
    } else if (isEntrance) {
      return entranceYears.map((yc, i) => ({
        id: yc.year, // Use year as ID
        count: yc.count,
        offset: 0, // Year based, not offset based
        label: `${yc.year} E.C. Exam`,
        year: yc.year // Add custom property
      }));
    } else {
      if (untaggedCount === 0) return [];
      const full = Math.floor(untaggedCount / STANDARD_SIZE);
      const rem = untaggedCount % STANDARD_SIZE;
      const list: SessionItem[] = Array.from({ length: full }, (_, i) => ({
        id: i + 1,
        count: STANDARD_SIZE,
        offset: i * STANDARD_SIZE,
        label: `Practice Set ${i + 1}`,
      }));
      if (rem >= 10) list.push({ id: full + 1, count: rem, offset: full * STANDARD_SIZE, label: `Practice Set ${full + 1}` });
      return list;
    }
  }, [finalCount, untaggedCount, midtermCount, isFreshman, isEntrance, entranceYears]);

  const displayedSessions = isFreshman ? (activeTab === 'midterm' ? midtermSessions : finalSessions) : finalSessions;


  const handleStart = (session: SessionItem, mode: 'practice' | 'exam') => {
    haptic.impact('heavy');
    try {
      localStorage.setItem('temari_last_session', JSON.stringify({
        subject,
        examType: examType || '',
        sessionId: session.id,
        sessionSize: session.count,
        mode,
        label: session.label,
      }));
    } catch {}

    const params = new URLSearchParams({
      examType: examType || '',
      sessionSize: session.count.toString(),
      sessionOffset: session.offset.toString(),
      mode,
    });
    if (subject) params.set('subject', subject);
    if (session.year) {
      params.set('year', session.year.toString());
    } else if (year) {
      params.set('year', year);
    }
    
    // We do NOT set 'period' here anymore because the DB doesn't have it populated.
    // The sessionOffset handles slicing it properly.

    router.push(`/exam/session?${params.toString()}`);
  };

  const title = subject;
  const subtitle = isFreshman ? 'Freshman Exam Bank' : isEntrance ? 'Grade 12 Entrance' : 'University Exit Exam';

  return (
    <div className="min-h-screen bg-ground pb-28 text-gray-900 dark:text-gray-100 animate-fade-in">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10 bg-ground/90 dark:bg-ground/95 backdrop-blur-xl border-b border-black/5 dark:border-white/8 px-5 pt-safe pt-5 pb-3 mb-4 flex items-center gap-3">
        <button
          onClick={() => { haptic.selection(); router.back(); }}
          className="w-10 h-10 flex items-center justify-center rounded-[14px] bg-card border border-black/5 dark:border-white/8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 active:scale-[0.98] active:opacity-80 transition-all shadow-sm shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight truncate">{title}</h1>
          <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* ── TABS ── */}
      {isFreshman && (
        <div className="px-5 pt-2 pb-4">
          <div className="bg-black/5 dark:bg-white/5 p-1 rounded-[16px] flex gap-1">
            <button
              onClick={() => { haptic.selection(); setActiveTab('midterm'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${
                activeTab === 'midterm' ? 'bg-card text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Midterm
              {!loading && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'midterm' ? 'bg-primary/10 text-gray-900 dark:text-gray-100' : 'bg-black/10 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                  {midtermSessions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { haptic.selection(); setActiveTab('final'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${
                activeTab === 'final' ? 'bg-card text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Final
              {!loading && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'final' ? 'bg-primary/10 text-gray-900 dark:text-gray-100' : 'bg-black/10 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                  {finalSessions.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

        {/* Hint about question count */}
        {!loading && (
          <p className="text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">
            {isFreshman 
              ? (activeTab === 'midterm' 
                ? `${MIDTERM_SIZE} questions per exam · ${midtermCount} total`
                : `${FINAL_SIZE} questions per exam · ${finalCount} total`)
              : `${STANDARD_SIZE} questions per exam · ${untaggedCount} total`}
          </p>
        )}

      {/* ── SESSION LIST ── */}
      <div className="px-5 animate-fade-in">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[72px] bg-primary/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : displayedSessions.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-black/8 rounded-3xl p-10 text-center mt-2">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">No exams yet</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
              No exams available for this subject yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { haptic.selection(); setSelectedSession(s); }}
                className="w-full group bg-card p-4 rounded-2xl border border-black/5 dark:border-white/8 shadow-sm hover:border-primary/30 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-black text-lg shrink-0 ${
                  isFreshman && activeTab === 'midterm' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700' : 'bg-violet-50 dark:bg-violet-900/30 text-violet-700'
                }`}>
                  {s.id}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">{s.label}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    {s.count} questions
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-ground flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MODE SELECTION MODAL ── */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-card w-full max-w-sm rounded-[32px] shadow-2xl animate-scale-bounce overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-black/5 dark:border-white/8">
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{selectedSession.count} questions</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{selectedSession.label}</h3>
            </div>

            {/* Mode options */}
            <div className="p-4 space-y-3">
              {/* Practice */}
              <button
                onClick={() => handleStart(selectedSession, 'practice')}
                className="w-full group text-left p-4 rounded-[20px] bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-[0.97] transition-all flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-[18px] bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-emerald-950 text-[17px] leading-tight">Practice Mode</h4>
                  <p className="text-xs font-medium text-emerald-800/60 mt-0.5">Instant feedback · learn as you go</p>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              </button>

              {/* Exam */}
              <button
                onClick={() => handleStart(selectedSession, 'exam')}
                className="w-full group text-left p-4 rounded-[20px] bg-primary/5 hover:bg-primary/10 active:scale-[0.97] transition-all flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-[18px] bg-primary text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-gray-900 dark:text-gray-100 text-[17px] leading-tight">Exam Mode</h4>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Timed · answers revealed at the end</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors shrink-0" />
              </button>
            </div>

            {/* Cancel */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-3.5 rounded-[16px] bg-black/5 dark:bg-white/5 hover:bg-black/8 text-sm font-bold text-gray-600 dark:text-gray-400 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ground" />}>
      <SessionsContent />
    </Suspense>
  );
}
