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
  const [activeTab, setActiveTab] = useState<SessionTab>('midterm');
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  useEffect(() => {
    setBackButton(true, () => router.back());
    return () => setBackButton(false);
  }, [setBackButton, router]);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      const base = { examType: examType || undefined, subject: subject || undefined };

      // Fetch tagged counts in parallel
      const [mCount, fCount, total] = await Promise.all([
        getSessionCounts({ ...base, period: 'midterm' }),
        getSessionCounts({ ...base, period: 'final' }),
        getSessionCounts(base),
      ]);

      const untagged = total - mCount - fCount;
      // Assign untagged: first half → midterm, second half → final
      const untaggedMidShare = Math.floor(untagged * 0.5);
      const untaggedFinalShare = untagged - untaggedMidShare;

      setMidtermCount(mCount + untaggedMidShare);
      setFinalCount(fCount + untaggedFinalShare);
      setUntaggedCount(untagged);
      setLoading(false);
    };
    fetchCounts();
  }, [examType, subject]);

  // Build session lists from counts
  const midtermSessions = useMemo((): SessionItem[] => {
    if (midtermCount === 0) return [];
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
  }, [midtermCount]);

  const finalSessions = useMemo((): SessionItem[] => {
    if (finalCount === 0) return [];
    const full = Math.floor(finalCount / FINAL_SIZE);
    const rem = finalCount % FINAL_SIZE;
    // Final sessions start after the midterm pool in the DB
    const finalBaseOffset = midtermCount; 
    const list: SessionItem[] = Array.from({ length: full }, (_, i) => ({
      id: i + 1,
      count: FINAL_SIZE,
      offset: finalBaseOffset + i * FINAL_SIZE,
      label: `Final Exam ${i + 1}`,
    }));
    if (rem >= 10) list.push({ id: full + 1, count: rem, offset: finalBaseOffset + full * FINAL_SIZE, label: `Final Exam ${full + 1}` });
    return list;
  }, [finalCount, midtermCount]);

  const currentSessions = activeTab === 'midterm' ? midtermSessions : finalSessions;

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
    if (year) params.set('year', year);
    // Pass period so ExamSessionLoader can filter correctly
    params.set('period', activeTab);

    router.push(`/exam/session?${params.toString()}`);
  };

  const title = subject;

  return (
    <div className="min-h-screen bg-ground pb-28 text-primary animate-fade-in">

      {/* ── HEADER ── */}
      <div className="px-5 pt-safe pt-5 pb-3 flex items-center gap-3">
        <button
          onClick={() => { haptic.selection(); router.back(); }}
          className="w-10 h-10 flex items-center justify-center rounded-[14px] bg-card border border-black/5 text-secondary hover:text-primary active:scale-95 transition-all shadow-sm shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[22px] font-black text-primary tracking-tight leading-tight truncate">{title}</h1>
          <p className="text-xs font-medium text-tertiary mt-0.5">Freshman Exam Bank</p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="px-5 pt-2 pb-4">
        <div className="bg-black/5 p-1 rounded-[16px] flex gap-1">
          <button
            onClick={() => { haptic.selection(); setActiveTab('midterm'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${
              activeTab === 'midterm' ? 'bg-card text-primary shadow-sm' : 'text-tertiary'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Midterm
            {!loading && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'midterm' ? 'bg-primary/10 text-primary' : 'bg-black/10 text-tertiary'}`}>
                {midtermSessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { haptic.selection(); setActiveTab('final'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-200 ${
              activeTab === 'final' ? 'bg-card text-primary shadow-sm' : 'text-tertiary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Final
            {!loading && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'final' ? 'bg-primary/10 text-primary' : 'bg-black/10 text-tertiary'}`}>
                {finalSessions.length}
              </span>
            )}
          </button>
        </div>

        {/* Hint about question count */}
        {!loading && (
          <p className="text-center text-[11px] font-medium text-tertiary mt-2">
            {activeTab === 'midterm'
              ? `${MIDTERM_SIZE} questions per exam · ${midtermCount} total`
              : `${FINAL_SIZE} questions per exam · ${finalCount} total`}
          </p>
        )}
      </div>

      {/* ── SESSION LIST ── */}
      <div className="px-5 animate-fade-in">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[72px] bg-primary/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : currentSessions.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-black/8 rounded-3xl p-10 text-center mt-2">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="font-bold text-primary mb-1">No exams yet</h3>
            <p className="text-sm font-medium text-tertiary leading-relaxed">
              No {activeTab} exams available for this subject yet. Check the other tab!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { haptic.selection(); setSelectedSession(s); }}
                className="w-full group bg-card p-4 rounded-2xl border-2 border-black/5 hover:border-primary/30 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-black text-lg shrink-0 ${
                  activeTab === 'midterm' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                }`}>
                  {s.id}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-black text-primary text-[15px]">{s.label}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-tertiary mt-0.5">
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
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-card w-full max-w-md mx-auto rounded-t-[32px] p-6 shadow-2xl animate-sheet-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-black text-primary mb-1">{selectedSession.label}</h3>
            <p className="text-sm font-medium text-tertiary mb-5">{selectedSession.count} questions · Choose how to take it</p>

            <div className="space-y-3">
              <button
                onClick={() => handleStart(selectedSession, 'practice')}
                className="w-full text-left p-4 rounded-[20px] bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-400 transition-all active:scale-[0.98] flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-base">Practice Mode</h4>
                  <p className="text-xs font-medium text-emerald-800/70 mt-0.5">Instant feedback · learn as you go</p>
                </div>
              </button>

              <button
                onClick={() => handleStart(selectedSession, 'exam')}
                className="w-full text-left p-4 rounded-[20px] bg-rose-50 border-2 border-rose-100 hover:border-rose-400 transition-all active:scale-[0.98] flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-rose-950 text-base">Exam Mode</h4>
                  <p className="text-xs font-medium text-rose-800/70 mt-0.5">Timed · answers hidden until the end</p>
                </div>
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
