'use client';

import { SkeletonScreen } from "@/components/ui/SkeletonScreen";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
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
}

export const ExamSessionLoader: React.FC<ExamSessionLoaderProps> = ({ 
  examType, sessionSize, sessionOffset, subject, year, mode = 'exam', period
}) => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const dbExamType = examType || 'entrance';
        
        // Generate a unique cache key for this exact session
        // Added v2 prefix to invalidate older cached lists that might contain deleted/bad questions
        const cacheKey = `v2_exam_${dbExamType}_${subject}_${year || 'all'}_${period || 'all'}_${sessionOffset}_${sessionSize}`;
        
        // 1. Try to load from IndexedDB cache first
        const cached = await getCachedQuestions(cacheKey);
        if (cached && cached.length > 0) {
          setQuestions(cached);
          setLoading(false);
          return; // Skip network fetch
        }

        // 2. Fetch from Supabase
        const supabase = createClient();
        
        let query = supabase
          .from('questions')
          .select('*')
          .eq('exam_type', dbExamType);

        if (subject && subject !== 'All') {
          query = query.eq('subject', subject);
        }
        
        if (year) {
          query = query.eq('year_ec', parseInt(year, 10));
        }

        if (period) {
          query = query.eq('exam_period', period);
        }

        const { data, error } = await query.range(sessionOffset, sessionOffset + sessionSize - 1);

        if (error) throw error;
        
        // 3. Save the results to the IndexedDB cache for next time
        if (data && data.length > 0) {
          await setCachedQuestions(cacheKey, data as Question[]);
        }
        
        setQuestions(data as Question[]);
      } catch (err: any) {
        console.error("Failed to load questions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [examType, sessionSize, sessionOffset, subject, year]);

  if (loading) {
    return <SkeletonScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Session</h2>
        <p className="text-sm text-gray-600 mb-6">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-sm active:scale-[0.98] active:opacity-80 transition-all">
          Go Back
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-4">📭</span>
        <h2 className="text-xl font-black text-gray-900">Session Empty</h2>
        <p className="text-sm font-bold text-gray-500 mt-2">No questions available for this session slice.</p>
        <button onClick={() => router.back()} className="mt-8 px-8 h-12 bg-primary text-card rounded-[14px] font-bold shadow-md active:scale-[0.98] active:opacity-80 transition-all">
          Go Back
        </button>
      </div>
    );
  }

  const title = examType === 'freshman' 
    ? `${subject} • Part ${(sessionOffset / sessionSize) + 1}`
    : `${subject} ${year || ''} • Session ${(sessionOffset / sessionSize) + 1}`;

  return (
    <ExamWorkspace
      questions={questions}
      title={title}
      isSimulator={mode === 'exam'} // Dynamically set simulator mode
      timeLimitMinutes={mode === 'exam' ? (examType === 'entrance' && sessionSize === 100 ? 120 : 60) : undefined}
      examType={examType as any}
      subject={subject}
      onExit={() => router.back()}
    />
  );
};
