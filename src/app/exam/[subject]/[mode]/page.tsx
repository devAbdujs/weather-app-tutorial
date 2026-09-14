'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ExamSessionLoader } from '@/components/exam/ExamSessionLoader';
import { useAppStore } from '@/store/useAppStore';

export default function ExamPage() {
  const params = useParams();
  const subject = decodeURIComponent(params.subject as string);
  const mode = decodeURIComponent(params.mode as string);
  
  // Securely enforce exam type from profile, not URL
  const userProfile = useAppStore(s => s.userProfile);
  const examType = userProfile?.target_exam || 'entrance'; // fallback

  return <ExamSessionLoader subject={subject} examType={examType} mode={mode} />;
}
