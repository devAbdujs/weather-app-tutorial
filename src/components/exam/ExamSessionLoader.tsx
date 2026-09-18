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
  university?: string;
  period?: string;
  year?: string;
  department?: string;
  variant?: string;
}

export const ExamSessionLoader: React.FC<ExamSessionLoaderProps> = ({ 
  examType, sessionSize, sessionOffset, subject, university, period, year, department, variant 
}) => {
  const router = useRouter();
  const onExit = () => router.push('/practice');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const dbExamType = examType || 'entrance';
        
        // Generate a unique cache key for this exact session
        const cacheKey = `exam_${dbExamType}_${subject}_${university}_${period}_${year}_${department}_${variant}_${sessionOffset}_${sessionSize}`;
        
        // 1. Try to load instantly from IndexedDB cache
        const cachedData = await getCachedQuestions(cacheKey);
        if (cachedData && cachedData.length > 0) {
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

        // Apply dynamic filters
        if (subject && subject !== 'All') query = query.eq('subject', subject);
        if (year) query = query.eq('year_ec', parseInt(year, 10));
        if (university) query = query.eq('university', university);
        if (period) query = query.eq('exam_period', period);
        if (department) query = query.eq('department', department);
        if (variant) query = query.eq('exam_variant', variant);

        // Fetch exactly the slice we need for this session
        const { data, error } = await query.range(sessionOffset, sessionOffset + sessionSize - 1);

        if (error) throw error;
        
        // 3. Save the results to the IndexedDB cache for next time
        if (data && data.length > 0) {
          await setCachedQuestions(cacheKey, data as Question[]);
        }

        // Randomize questions *within* the session slice as requested
        const shuffled = (data as Question[]).sort(() => 0.5 - Math.random());
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
  }, [examType, subject, university, period, year, department, variant, sessionOffset, sessionSize]);

  if (loading) {
    return <SkeletonScreen message={`Building Session...`} />;
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
        <h2 className="text-xl font-black text-primary">Session Empty</h2>
        <p className="text-sm font-bold text-tertiary mt-2">No questions available for this session slice.</p>
        <button onClick={onExit} className="mt-8 px-6 py-3 bg-primary text-card font-bold rounded-xl focus-ring active:scale-95">Go Back</button>
      </div>
    );
  }

  let title = subject || 'Practice Session';
  if (examType === 'freshman') title = `${university} - ${subject} (${period})`;
  else if (examType === 'entrance') title = `${subject} (${year})`;
  else if (examType === 'exit') title = `${department} - ${variant} (${year})`;

  return (
    <ExamWorkspace
      questions={questions}
      title={title}
      isSimulator={true} // Hardcode simulator mode UI layout
      timeLimitMinutes={examType === 'entrance' ? (sessionSize === 100 ? 120 : 60) : undefined}
      examType={examType as any}
      subject={subject || 'Mixed'}
      onExit={onExit}
    />
  );
};
