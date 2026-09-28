import React, { Suspense } from 'react';
import { PracticeHub } from '@/components/practice/PracticeHub';

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticeHub />
    </Suspense>
  );
}
