'use client';

import { SkeletonScreen } from "@/components/ui/SkeletonScreen";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ExamWorkspace } from './ExamWorkspace';
import { Question } from '@/types';
import { getCachedQuestions, setCachedQuestions } from '@/lib/cache';
import { useRouter } from 'next/navigation';

interface ExamSessionLoaderProps {
  subject: string;
  examType: string; // 'freshman' | 'entrance' | 'exit'
  mode: string;
  mix?: string;
  year?: string;
}

export const ExamSessionLoader: React.FC<ExamSessionLoaderProps> = ({ subject, examType, mode, mix, year }) => {
  const router = useRouter();
  const onExit = () => router.push('/');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const dbExamType = examType || 'entrance';
        
        // Generate a unique cache key for this exact exam configuration
        const cacheKey = `exam_${dbExamType}_${subject}_${mix === 'past_paper' ? year : 'random'}`;
        
        // 1. Try to load instantly from IndexedDB cache
        const cachedData = await getCachedQuestions(cacheKey);
        if (cachedData && cachedData.length > 0) {
          console.log(`[Cache Hit] Loaded ${cachedData.length} questions instantly.`);
          // Shuffle again so they aren't always in the exact same cached order
          setQuestions(cachedData.sort(() => 0.5 - Math.random()));
          setLoading(false);
          return;
        }

        // 2. Cache miss -> Fetch from Supabase
        const supabase = createClient();
        let query = supabase
          .from('questions')
          .select('*')
          .eq('exam_type', dbExamType)
          .not('answer', 'is', null)
          .neq('answer', '');

        if (subject !== 'All' && subject) {
          query = query.ilike('subject', `%${subject}%`);
        }

        let fetchedData;
        let fetchError;

        if (mix === 'past_paper' && year) {
          // Mock Exam Mode: Fetch exact 100 questions for the specific year
          query = query.eq('year_ec', parseInt(year, 10));
          const result = await query.limit(100);
          fetchedData = result.data;
          fetchError = result.error;
        } else {
          // Quick Drill Mode: Random slice of 50 questions
          const randomOffset = Math.floor(Math.random() * 300);
          const result = await query.range(randomOffset, randomOffset + 49);
          fetchedData = result.data;
          fetchError = result.error;

          if (fetchError || !fetchedData || fetchedData.length === 0) {
            // Fallback if offset overshoots
            const fallback = await query.limit(50);
            fetchedData = fallback.data;
            fetchError = fallback.error;
          }
        }

        if (fetchError) throw fetchError;
        
        // 3. Save the results to the IndexedDB cache for next time
        if (fetchedData && fetchedData.length > 0) {
          await setCachedQuestions(cacheKey, fetchedData as Question[]);
        }

        const shuffled = (fetchedData as Question[]).sort(() => 0.5 - Math.random());
        setQuestions(shuffled);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch questions';
        console.error("Error fetching questions:", msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [examType, subject]);

  if (loading) {
    return <SkeletonScreen message={`Building your exam...`} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-black text-primary">Connection Error</h2>
        <p className="text-sm font-bold text-tertiary mt-2">{error}</p>
        <button onClick={onExit} className="mt-8 px-6 py-3 bg-primary text-card font-bold rounded-xl focus-ring active:scale-95">Go Back</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-4">📭</span>
        <h2 className="text-xl font-black text-primary">No questions found</h2>
        <p className="text-sm font-bold text-tertiary mt-2">We couldn&apos;t find any questions for {subject}.</p>
        <button onClick={onExit} className="mt-8 px-6 py-3 bg-primary text-card font-bold rounded-xl focus-ring active:scale-95">Go Back</button>
      </div>
    );
  }

  const title = `${subject} - Full Exam`;

  return (
    <ExamWorkspace
      questions={questions}
      title={title}
      isSimulator={mode === 'simulator'}
      timeLimitMinutes={mode === 'simulator' ? 60 : undefined}
      examType={examType || 'entrance'}
      subject={subject}
      onExit={onExit}
    />
  );
};
