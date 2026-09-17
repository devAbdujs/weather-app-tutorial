'use client';

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ExamSessionLoader } from '@/components/exam/ExamSessionLoader';
import { useAppStore } from '@/store/useAppStore';

function ExamPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const subject = decodeURIComponent(params.subject as string);
  const mode = decodeURIComponent(params.mode as string);
  const mix = searchParams.get('mix') || undefined;
  const year = searchParams.get('year') || undefined;
  
  // Securely enforce exam type from profile, not URL
  const userProfile = useAppStore(s => s.userProfile);
  const examType = userProfile?.target_exam || 'entrance'; // fallback

  return <ExamSessionLoader subject={subject} examType={examType} mode={mode} mix={mix} year={year} />;
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ground flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>}>
      <ExamPageContent />
    </Suspense>
  );
}
