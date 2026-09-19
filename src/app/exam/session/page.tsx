'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExamSessionLoader } from '@/components/exam/ExamSessionLoader';

function ExamSessionPageContent() {
  const searchParams = useSearchParams();
  
  // Parse all the new filters from the URL
  const examType = searchParams.get('examType') || 'entrance';
  const sessionSize = parseInt(searchParams.get('sessionSize') || '50', 10);
  const sessionOffset = parseInt(searchParams.get('sessionOffset') || '0', 10);

  const subject = searchParams.get('subject') || 'All';
  const year = searchParams.get('year') || undefined;
  const mode = searchParams.get('mode') || 'exam'; // Default to exam

  return (
    <ExamSessionLoader 
      examType={examType} 
      sessionSize={sessionSize} 
      sessionOffset={sessionOffset}
      subject={subject}
      year={year}
      mode={mode as 'practice' | 'exam'}
    />
  );
}

export default function ExamSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ground flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>}>
      <ExamSessionPageContent />
    </Suspense>
  );
}
