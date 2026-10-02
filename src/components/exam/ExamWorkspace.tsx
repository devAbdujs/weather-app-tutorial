/* eslint-disable @next/next/no-img-element */
'use client';

import { toast } from "sonner";
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Flag, Grid, Sparkles, CheckCircle2, XCircle, Bookmark, Award, X, Lock, Lightbulb, Clock, Maximize2, Zap, Bot, Check, Compass } from 'lucide-react';
import { Question } from '@/types';
import Image from 'next/image';
import { MathText } from '@/components/MathText';
import { AIResponse } from '@/components/AIResponse';
import dynamic from 'next/dynamic';
import { ExamTimer } from './ExamTimer';
import { useTelegram } from '@/hooks/useTelegram';
import { sounds } from '@/lib/sounds';
import { useGamificationStore } from '@/store/useGamificationStore';
import { TemariMascot } from '@/components/mascot/TemariMascot';

const AITutorDrawer = dynamic(() => import('@/components/ai/AITutorDrawer').then(m => m.AITutorDrawer), { ssr: false });
import { toggleSavedMistake, updateDailyStreak, getSavedMistakes } from '@/app/actions/user';
import { getOptimizedImageUrl } from '@/utils/cloudinary';

const getImageUrl = (imageFilename: string) => {
  if (!imageFilename) return '';
  if (imageFilename.startsWith('http')) return imageFilename;
  const baseName = imageFilename.split('/').pop()?.replace(/\.[^/.]+$/, "");
  if (!baseName) return '';
  
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    return imageFilename.startsWith('/') ? imageFilename : `/assets/question_images/${imageFilename}`;
  }
  return getOptimizedImageUrl(`question_images/${baseName}`);
};

interface ExamWorkspaceProps {
  questions: Question[];
  title: string;
  isSimulator?: boolean;
  timeLimitMinutes?: number;
  onExit: () => void;
  examType?: string;
  subject?: string;
}

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({ questions, title, isSimulator = false, timeLimitMinutes = 60, onExit, subject = 'unknown' }) => {
  const { user, haptic, setFullscreen, setVerticalSwipes, setClosingConfirmation } = useTelegram();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());
  const [showGrid, setShowGrid] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const startTimeRef = React.useRef(Date.now());
  const mainRef = React.useRef<HTMLDivElement>(null);

  // Native Immersion: Protect the exam session
  useEffect(() => {
    setFullscreen?.(true);
    setVerticalSwipes?.(false);
    setClosingConfirmation?.(true);
    return () => {
      setFullscreen?.(false);
      setVerticalSwipes?.(true);
      setClosingConfirmation?.(false);
    };
  }, [setFullscreen, setVerticalSwipes, setClosingConfirmation]);

  // Auto-scroll to top when question changes
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    setShowExplanation(false);
  }, [currentIndex]);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const questionIds = await getSavedMistakes();
        if (questionIds && questionIds.length > 0) {
          setSavedQuestions(new Set(questionIds));
        }
      } catch (err) {
        console.error("Error loading bookmarks from Supabase:", err);
      }
    };
    loadBookmarks();
  }, []);

  const handleSelectOption = (letter: 'A' | 'B' | 'C' | 'D') => {
    const wasAlreadyAnswered = selectedAnswers[currentIndex] !== undefined;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: letter }));
    
    const normalizedAns = currentQ?.answer ? currentQ.answer.trim().toUpperCase() : null;
    
    if (!isSimulator) {
      if (!normalizedAns) {
        sounds.playTap();
        haptic.selection();
      } else if (letter === normalizedAns) {
        sounds.playCorrect();
        haptic.notification('success');
        if (!wasAlreadyAnswered) {
          useGamificationStore.getState().addXp(10, 'Correct Answer');
        }
      } else {
        sounds.playWrong();
        haptic.notification('error');
      }
    } else {
      sounds.playTap();
      haptic.selection();
    }
  };

  const toggleBookmark = async () => {
    if (!currentQ) return;
    haptic.impact('light');
    const qId = currentQ.id || `${subject}-${currentQ.question.substring(0, 20)}`;
    const isSaved = savedQuestions.has(qId);
    

    // Optimistic UI update
    setSavedQuestions(prev => {
      const n = new Set(prev);
      if (isSaved) n.delete(qId);
      else n.add(qId);
      return n;
    });

    try {
      await toggleSavedMistake(qId, isSaved);
    } catch (err) {
      console.error("Error toggling bookmark in Supabase:", err);
    }
  };

  const handleFinish = useCallback(async () => {
    setIsFinished(true);
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setTimeSpentSeconds(elapsed);

    // Calculate accuracy and correct count
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const norm = q.answer ? q.answer.trim().toUpperCase() : null;
      if (norm && selectedAnswers[idx] === norm) correctCount++;
    });
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    // Gamification: Award 50 XP and trigger celebration modal!
    useGamificationStore.getState().addXp(50, 'Completed Exam Session');
    useGamificationStore.getState().triggerCelebration({
      type: 'quiz_completed',
      title: percentage >= 75 ? 'Outstanding Performance!' : percentage >= 50 ? 'Great Practice Session!' : 'Keep Going, Gobeze!',
      subtitle: percentage >= 75 ? `You scored ${percentage}%! Outstanding work on ${title}.` : `You scored ${percentage}%. Review your mistakes to master every topic.`,
      xpEarned: 50,
      accuracy: percentage,
      mascotMood: percentage >= 70 ? 'celebrating' : 'happy',
    });

    if (!hasRecordedCompletion) {
      setHasRecordedCompletion(true);
      try {
        await updateDailyStreak();

        try {
          const res = await fetch('/api/exam/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject,
              attempted: questions.length,
              correct: correctCount,
              timeSpentSeconds: elapsed
            })
          });
          if (!res.ok) throw new Error('Network response was not ok');
        } catch (submitErr) {
          console.warn('Offline or server error, saving submission locally:', submitErr);
          const { saveOfflineSubmission } = await import('@/utils/offlineSync');
          await saveOfflineSubmission({
            subject,
            attempted: questions.length,
            correct: correctCount,
            timeSpentSeconds: elapsed
          });
          toast.info("You're offline! Your exam score was saved locally and will sync when you reconnect.");
        }

      } catch (err) {
        console.error("Error saving exam stats:", err);
      }
    }
  }, [hasRecordedCompletion, questions, selectedAnswers, subject, title]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchStart.x - touchEndX;
    const deltaY = touchStart.y - touchEndY;
    
    // Require a clear horizontal swipe (min 60px) and ignore if it was mostly a vertical scroll
    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50) {
      if (deltaX > 0 && currentIndex < questions.length - 1) {
        haptic.selection();
        setCurrentIndex(prev => prev + 1); // Swipe left -> Next
      } else if (deltaX < 0 && currentIndex > 0) {
        haptic.selection();
        setCurrentIndex(prev => prev - 1); // Swipe right -> Prev
      }
    }
    setTouchStart(null);
  };

  if (isFinished) {
    let score = 0;
    questions.forEach((q, idx) => {
      const norm = q.answer ? q.answer.trim().toUpperCase() : null;
      if (norm && selectedAnswers[idx] === norm) score++;
    });
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const isPassing = percentage >= 50;

    return (
      <div className="min-h-screen bg-ground text-gray-900 dark:text-gray-100 p-5 flex flex-col justify-center items-center max-w-md mx-auto animate-fade-in font-sans">
        <div className="w-full bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-hero p-6 text-center shadow-tactile-md space-y-5">
          
          <div className="flex flex-col items-center">
            <TemariMascot expression={percentage >= 70 ? 'celebrating' : isPassing ? 'happy' : 'studying'} size={110} />
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30 text-xs font-black">
              <Zap className="w-3.5 h-3.5 fill-current" />
              +50 XP Earned
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100">
              {percentage >= 75 ? 'Incredible Work!' : isPassing ? 'Session Completed!' : 'Keep Practicing!'}
            </h2>
            <p className="text-xs font-black text-gray-700 dark:text-gray-300 mt-1">{title}</p>
          </div>

          <div className="py-5 px-4 bg-ground rounded-card-sm border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-around">
            <div className="text-center">
              <div className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">{percentage}%</div>
              <p className="text-caption font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mt-0.5">Accuracy</p>
            </div>
            <div className="h-10 w-[2px] bg-black/10 dark:bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-black text-accent-emerald tracking-tight tabular-nums">{score} <span className="text-base text-gray-700 dark:text-gray-300 font-black">/ {questions.length}</span></div>
              <p className="text-caption font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mt-0.5">Correct</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              onClick={() => { sounds.playTap(); haptic.impact('medium'); setIsFinished(false); setIsReviewMode(true); setCurrentIndex(0); }} 
              className="btn-3d-primary w-full py-3.5 rounded-card-sm font-black text-sm flex items-center justify-center gap-2"
            >
              Review Answers
            </button>
            <button 
              onClick={() => { sounds.playTap(); haptic.impact('medium'); setIsFinished(false); setIsReviewMode(false); setCurrentIndex(0); setSelectedAnswers({}); setFlagged(new Set()); startTimeRef.current = Date.now(); setHasRecordedCompletion(false); }} 
              className="btn-3d-card w-full py-3.5 rounded-card-sm font-black text-sm text-gray-900 dark:text-gray-100"
            >
              Retake Exam
            </button>
            <button 
              onClick={() => { sounds.playTap(); onExit(); }} 
              className="w-full py-2.5 text-xs font-black text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white transition-colors"
            >
              Exit to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chosenAnswer = selectedAnswers[currentIndex];
  const isAnswered = chosenAnswer !== undefined;
  const qId = currentQ?.id || `${subject}-${currentQ?.question.substring(0, 20)}`;
  const isSaved = savedQuestions.has(qId);
  
  // Anti-cheat AI Logic
  const canUseAI = isSimulator ? isReviewMode : isAnswered;

  return (
    <div className="min-h-screen bg-ground text-gray-900 dark:text-gray-100 flex flex-col justify-between max-w-md mx-auto pb-24 font-sans select-none relative">
      <header className="sticky top-0 z-30 bg-ground/90 backdrop-blur-xl pt-safe border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
        <div className="px-5 pt-3 pb-2 flex justify-between items-center mb-1">
          <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-btn bg-card border border-black/[0.08] dark:border-white/[0.08] text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white active:scale-[0.98] transition-transform shadow-tactile-xs"><X className="w-5 h-5" /></button>
          <div className="flex flex-col items-center">
            <span className="text-micro uppercase tracking-widest font-black text-gray-700 dark:text-gray-300">{title}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
               {isSimulator && !isReviewMode ? (
                  <ExamTimer 
                    initialSeconds={timeLimitMinutes! * 60} 
                    isPaused={isFinished || isReviewMode} 
                    onTimeUp={() => {
                      haptic.notification('warning');
                      handleFinish();
                    }} 
                  />
               ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-primary px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Compass className="w-3.5 h-3.5" /> Practice Mode
                  </span>
               )}
            </div>
          </div>
          <button onClick={() => {
            haptic.selection();
            setFlagged((prev) => {
              const next = new Set(prev);
              if (next.has(currentIndex)) next.delete(currentIndex);
              else next.add(currentIndex);
              return next;
            });
          }} className={`w-10 h-10 flex items-center justify-center rounded-btn border transition-all active:scale-[0.98] shadow-tactile-xs ${flagged.has(currentIndex) ? 'bg-error/10 border-error/30 text-error' : 'bg-card border-black/[0.08] dark:border-white/[0.08] text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white'}`}><Flag className="w-4 h-4" fill={flagged.has(currentIndex) ? 'currentColor' : 'none'} /></button>
        </div>
        
        {/* Chunky Duolingo Progress Bar */}
        <div className="px-5">
          <div className="h-3 w-full bg-black/[0.08] dark:bg-white/[0.08] rounded-full p-0.5 border border-black/[0.08] overflow-hidden shadow-inner">
             <div 
               className="h-full bg-gradient-to-r from-primary to-accent-blue transition-all duration-300 ease-out rounded-full relative overflow-hidden" 
               style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
             >
               <div className="absolute inset-0 bg-white/25 h-1 rounded-full top-0" />
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-5 space-y-5 relative">
        <div className="bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel border-b-black/[0.14] dark:border-b-white/[0.14] rounded-card-lg p-5 md:p-6 shadow-tactile-xs relative mb-2">
          <button onClick={toggleBookmark} className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-[0.98] shadow-2xs ${isSaved ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40' : 'bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'}`}><Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} /></button>
          
          <div className="pr-8 text-base md:text-lg leading-relaxed font-bold text-gray-900 dark:text-gray-100 relative whitespace-pre-wrap">
            <MathText content={currentQ.question} />
          </div>

          {currentQ.image_url && (
            <button onClick={() => { haptic.selection(); setZoomImage(currentQ.image_url || null); }} className="w-full mt-4 rounded-card-sm border border-black/5 dark:border-white/10 overflow-hidden bg-white dark:bg-card relative group active:scale-[0.98] transition-transform block focus-ring">
              <Image priority={currentIndex === 0} width={800} height={400} src={getImageUrl(currentQ.image_url)} alt="Question diagram" className="w-full h-auto max-h-64 object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center">
                <Maximize2 className="w-6 h-6 text-black/50 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
              </div>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map((letter, index) => {
            const optKey = `option_${letter.toLowerCase()}` as keyof Question;
            const opt = currentQ[optKey] as string;
            if (!opt) return null;
            
            const normalizedAns = currentQ.answer?.trim().toUpperCase() || '';
            const isSelected = selectedAnswers[currentIndex] === letter;
            
            const isRevealed = (!isSimulator || isReviewMode) && (isAnswered || isReviewMode);
            const isCorrect = isRevealed && normalizedAns ? letter === normalizedAns : false;
            const isWrongSelected = isRevealed && isSelected && normalizedAns ? letter !== normalizedAns : false;

            let cls = 'bg-card border-2 border-black/[0.08] dark:border-white/[0.08] border-b-[4px] border-b-black/[0.14] dark:border-b-white/[0.16] text-gray-800 dark:text-gray-200 hover:border-primary/50 active:translate-y-[2px] transition-all shadow-tactile-xs';
            
            if (isSelected) cls = 'bg-orange-500/10 dark:bg-orange-950/30 border-2 border-primary border-b-[4px] border-b-orange-600 text-gray-900 dark:text-gray-100 font-bold active:translate-y-[2px] shadow-tactile-xs';
            
            if (isRevealed) {
              if (isCorrect) {
                cls = 'bg-tint-green text-tint-green-fg border-2 border-emerald-500 border-b-[4px] border-b-emerald-700 font-black shadow-tactile-xs';
              } else if (isWrongSelected) {
                cls = 'bg-tint-rose text-tint-rose-fg border-2 border-rose-500 border-b-[4px] border-b-rose-700 font-black shadow-tactile-xs';
              } else if (isSelected && !normalizedAns) {
                cls = 'bg-orange-500/10 border-2 border-primary border-b-[4px] border-b-primary text-gray-900 dark:text-gray-100 shadow-tactile-xs font-bold';
              } else {
                cls = 'bg-card/40 border border-black/[0.04] dark:border-white/[0.04] text-gray-400 dark:text-gray-500 opacity-40';
              }
            }

            return (
              <button
                key={letter}
                onClick={() => {
                  if (!isReviewMode && (isSimulator || !isAnswered)) {
                    sounds.playTap();
                    handleSelectOption(letter as any);
                  }
                }}
                disabled={isReviewMode || (!isSimulator && isAnswered)}
                className={`w-full flex items-center justify-between gap-3.5 p-4 rounded-2xl transition-all duration-150 text-left ${cls}`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black transition-colors duration-150 shadow-2xs ${
                    isRevealed && isCorrect 
                      ? 'bg-emerald-600 text-white' 
                      : isRevealed && isWrongSelected 
                      ? 'bg-rose-600 text-white' 
                      : isSelected 
                      ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950 shadow-tactile-xs font-black' 
                      : 'bg-[#F3F0EA] dark:bg-white/[0.08] text-gray-800 dark:text-gray-200'
                  }`}>
                    {letter}
                  </div>
                  <span className="text-sm leading-relaxed flex-1 font-semibold whitespace-pre-wrap self-center"><MathText content={opt} /></span>
                </div>

                {isRevealed && isCorrect && (
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    <span className="text-micro font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">+10 XP</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}

                {isRevealed && isWrongSelected && (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {(!isSimulator || isReviewMode) && (isAnswered || isReviewMode) && (
          <div className="pt-2 pb-4 animate-fade-up">
            <div className="bg-tint-cream text-tint-cream-fg border-2 border-tint-cream-border rounded-3xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-start gap-3 mb-3">
                {currentQ?.answer?.trim() ? (
                  <>
                    <div className="bg-white dark:bg-black/30 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl p-2 shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-micro font-black uppercase tracking-widest block text-emerald-950 dark:text-emerald-200 mb-0.5">Verified Correct Answer Key</span>
                      <p className="text-lg font-black text-gray-950 dark:text-white">{currentQ.answer.trim().toUpperCase()}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white dark:bg-black/30 text-primary border border-orange-300 dark:border-orange-700/50 rounded-2xl p-2 shrink-0 shadow-2xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-micro font-black uppercase tracking-widest block text-orange-950 dark:text-orange-200 mb-0.5">No Key Provided</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Tap <strong className="text-primary font-black">Ask AI</strong> below for step-by-step guidance.</p>
                    </div>
                  </>
                )}
              </div>

              {currentQ.explanation ? (
                <div className="mt-3 border-t border-tint-cream-border pt-3">
                  <span className="text-micro font-black uppercase tracking-widest block text-tint-cream-fg mb-1.5">Official Explanation</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                    <MathText content={currentQ.explanation} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-ground/95 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.08] p-3.5 z-30 flex justify-between items-center pb-safe shadow-tactile-md">
        <button 
          onClick={() => { 
            if (canUseAI) {
              sounds.playTap();
              haptic.impact('light'); 
              setShowAI(true); 
            } else {
              sounds.playWrong();
              haptic.notification('error');
            }
          }} 
          className={`h-12 px-3.5 rounded-2xl border-2 border-b-[3px] font-black text-xs flex items-center gap-2 transition-all active:translate-y-[2px] shadow-tactile-xs ${
            canUseAI 
              ? 'bg-tint-peach text-tint-peach-fg border-tint-peach-border hover:brightness-105' 
              : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-black/[0.06] dark:border-white/[0.08] opacity-60'
          }`}
          title="Ask Temari AI Tutor"
        >
          {canUseAI ? (
            <>
              <Bot className="w-5 h-5 text-primary stroke-[2.5]" />
              <span className="font-black text-xs text-primary">AI</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="font-bold text-xs text-gray-600 dark:text-gray-400">AI</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {currentIndex > 0 && (
            <button 
              onClick={() => { sounds.playTap(); haptic.selection(); setCurrentIndex(prev => prev - 1); }} 
              className="w-12 h-12 rounded-2xl bg-card border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-gray-900 dark:text-gray-100 active:translate-y-[2px] hover:border-black/20 dark:hover:border-white/20 transition-all shadow-tactile-xs"
              title="Previous question"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]"/>
            </button>
          )}
          <button 
            onClick={() => { sounds.playTap(); haptic.selection(); setShowGrid(true); }} 
            className="w-12 h-12 rounded-2xl bg-card border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-gray-900 dark:text-gray-100 active:translate-y-[2px] hover:border-black/20 dark:hover:border-white/20 transition-all shadow-tactile-xs"
            title="Question overview grid"
          >
            <Grid className="w-5 h-5 stroke-[2.5]"/>
          </button>
          {currentIndex < questions.length - 1 ? (
            <button 
              onClick={() => { sounds.playTap(); haptic.selection(); setCurrentIndex(prev => prev + 1); }} 
              className="btn-3d-primary h-12 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 shadow-tactile-xs"
              title="Next question"
            >
              <span className="text-xs font-black uppercase tracking-wider">Next</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]"/>
            </button>
          ) : (
            <button 
              onClick={isReviewMode ? () => { sounds.playTap(); setIsFinished(true); } : handleFinish} 
              className="h-12 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-b-[4px] border-emerald-800 active:translate-y-[2px] shadow-tactile-xs transition-all"
              title="Submit exam"
            >
              <Check className="w-5 h-5 stroke-[3]"/>
              <span className="text-xs font-black uppercase tracking-wider">{isReviewMode ? 'Finish' : 'Submit'}</span>
            </button>
          )}
        </div>
      </footer>

      {showGrid && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in" onClick={() => setShowGrid(false)}>
          <div className="w-full max-w-sm bg-card rounded-modal p-6 shadow-tactile-lg animate-scale-bounce" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-black/5 dark:border-white/10">
              <h3 className="font-bold tracking-tight text-xl text-gray-900 dark:text-gray-100">Question Grid</h3>
              <button onClick={() => setShowGrid(false)} className="w-10 h-10 flex justify-center items-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-900 dark:text-gray-100 active:scale-[0.98] active:opacity-80 transition-all"><X className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pb-2 pt-2">
              {questions.map((_, i) => {
                const qIdLoop = questions[i]?.id || `${subject}-${questions[i]?.question.substring(0, 20)}`;
                const isBkmrk = savedQuestions.has(qIdLoop);
                const isFlg = flagged.has(i);
                
                return (
                  <button key={i} onClick={() => { setCurrentIndex(i); setShowGrid(false); }} className={`relative h-12 rounded-card-sm border text-sm font-bold tabular-nums transition-all active:scale-[0.98] ${currentIndex === i ? 'bg-primary border-primary text-white font-black shadow-tactile-xs -translate-y-0.5' : isFlg ? 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose shadow-tactile-xs' : selectedAnswers[i] ? 'bg-black/5 dark:bg-white/5 border-transparent text-gray-900 dark:text-gray-100 font-bold' : 'bg-card border-black/[0.08] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-primary/50'}`}>
                    {i + 1}
                    {isBkmrk && <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-accent-gold rounded-full border-2 border-card" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentQ && (
        <AITutorDrawer 
          question={currentQ} 
          isOpen={showAI} 
          onClose={() => setShowAI(false)}
          studentAnswer={selectedAnswers[currentIndex]}
          isSimulator={isSimulator && !isFinished}
        />
      )}

      {zoomImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => { haptic.selection(); setZoomImage(null); }}
        >
          <button className="absolute top-8 right-6 w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full transition-all active:scale-[0.98] shadow-lg z-10 backdrop-blur-md border border-white/20">
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full flex-1 max-h-[70vh] flex items-center justify-center mb-24 mt-8">
            <Image width={1200} height={800} src={zoomImage} className="w-full max-h-full object-contain rounded-xl" alt="Zoomed diagram" />
          </div>

          {/* Floating Context Panel */}
          <div className="absolute bottom-8 left-4 right-4 bg-black/60 backdrop-blur-2xl border border-white/20 p-5 rounded-hero shadow-2xl max-h-[25vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <p className="text-white text-regular font-medium leading-relaxed">
              {questions[currentIndex]?.question}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
