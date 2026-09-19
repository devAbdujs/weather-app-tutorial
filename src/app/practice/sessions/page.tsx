'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { getSessionCounts } from '@/app/actions/practice';
import { Layers, BookOpen, CheckCircle2, ArrowLeft, ChevronLeft } from 'lucide-react';

function SessionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { haptic, setBackButton } = useTelegram();

  const examType = searchParams.get('examType');
  const subject = searchParams.get('subject') || '';
  const year = searchParams.get('year') || '';

  const [loading, setLoading] = useState(true);
  const [availableQuestions, setAvailableQuestions] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<{ id: number, count: number } | null>(null);

  const sessionSize = useMemo(() => {
    if (examType === 'entrance') return 100;
    if (examType === 'exit') return 100;
    return 100; // Default size
  }, [examType]);

  useEffect(() => {
    setBackButton(true, () => router.back());
    return () => setBackButton(false);
  }, [setBackButton, router]);

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      const counts = await getSessionCounts({
        examType: examType || undefined,
        subject: subject || undefined,
        year: year ? parseInt(year, 10) : undefined
      });
      setAvailableQuestions(counts);
      setLoading(false);
    };
    fetchCount();
  }, [examType, subject, year]);

  const sessions = useMemo(() => {
    if (availableQuestions === null) return [];
    if (availableQuestions === 0) return [];
    const fullSessions = Math.floor(availableQuestions / sessionSize);
    const remainder = availableQuestions % sessionSize;
    const list = Array.from({ length: fullSessions }).map((_, i) => ({ id: i + 1, count: sessionSize }));
    if (remainder > 0) list.push({ id: fullSessions + 1, count: remainder });
    
    // If somehow empty but we have questions (e.g. less than sessionSize total)
    if (list.length === 0 && availableQuestions > 0) list.push({ id: 1, count: availableQuestions });
    return list;
  }, [availableQuestions, sessionSize]);

  const handleStartSession = (sessionId: number, count: number, mode: 'practice' | 'exam') => {
    haptic.impact('heavy');
    const params = new URLSearchParams({
      examType: examType || '',
      sessionSize: count.toString(),
      sessionOffset: ((sessionId - 1) * sessionSize).toString(),
      mode: mode,
    });
    
    if (subject) params.set('subject', subject);
    if (year) params.set('year', year);

    router.push(`/exam/session?${params.toString()}`);
  };

  const title = examType === 'entrance' && year ? `${subject} (${year})` : subject;

  return (
    <div className="min-h-screen bg-ground pb-24 text-primary">
      <header className="bg-primary text-card pt-safe pb-6 px-4 rounded-b-[32px] shadow-sm relative overflow-hidden flex flex-col pt-8">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={() => { haptic.selection(); router.back(); }} className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">{title}</h1>
            <p className="text-white/80 font-medium text-xs mt-0.5 capitalize">
              {examType} {examType === 'entrance' ? 'Exams' : 'Sessions'}
            </p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-accent-blue" />
          <h2 className="text-xl font-black text-primary">Question Bank</h2>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-primary/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : availableQuestions === 0 ? (
          <div className="bg-card border-2 border-dashed border-black/10 rounded-3xl p-8 text-center mt-6">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-tertiary" />
            </div>
            <h3 className="font-bold text-primary mb-2">No questions available</h3>
            <p className="text-sm font-medium text-tertiary">
              Content for this selection is coming soon. Please try another subject!
            </p>
            <button onClick={() => router.back()} className="mt-6 px-6 py-2.5 bg-primary/10 text-primary font-bold rounded-xl active:scale-95 transition-transform">
              Go Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { haptic.selection(); setSelectedSession({ id: s.id, count: s.count }); }}
                className="w-full group bg-card p-4 rounded-2xl border-2 border-black/5 hover:border-primary/50 shadow-sm active:scale-[0.98] transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center font-black text-lg text-primary">
                    {s.id}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-primary">
                      {examType === 'entrance' ? `Session ${s.id}` : `Practice Part ${s.id}`}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-tertiary mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {s.count} Questions
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-ground flex items-center justify-center group-hover:bg-primary group-hover:text-card transition-colors">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODE SELECTION MODAL */}
      {selectedSession && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col justify-end p-4 animate-fade-in" onClick={() => setSelectedSession(null)}>
          <div className="bg-card w-full max-w-md mx-auto rounded-[32px] p-6 shadow-2xl animate-scale-bounce" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-6" />
            <h3 className="text-2xl font-black text-primary tracking-tight mb-2">Choose Mode</h3>
            <p className="text-sm font-medium text-tertiary mb-6">How would you like to tackle this session?</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleStartSession(selectedSession.id, selectedSession.count, 'practice')} 
                className="w-full text-left p-4 rounded-[20px] bg-emerald-50 border-2 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-100 transition-all active:scale-[0.98] flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-base mb-0.5">Practice Mode</h4>
                  <p className="text-xs font-medium text-emerald-900/70">Instant feedback, learn as you go</p>
                </div>
              </button>

              <button 
                onClick={() => handleStartSession(selectedSession.id, selectedSession.count, 'exam')} 
                className="w-full text-left p-4 rounded-[20px] bg-rose-50 border-2 border-rose-500/20 hover:border-rose-500 hover:bg-rose-100 transition-all active:scale-[0.98] flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-950 text-base mb-0.5">Exam Mode</h4>
                  <p className="text-xs font-medium text-rose-900/70">Timed, answers hidden until the end</p>
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
