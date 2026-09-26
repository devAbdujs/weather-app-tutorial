import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { ExamSessionLoader } from '@/components/exam/ExamSessionLoader';
import { createClient } from '@/utils/supabase/server';
import { Question } from '@/types';

interface PageProps {
  searchParams: {
    examType?: string;
    sessionSize?: string;
    sessionOffset?: string;
    subject?: string;
    year?: string;
    mode?: string;
    period?: string;
  };
}

export default async function ExamSessionPage({ searchParams }: PageProps) {
  const examType = searchParams.examType || 'entrance';
  const sessionSize = parseInt(searchParams.sessionSize || '50', 10);
  const sessionOffset = parseInt(searchParams.sessionOffset || '0', 10);

  const subject = searchParams.subject || 'All';
  const year = searchParams.year || undefined;
  const mode = searchParams.mode || 'exam';
  const period = searchParams.period || undefined; // 'midterm' | 'final'

  // Fetch data on the Server to eliminate client-side waterfall
  const supabase = await createClient();
  
  // Only select the columns needed for the exam to reduce payload size
  let query = supabase
    .from('questions')
    .select('id, exam_type, subject, year_ec, question, option_a, option_b, option_c, option_d, answer, explanation, image_url')
    .eq('exam_type', examType);

  if (subject && subject !== 'All') {
    query = query.eq('subject', subject);
  }
  
  if (year) {
    query = query.eq('year_ec', parseInt(year, 10));
  }

  const { data, error } = await query.range(sessionOffset, sessionOffset + sessionSize - 1);
  const initialQuestions = (data || []) as Question[];

  if (initialQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          No Questions Available Yet
        </h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
          We couldn&apos;t find past exam questions for <strong className="text-gray-900 dark:text-gray-200">{subject}</strong> {year ? `(${year} E.C.)` : ''}. Our team is continuously digitizing past papers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link 
            href="/practice"
            className="w-full h-12 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform text-sm"
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

  return (
    <ExamSessionLoader 
      examType={examType} 
      sessionSize={sessionSize} 
      sessionOffset={sessionOffset}
      subject={subject}
      year={year}
      mode={mode as 'practice' | 'exam'}
      period={period as 'midterm' | 'final' | undefined}
      initialQuestions={initialQuestions}
      serverError={error?.message || null}
    />
  );
}
