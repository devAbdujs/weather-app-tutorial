import React, { Suspense } from 'react';
import { getSessionCounts, getEntranceYearCounts } from '@/app/actions/practice';
import { SessionsView } from '@/components/practice/SessionsView';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    examType?: string;
    subject?: string;
    year?: string;
  };
}

export default async function PracticeSessionsPage({ searchParams }: PageProps) {
  const examType = searchParams?.examType;
  const subject = searchParams?.subject || '';
  const year = searchParams?.year || '';

  const isFreshman = examType === 'freshman';
  const isEntrance = examType === 'entrance';
  const EUEE_YEARS = [2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

  const base = { examType: examType || undefined, subject: subject || undefined };

  let midtermCount = 0;
  let finalCount = 0;
  let untaggedCount = 0;
  let entranceYears: { year: number; count: number }[] = [];

  if (isFreshman) {
    const total = await getSessionCounts(base);
    const half = Math.floor(total / 2);
    midtermCount = half;
    finalCount = total - half;
    untaggedCount = total;
  } else if (isEntrance) {
    entranceYears = await getEntranceYearCounts({ ...base, years: EUEE_YEARS });
    untaggedCount = entranceYears.reduce((acc, curr) => acc + curr.count, 0);
  } else {
    untaggedCount = await getSessionCounts({ ...base, year: year || undefined });
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-ground animate-pulse" />}>
      <SessionsView
        examType={examType}
        subject={subject}
        year={year}
        initialCounts={{
          midtermCount,
          finalCount,
          untaggedCount,
          entranceYears,
        }}
      />
    </Suspense>
  );
}
