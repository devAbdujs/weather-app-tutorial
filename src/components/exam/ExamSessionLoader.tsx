'use client';

import { SkeletonScreen } from "@/components/ui/SkeletonScreen";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { ExamWorkspace } from './ExamWorkspace';
import { Question } from '@/types';
import { getCachedQuestions, setCachedQuestions } from '@/lib/cache';
import { useRouter } from 'next/navigation';

interface ExamSessionLoaderProps {
  examType: string;
  sessionSize: number;
  sessionOffset: number;
  subject?: string;
  year?: string;
  mode?: 'practice' | 'exam';
  period?: 'midterm' | 'final';
  initialQuestions: Question[];
  serverError: string | null;
}

export const ExamSessionLoader: React.FC<ExamSessionLoaderProps> = ({ 
  examType, sessionSize, sessionOffset, subject, year, mode = 'exam', period, initialQuestions, serverError
}) => {
  const router = useRouter();
  
  // Remove derived state: use initialQuestions directly
  const [cachedQuestions, setCachedQuestionsState] = useState<Question[] | null>(null);
  
  // Determine final questions: prefer server questions, fallback to cached
  const activeQuestions = initialQuestions.length > 0 ? initialQuestions : (cachedQuestions || []);
  
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const syncCache = async () => {
      const dbExamType = examType || 'entrance';
      const cacheKey = `v2_exam_${dbExamType}_${subject}_${year || 'all'}_${period || 'all'}_${sessionOffset}_${sessionSize}`;
      
      if (initialQuestions.length > 0) {
        // Non-blocking cache update
        setCachedQuestions(cacheKey, initialQuestions).finally(() => setIsSyncing(false));
      } else {
        // Fallback to offline IndexedDB cache even if server query returned empty or had error
        try {
          const cached = await getCachedQuestions(cacheKey);
          if (cached && cached.length > 0) {
            setCachedQuestionsState(cached);
          }
        } catch {
          // Ignore cache read failures
        } finally {
          setIsSyncing(false);
        }
      }
    };
    syncCache();
  }, [examType, sessionSize, sessionOffset, subject, year, period, initialQuestions, serverError]);

  // While syncing cache and we have no initial questions, display skeleton loading state
  if (activeQuestions.length === 0 && isSyncing) {
    return <SkeletonScreen />;
  }

  // If server returned error and cache has no questions
  if (activeQuestions.length === 0 && !isSyncing && serverError) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-error/10 border border-error/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Error Loading Session</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{serverError}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-gray-950 hover:bg-black text-white dark:bg-white dark:text-gray-950 font-black rounded-xl shadow-tactile-xs border border-black/10 dark:border-white/10 active:scale-95 transition-all">
          Go Back
        </button>
      </div>
    );
  }

  // If questions are empty after syncing finishes
  if (activeQuestions.length === 0 && !isSyncing) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-accent-gold/10 text-accent-gold rounded-full flex items-center justify-center mb-4 border border-accent-gold/20">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          No Questions Available Yet
        </h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
          We couldn&apos;t find past exam questions for <strong className="text-gray-900 dark:text-gray-200">{subject || 'All'}</strong> {year ? `(${year} E.C.)` : ''}. Our team is continuously digitizing past papers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link 
            href="/practice"
            className="w-full h-12 rounded-xl bg-gray-950 hover:bg-black text-white dark:bg-white dark:text-gray-950 font-black flex items-center justify-center gap-2 shadow-tactile-xs border border-black/10 dark:border-white/10 active:scale-95 transition-transform text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Pick Another Subject
          </Link>
          <Link 
            href="/dashboard"
            className="w-full h-12 rounded-xl bg-card border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold flex items-center justify-center text-sm active:scale-95 transition-transform"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // We have questions either from server or cache! Immediately render.
  const title = examType === 'freshman' 
    ? `${subject} • Part ${(sessionOffset / sessionSize) + 1}`
    : `${subject} ${year || ''} • Session ${(sessionOffset / sessionSize) + 1}`;

  return (
    <ExamWorkspace
      questions={activeQuestions}
      title={title}
      isSimulator={mode === 'exam'}
      timeLimitMinutes={mode === 'exam' ? (examType === 'entrance' && sessionSize === 100 ? 120 : 60) : undefined}
      examType={examType as any}
      subject={subject}
      onExit={() => router.back()}
    />
  );
};
