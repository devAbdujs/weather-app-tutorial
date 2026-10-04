'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { TemariMascot } from '@/components/mascot/TemariMascot';
import { sounds } from '@/lib/sounds';

interface ExamResultsViewProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  isPassing: boolean;
  title: string;
  xpEarned?: number;
  onReviewAnswers: () => void;
  onRetakeExam: () => void;
  onExit: () => void;
  haptic?: { impact: (style: 'light' | 'medium' | 'heavy') => void };
}

export const ExamResultsView: React.FC<ExamResultsViewProps> = ({
  score,
  totalQuestions,
  percentage,
  isPassing,
  title,
  xpEarned = 50,
  onReviewAnswers,
  onRetakeExam,
  onExit,
  haptic,
}) => {
  return (
    <div className="min-h-screen bg-ground text-foreground p-5 flex flex-col justify-center items-center max-w-md mx-auto animate-fade-in font-sans">
      <div className="w-full bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-hero p-6 text-center shadow-tactile-md space-y-5">
        
        <div className="flex flex-col items-center">
          <TemariMascot expression={percentage >= 70 ? 'celebrating' : isPassing ? 'happy' : 'studying'} size={110} />
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30 text-xs font-black">
            <Zap className="w-3.5 h-3.5 fill-current" />
            +{xpEarned} XP Earned
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            {percentage >= 75 ? 'Incredible Work!' : isPassing ? 'Session Completed!' : 'Keep Practicing!'}
          </h2>
          <p className="text-xs font-black text-muted-foreground mt-1">{title}</p>
        </div>

        <div className="py-5 px-4 bg-ground rounded-card-sm border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-around">
          <div className="text-center">
            <div className="text-3xl font-black text-foreground tracking-tight tabular-nums">{percentage}%</div>
            <p className="text-caption font-black text-muted-foreground uppercase tracking-wider mt-0.5">Accuracy</p>
          </div>
          <div className="h-10 w-[2px] bg-black/10 dark:bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-black text-accent-emerald tracking-tight tabular-nums">
              {score} <span className="text-base text-muted-foreground font-black">/ {totalQuestions}</span>
            </div>
            <p className="text-caption font-black text-muted-foreground uppercase tracking-wider mt-0.5">Correct</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button 
            onClick={() => {
              sounds.playTap();
              haptic?.impact('medium');
              onReviewAnswers();
            }} 
            className="btn-3d-primary w-full py-3.5 rounded-card-sm font-black text-sm flex items-center justify-center gap-2"
          >
            Review Answers
          </button>
          <button 
            onClick={() => {
              sounds.playTap();
              haptic?.impact('medium');
              onRetakeExam();
            }} 
            className="btn-3d-card w-full py-3.5 rounded-card-sm font-black text-sm text-foreground"
          >
            Retake Exam
          </button>
          <button 
            onClick={() => {
              sounds.playTap();
              onExit();
            }} 
            className="w-full py-2.5 text-xs font-black text-foreground hover:text-foreground transition-colors"
          >
            Exit to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResultsView;
