'use client';

import { SkeletonScreen } from "@/components/ui/SkeletonScreen";
import React, { useEffect, useState } from 'react';
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
      } else if (!serverError) {
        const cached = await getCachedQuestions(cacheKey);
        if (cached && cached.length > 0) {
          setCachedQuestionsState(cached);
        }
        setIsSyncing(false);
      } else {
        setIsSyncing(false);
      }
    };
    syncCache();
  }, [examType, sessionSize, sessionOffset, subject, year, period, initialQuestions, serverError]);

  if (serverError) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Error Loading Session</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{serverError}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-sm active:scale-[0.98] active:opacity-80 transition-all">
          Go Back
        </button>
      </div>
    );
  }

  // If server returned no questions and we are done syncing (meaning cache was also empty)
  if (activeQuestions.length === 0 && !isSyncing) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-4">📭</span>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Session Empty</h2>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">No questions available for this session slice.</p>
        <button onClick={() => router.back()} className="mt-8 px-8 h-12 bg-primary text-card rounded-[14px] font-bold shadow-md active:scale-[0.98] active:opacity-80 transition-all">
          Go Back
        </button>
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
