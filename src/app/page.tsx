'use client';

import React, { useState, useEffect } from 'react';
import { BottomNav, NavTab } from '@/components/navigation/BottomNav';
import { TrackSelector } from '@/components/dashboard/TrackSelector';
import { QuickPracticeView } from '@/components/practice/QuickPracticeView';
import { FlashcardDeck } from '@/components/flashcards/FlashcardDeck';
import { ProfileView } from '@/components/profile/ProfileView';
import { ExamWorkspace } from '@/components/exam/ExamWorkspace';
import { Question } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';

interface ExamSessionConfig {
  examType: string;
  subject: string;
  year?: number;
  isSimulator: boolean;
  questions: Question[];
  title: string;
}

export default function Home() {
  const { setBackButton } = useTelegram();
  const [activeTab, setActiveTab] = useState<NavTab>('tracks');
  const [activeExam, setActiveExam] = useState<ExamSessionConfig | null>(null);

  // Sync Telegram Native Back Button with active exam session
  useEffect(() => {
    if (activeExam) {
      setBackButton(true, () => {
        setActiveExam(null);
      });
    } else {
      setBackButton(false);
    }
  }, [activeExam, setBackButton]);

  // If in active exam / practice session, render full-screen workspace
  if (activeExam) {
    return (
      <ExamWorkspace
        questions={activeExam.questions}
        title={activeExam.title}
        isSimulator={activeExam.isSimulator}
        timeLimitMinutes={activeExam.isSimulator ? 60 : undefined}
        onExit={() => setActiveExam(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Dynamic Tab Views */}
      <div className="flex-1">
        {activeTab === 'tracks' && (
          <TrackSelector onStartExam={(config) => setActiveExam(config)} />
        )}
        {activeTab === 'practice' && (
          <QuickPracticeView onStartExam={(config) => setActiveExam(config)} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardDeck />
        )}
        {activeTab === 'profile' && (
          <ProfileView />
        )}
      </div>

      {/* Global Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </main>
  );
}
