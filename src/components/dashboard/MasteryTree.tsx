'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { Target, Trophy, Flame, Brain, ChevronLeft, ArrowUpRight } from 'lucide-react';

interface SubjectStat {
  subject: string;
  questions_attempted: number;
  questions_correct: number;
  total_time_spent_seconds: number;
  last_practiced: string;
}

interface MasteryTreeProps {
  stats: SubjectStat[];
}

const LEVEL_THRESHOLDS = [0, 10, 25, 50, 100]; // 1, 2, 3, 4, 5
const MAX_LEVEL = 5;

function calculateLevelInfo(correct: number) {
  let level = 1;
  let nextThreshold = LEVEL_THRESHOLDS[1];
  let currentThreshold = LEVEL_THRESHOLDS[0];

  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (correct >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      currentThreshold = LEVEL_THRESHOLDS[i];
      nextThreshold = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
    } else {
      break;
    }
  }

  const isMax = level === MAX_LEVEL;
  const progress = isMax ? 100 : Math.max(0, Math.min(100, ((correct - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

  return { level, progress, nextThreshold, currentThreshold, isMax };
}

export const MasteryTree: React.FC<MasteryTreeProps> = ({ stats }) => {
  const router = useRouter();
  const { setBackButton, haptic } = useTelegram();

  useEffect(() => {
    setBackButton(true, () => router.push('/'));
  }, [setBackButton, router]);

  const totalQuestions = stats.reduce((acc, s) => acc + s.questions_attempted, 0);
  const totalCorrect = stats.reduce((acc, s) => acc + s.questions_correct, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 min-h-screen overflow-y-auto animate-fade-in bg-ground custom-scrollbar" style={{ backgroundImage: 'radial-gradient(circle, #00000005 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      
      <header className="mb-6 pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight leading-none mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Scholar Tree
          </h1>
          <p className="text-sm font-bold text-tertiary">Your exam readiness radar</p>
        </div>
      </header>

      {/* Global Stats Overview */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-card border-2 border-primary shadow-brutal-sm rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-black text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1"><Target className="w-3 h-3"/> Accuracy</span>
          <span className="text-3xl font-black text-primary">{overallAccuracy}%</span>
        </div>
        <div className="bg-amber-400 border-2 border-primary shadow-brutal-sm rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-20"><Trophy className="w-20 h-20" /></div>
          <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider mb-2 relative z-10 flex items-center gap-1"><Flame className="w-3 h-3"/> Questions Defeated</span>
          <span className="text-3xl font-black text-primary relative z-10">{totalCorrect}</span>
        </div>
      </div>

      <h2 className="text-lg font-black text-primary mb-4 uppercase tracking-tight flex items-center gap-2">
        <ArrowUpRight className="w-5 h-5 text-tertiary" /> Subject Ranks
      </h2>

      {stats.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-tertiary rounded-xl p-8 flex flex-col items-center text-center">
          <Brain className="w-12 h-12 text-tertiary opacity-50 mb-3" />
          <h3 className="text-base font-black text-secondary mb-1">Tree is Empty</h3>
          <p className="text-sm font-bold text-tertiary">Take an exam or quick practice to start leveling up your scholar tree!</p>
          <button onClick={() => router.push('/')} className="mt-6 px-6 py-3 bg-primary text-card font-black text-sm rounded-xl shadow-brutal-sm active:scale-95 transition-transform">Start Training</button>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => {
            const { level, progress, nextThreshold, currentThreshold, isMax } = calculateLevelInfo(stat.questions_correct);
            const accuracy = stat.questions_attempted > 0 ? Math.round((stat.questions_correct / stat.questions_attempted) * 100) : 0;
            
            return (
              <div key={stat.subject} className="bg-card border-2 border-primary shadow-brutal-sm rounded-xl p-4 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-black text-primary uppercase tracking-tight line-clamp-1">{stat.subject}</h3>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] font-black bg-primary text-card px-2 py-0.5 rounded-full uppercase">Lvl {level}</span>
                      <span className="text-[11px] font-bold text-secondary">{accuracy}% Win Rate</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-primary block leading-none">{stat.questions_correct}</span>
                    <span className="text-[9px] font-black text-tertiary uppercase tracking-wider">Correct</span>
                  </div>
                </div>

                {/* Neo-Brutalist Arcade Progress Bar */}
                <div className="mt-2 relative">
                  <div className="flex justify-between text-[10px] font-black text-tertiary uppercase tracking-wider mb-1">
                    <span>Exp</span>
                    <span>{isMax ? 'MAX' : `${stat.questions_correct}/${nextThreshold}`}</span>
                  </div>
                  <div className="h-4 w-full bg-black/5 border-2 border-primary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-400 border-r-2 border-primary transition-all duration-1000 ease-out relative"
                      style={{ width: `${progress}%` }}
                    >
                      {/* Shine effect inside the bar */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
