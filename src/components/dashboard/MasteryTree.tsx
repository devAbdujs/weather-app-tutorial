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
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 min-h-screen overflow-y-auto animate-fade-in bg-ground custom-scrollbar" style={{ backgroundImage: 'radial-gradient(circle, #1B3A6B08 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      
      <header className="mb-6 pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6 text-gray-900 dark:text-gray-100" />
            Scholar Tree
          </h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Your exam readiness radar</p>
        </div>
      </header>

      {/* Global Stats Overview */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-card border border-black/5 dark:border-white/10 shadow-sm rounded-[20px] p-5 flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Accuracy</span>
          <span className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">{overallAccuracy}%</span>
        </div>
        <div className="bg-primary shadow-sm rounded-[20px] p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10"><Trophy className="w-24 h-24 text-white" /></div>
          <span className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-2 relative z-10 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-accent-gold"/> Defeated</span>
          <span className="text-4xl font-black text-white relative z-10 tracking-tighter">{totalCorrect}</span>
        </div>
      </div>

      <h2 className="text-[15px] font-black text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider flex items-center gap-2">
        <ArrowUpRight className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Subject Ranks
      </h2>

      {stats.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-black/10 dark:border-white/20 rounded-[24px] p-8 flex flex-col items-center text-center">
          <Brain className="w-12 h-12 text-gray-500 dark:text-gray-400 opacity-30 mb-4" />
          <h3 className="text-[17px] font-black text-gray-900 dark:text-gray-100 mb-1">Tree is Empty</h3>
          <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Take an exam or quick practice to start leveling up your scholar tree!</p>
          <button onClick={() => router.push('/')} className="mt-6 px-6 py-3.5 bg-primary text-white font-black text-sm rounded-[16px] shadow-sm active:translate-y-1 active:shadow-none transition-all">Start Training</button>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => {
            const { level, progress, nextThreshold, isMax } = calculateLevelInfo(stat.questions_correct);
            const accuracy = stat.questions_attempted > 0 ? Math.round((stat.questions_correct / stat.questions_attempted) * 100) : 0;
            
            return (
              <div key={stat.subject} className="bg-card border border-black/5 dark:border-white/10 shadow-sm rounded-[20px] p-5 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="text-[15px] font-black text-gray-900 dark:text-gray-100 leading-tight line-clamp-1">{stat.subject}</h3>
                    <div className="flex gap-2 items-center mt-1.5">
                      <span className="text-[10px] font-black bg-primary/10 text-gray-900 dark:text-gray-100 px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-primary/20">Lvl {level}</span>
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{accuracy}% Win Rate</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter block leading-none">{stat.questions_correct}</span>
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1 block">Correct</span>
                  </div>
                </div>

                {/* Premium Progress Bar */}
                <div className="mt-1 relative z-10">
                  <div className="flex justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                    <span>XP Progress</span>
                    <span>{isMax ? 'MAX LEVEL' : `${stat.questions_correct} / ${nextThreshold}`}</span>
                  </div>
                  <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
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
