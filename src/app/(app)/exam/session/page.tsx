import React from 'react';
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
    .select('id, exam_type, subject, year_ec, question_text, options, correct_answer, explanation, image_url, exam_period')
    .eq('exam_type', examType);

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
  const initialQuestions = (data || []) as Question[];

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
