'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { safeLocalStorage } from '@/lib/safeStorage';
import { BookOpen, ChevronLeft, CheckCircle2, ArrowRight, Layers, Clock } from 'lucide-react';

const MIDTERM_SIZE = 25;
const FINAL_SIZE = 50;

type SessionTab = 'midterm' | 'final';

export interface SessionItem {
  id: number;
  count: number;
  offset: number;
  label: string;
  year?: number;
}

interface SessionsViewProps {
  examType?: string;
  subject?: string;
  year?: string;
  initialCounts: {
    midtermCount: number;
    finalCount: number;
    untaggedCount: number;
    entranceYears: { year: number; count: number }[];
  };
}

export function SessionsView({
  examType,
  subject = '',
  year = '',
  initialCounts,
}: SessionsViewProps) {
  const router = useRouter();
  const { haptic, setBackButton } = useTelegram();

  const [activeTab, setActiveTab] = useState<SessionTab>('midterm');
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  React.useEffect(() => {
    setBackButton(true, () => router.back());
    return () => setBackButton(false);
  }, [setBackButton, router]);

  const isFreshman = examType === 'freshman';
  const isEntrance = examType === 'entrance';
  const STANDARD_SIZE = 50;

  const { midtermCount, finalCount, untaggedCount, entranceYears } = initialCounts;

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
    if (rem >= 10) {
      list.push({
        id: full + 1,
        count: rem,
        offset: full * MIDTERM_SIZE,
        label: `Midterm Exam ${full + 1}`,
      });
    }
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
      if (rem >= 10) {
        list.push({
          id: full + 1,
          count: rem,
          offset: finalBaseOffset + (full * FINAL_SIZE),
          label: `Final Exam ${full + 1}`,
        });
      }
      return list;
    } else if (isEntrance) {
      return entranceYears.map((yc) => ({
        id: yc.year,
        count: yc.count,
        offset: 0,
        label: `${yc.year} E.C. Exam`,
        year: yc.year,
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
      if (rem >= 10) {
        list.push({
          id: full + 1,
          count: rem,
          offset: full * STANDARD_SIZE,
          label: `Practice Set ${full + 1}`,
        });
      }
      return list;
    }
  }, [finalCount, untaggedCount, midtermCount, isFreshman, isEntrance, entranceYears]);

  const displayedSessions = isFreshman ? (activeTab === 'midterm' ? midtermSessions : finalSessions) : finalSessions;

  const handleStart = (session: SessionItem, mode: 'practice' | 'exam') => {
    haptic.impact('heavy');
    try {
      safeLocalStorage.setItem('temari_last_session', JSON.stringify({
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

    router.push(`/exam/session?${params.toString()}`);
  };

  const title = subject;
  const subtitle = isFreshman ? 'Freshman Exam Bank' : isEntrance ? 'Grade 12 Entrance' : 'University Exit Exam';

  return (
    <div className="min-h-screen bg-ground pb-28 text-foreground animate-fade-in">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10 bg-ground/90 dark:bg-ground/95 backdrop-blur-xl border-b border-black/5 dark:border-white/8 px-5 pt-safe pt-5 pb-3 mb-4 flex items-center gap-3">
        <button
          onClick={() => { haptic.selection(); router.back(); }}
          className="w-10 h-10 flex items-center justify-center rounded-btn bg-card border border-black/5 dark:border-white/8 text-muted-foreground hover:text-foreground active:scale-[0.98] active:opacity-80 transition-all shadow-sm shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-display-md font-black text-foreground tracking-tight leading-tight truncate">{title}</h1>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* ── TABS ── */}
      {isFreshman && (
        <div className="px-5 pt-2 pb-4">
          <div className="bg-black/5 dark:bg-white/5 p-1 rounded-card-sm flex gap-1">
            <button
              onClick={() => { haptic.selection(); setActiveTab('midterm'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-control text-sm font-bold transition-all duration-200 ${
                activeTab === 'midterm' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Midterm
              <span className={`text-micro px-1.5 py-0.5 rounded-full font-black ${activeTab === 'midterm' ? 'bg-primary/10 text-foreground' : 'bg-black/10 dark:bg-white/10 text-muted-foreground'}`}>
                {midtermSessions.length}
              </span>
            </button>
            <button
              onClick={() => { haptic.selection(); setActiveTab('final'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-control text-sm font-bold transition-all duration-200 ${
                activeTab === 'final' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Final
              <span className={`text-micro px-1.5 py-0.5 rounded-full font-black ${activeTab === 'final' ? 'bg-primary/10 text-foreground' : 'bg-black/10 dark:bg-white/10 text-muted-foreground'}`}>
                {finalSessions.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Hint about question count */}
      <p className="text-center text-caption font-medium text-muted-foreground mt-2">
        {isFreshman 
          ? (activeTab === 'midterm' 
            ? `${MIDTERM_SIZE} questions per exam · ${midtermCount} total`
            : `${FINAL_SIZE} questions per exam · ${finalCount} total`)
          : `${STANDARD_SIZE} questions per exam · ${untaggedCount} total`}
      </p>

      {/* ── SESSION LIST ── */}
      <div className="px-5 animate-fade-in mt-3">
        {displayedSessions.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-black/8 dark:border-white/10 rounded-3xl p-10 text-center mt-2">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="font-bold text-foreground mb-1">No exams yet</h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              No exams available for this subject yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { haptic.selection(); setSelectedSession(s); }}
                className="w-full group bg-card p-4 rounded-card-lg border border-black/[0.08] dark:border-white/[0.08] border-b-bevel border-b-black/[0.14] dark:border-b-white/[0.14] shadow-tactile-xs hover:border-primary/40 active:translate-y-[1px] transition-all flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-btn flex items-center justify-center font-black text-base shrink-0 shadow-tactile-xs border ${
                  isFreshman && activeTab === 'midterm' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent-purple/10 text-accent-purple border-accent-purple/20'
                }`}>
                  {s.id}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-black text-foreground text-regular">{s.label}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                    <span>{s.count} questions</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-panel border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shrink-0">
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
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
            className="bg-card w-full max-w-sm rounded-modal shadow-tactile-lg animate-scale-bounce overflow-hidden border border-black/[0.08] dark:border-white/[0.10]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-caption font-black text-muted-foreground uppercase tracking-widest block mb-1">
                {selectedSession.count} Questions • Choose Mode
              </span>
              <h3 className="text-2xl font-black text-foreground tracking-tight">{selectedSession.label}</h3>
            </div>

            {/* Mode options */}
            <div className="p-4 space-y-3">
              {/* Practice */}
              <button
                onClick={() => handleStart(selectedSession, 'practice')}
                className="w-full group text-left p-4 rounded-card-lg bg-card border-2 border-accent-emerald/40 dark:border-accent-emerald/30 border-b-bevel-lg border-b-accent-emerald/60 hover:border-accent-emerald active:translate-y-[2px] transition-all flex items-center gap-4 shadow-tactile-xs"
              >
                <div className="w-12 h-12 rounded-card-sm bg-accent-emerald text-white flex items-center justify-center shrink-0 shadow-tactile-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="font-black text-foreground text-base leading-tight">Practice Mode</h4>
                    <span className="text-micro font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/25">Untimed</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">Instant answer reveal &amp; AI explanations</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent-emerald/15 text-accent-emerald flex items-center justify-center shrink-0 group-hover:bg-accent-emerald group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Exam */}
              <button
                onClick={() => handleStart(selectedSession, 'exam')}
                className="w-full group text-left p-4 rounded-card-lg bg-card border-2 border-primary/40 dark:border-primary/30 border-b-bevel-lg border-b-primary/60 hover:border-primary active:translate-y-[2px] transition-all flex items-center gap-4 shadow-tactile-xs"
              >
                <div className="w-12 h-12 rounded-card-sm bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-tactile-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="font-black text-foreground text-base leading-tight">Exam Simulator</h4>
                    <span className="text-micro font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-foreground border border-black/10 dark:border-white/10">Timed</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">Timed countdown &amp; score at the end</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-tactile-xs">
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            </div>

            {/* Cancel */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-3.5 rounded-card-sm bg-black/5 dark:bg-white/5 hover:bg-black/8 text-sm font-bold text-muted-foreground active:scale-[0.98] transition-all"
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
