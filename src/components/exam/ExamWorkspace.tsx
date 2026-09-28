/* eslint-disable @next/next/no-img-element */
'use client';

import { toast } from "sonner";
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Flag, Grid, Sparkles, CheckCircle2, XCircle, Bookmark, Award, X, Lock, Lightbulb, Clock, Maximize2, Zap } from 'lucide-react';
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
    setFullscreen(true);
    setVerticalSwipes(false);
    setClosingConfirmation(true);
    return () => {
      setFullscreen(false);
      setVerticalSwipes(true);
      setClosingConfirmation(false);
    };
  }, [setFullscreen, setVerticalSwipes, setClosingConfirmation]);

  // Auto-scroll to top when question changes
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [inlineHint, setInlineHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    setShowExplanation(false);
    setInlineHint(null);
    setIsHintLoading(false);
  }, [currentIndex]);

  const handleGetHint = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    haptic.impact('medium');
    setIsHintLoading(true);
    setInlineHint('');
    
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          questionText: currentQ.question,
          options: [currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d],
          promptType: 'hint',
          subject: currentQ.subject
        })
      });
      
      if (!res.ok) {
        let errMessage = 'Failed to fetch hint';
        try {
          const errData = await res.json();
          if (errData?.error) errMessage = errData.error;
        } catch {}
        throw new Error(errMessage);
      }
      
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let accumulated = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setInlineHint(accumulated);
      }
    } catch {
      setInlineHint('Failed to load hint. Please try again.');
    } finally {
      setIsHintLoading(false);
    }
  };

  const currentQ = questions[currentIndex];

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!user?.id) return;
      try {
        const questionIds = await getSavedMistakes();
        if (questionIds.length > 0) {
          setSavedQuestions(new Set(questionIds));
        }
      } catch (err) {
        console.error("Error loading bookmarks from Supabase:", err);
      }
    };
    loadBookmarks();
  }, [user?.id]);

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
    if (!currentQ || !user?.id) return;
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
        if (!user?.id) return;
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
  }, [hasRecordedCompletion, user?.id, questions, selectedAnswers, subject, title]);

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
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">{title}</p>
          </div>

          <div className="py-5 px-4 bg-ground rounded-card-sm border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-around">
            <div className="text-center">
              <div className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">{percentage}%</div>
              <p className="text-caption font-black text-slate-400 uppercase tracking-wider mt-0.5">Accuracy</p>
            </div>
            <div className="h-10 w-[2px] bg-black/10 dark:bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-black text-accent-emerald tracking-tight tabular-nums">{score} <span className="text-base text-slate-400 font-bold">/ {questions.length}</span></div>
              <p className="text-caption font-black text-slate-400 uppercase tracking-wider mt-0.5">Correct</p>
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
              className="btn-3d-card w-full py-3.5 rounded-card-sm font-black text-sm text-gray-800 dark:text-gray-200"
            >
              Retake Exam
            </button>
            <button 
              onClick={() => { sounds.playTap(); onExit(); }} 
              className="w-full py-2.5 text-xs font-black text-slate-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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
          <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-btn bg-card border border-black/[0.06] dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 active:scale-[0.98] transition-transform"><X className="w-5 h-5" /></button>
          <div className="flex flex-col items-center">
            <span className="text-micro uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">{title}</span>
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
                  <span className="text-sm font-black text-gray-900 dark:text-gray-100 tabular-nums">
                    Practice Mode
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
          }} className={`w-10 h-10 flex items-center justify-center rounded-btn border transition-all active:scale-[0.98] ${flagged.has(currentIndex) ? 'bg-error/10 border-error/30 text-error' : 'bg-card border-black/[0.06] dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}><Flag className="w-4 h-4" fill={flagged.has(currentIndex) ? 'currentColor' : 'none'} /></button>
        </div>
        
        {/* Chunky Duolingo Progress Bar */}
        <div className="px-5">
          <div className="h-3 w-full bg-black/[0.06] dark:bg-white/[0.08] rounded-full p-0.5 border border-black/[0.05] overflow-hidden shadow-inner">
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
          <button onClick={toggleBookmark} className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.98] ${isSaved ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-100'}`}><Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} /></button>
          
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

            let cls = 'bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel border-b-black/[0.14] dark:border-b-white/[0.14] text-gray-800 dark:text-gray-200 hover:border-primary/40 active:translate-y-[1px] shadow-tactile-xs';
            
            if (isSelected) cls = 'bg-primary/10 border border-primary border-b-bevel border-b-primary text-gray-900 dark:text-gray-100 font-bold active:translate-y-[1px] shadow-tactile-xs';
            
            if (isRevealed) {
              if (isCorrect) {
                cls = 'bg-accent-emerald/15 border border-accent-emerald border-b-bevel border-b-emerald-600 text-accent-emerald font-black shadow-tactile-xs';
              } else if (isWrongSelected) {
                cls = 'bg-accent-rose/15 border border-accent-rose border-b-bevel border-b-rose-600 text-accent-rose font-black shadow-tactile-xs';
              } else if (isSelected && !normalizedAns) {
                cls = 'bg-primary/10 border border-primary border-b-bevel border-b-primary text-gray-900 dark:text-gray-100 shadow-tactile-xs font-bold';
              } else {
                cls = 'bg-card/40 border border-black/[0.04] dark:border-white/[0.04] text-gray-400 dark:text-gray-500 opacity-40';
              }
            }

            return (
              <button
                key={letter}
                onClick={() => (!isReviewMode && (isSimulator || !isAnswered)) && handleSelectOption(letter as any)}
                disabled={isReviewMode || (!isSimulator && isAnswered)}
                className={`w-full flex items-center justify-between gap-3.5 p-3.5 rounded-card-sm transition-all duration-150 text-left ${cls}`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-control flex items-center justify-center shrink-0 text-sm font-black transition-colors duration-200 ${
                    isRevealed && isCorrect 
                      ? 'bg-accent-emerald text-white' 
                      : isRevealed && isWrongSelected 
                      ? 'bg-accent-rose text-white' 
                      : isSelected 
                      ? 'bg-primary text-white shadow-tactile-xs' 
                      : 'bg-black/5 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300'
                  }`}>
                    {letter}
                  </div>
                  <span className="text-sm leading-relaxed flex-1 font-medium whitespace-pre-wrap self-center"><MathText content={opt} /></span>
                </div>

                {isRevealed && isCorrect && (
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    <span className="text-micro font-black px-2 py-0.5 rounded-full bg-accent-emerald/20 text-accent-emerald">+10 XP</span>
                    <CheckCircle2 className="w-5 h-5 text-accent-emerald" />
                  </div>
                )}

                {isRevealed && isWrongSelected && (
                  <XCircle className="w-5 h-5 text-accent-rose shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {(!isSimulator || isReviewMode) && (isAnswered || isReviewMode) && (
          <div className="pt-2 pb-4 animate-fade-up">
            <div className="bg-accent-gold/[0.06] border border-accent-gold/20 rounded-card p-4.5">
              <div className="flex items-start gap-3 mb-3">
                {currentQ?.answer?.trim() ? (
                  <>
                    <div className="bg-accent-emerald/15 text-accent-emerald rounded-control p-1.5 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-micro font-bold text-accent-gold uppercase tracking-widest block mb-0.5">Correct Answer</span>
                      <p className="text-base font-black text-gray-900 dark:text-gray-100">{currentQ.answer.trim().toUpperCase()}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-accent-gold/15 text-accent-gold rounded-control p-1.5 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-micro font-bold text-accent-gold uppercase tracking-widest block mb-0.5">No Key Provided</span>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Tap <strong className="text-gray-900 dark:text-gray-100">Ask AI</strong> below for a step-by-step solution.</p>
                    </div>
                  </>
                )}
              </div>

              {currentQ.explanation ? (
                <div className="pl-9 mt-3 border-t border-accent-gold/15 pt-3">
                  <span className="text-micro font-bold text-accent-gold uppercase tracking-widest block mb-1.5">Explanation</span>
                  <div className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed whitespace-pre-wrap">
                    <MathText content={currentQ.explanation} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-ground/90 backdrop-blur-xl border-t border-black/[0.06] dark:border-white/[0.08] p-3.5 z-30 flex justify-between items-center pb-safe">
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
          className={`px-4 h-11 rounded-card-sm text-xs font-black flex items-center gap-1.5 transition-all border border-b-2 active:translate-y-[1px] ${
            canUseAI 
              ? 'bg-accent-gold/15 text-accent-gold border-accent-gold/30 border-b-accent-gold/50 hover:bg-accent-gold/20' 
              : 'bg-black/5 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-black/5 dark:border-white/5 opacity-60'
          }`}
        >
          {canUseAI ? (
            <Sparkles className="w-4 h-4 fill-accent-gold text-accent-gold"/>
          ) : (
            <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          )}
          Ask AI
        </button>
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <button 
              onClick={() => { sounds.playTap(); haptic.selection(); setCurrentIndex(prev => prev - 1); }} 
              className="w-11 h-11 rounded-card-sm bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-2 border-b-black/[0.14] dark:border-b-white/[0.14] flex items-center justify-center text-gray-900 dark:text-gray-100 active:translate-y-[1px] hover:border-black/20 dark:hover:border-white/20 transition-all shadow-tactile-xs"
            >
              <ChevronLeft className="w-5 h-5"/>
            </button>
          )}
          <button 
            onClick={() => { sounds.playTap(); haptic.selection(); setShowGrid(true); }} 
            className="w-11 h-11 rounded-card-sm bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-2 border-b-black/[0.14] dark:border-b-white/[0.14] flex items-center justify-center text-gray-900 dark:text-gray-100 active:translate-y-[1px] hover:border-black/20 dark:hover:border-white/20 transition-all shadow-tactile-xs"
          >
            <Grid className="w-5 h-5"/>
          </button>
          {currentIndex < questions.length - 1 ? (
            <button 
              onClick={() => { sounds.playTap(); haptic.selection(); setCurrentIndex(prev => prev + 1); }} 
              className="btn-3d-primary px-5 h-11 rounded-card-sm text-xs font-black flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4"/>
            </button>
          ) : (
            <button 
              onClick={isReviewMode ? () => { sounds.playTap(); setIsFinished(true); } : handleFinish} 
              className="btn-3d-primary px-5 h-11 rounded-card-sm text-xs font-black flex items-center gap-1.5"
            >
              {isReviewMode ? 'Finish' : 'Submit'}
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
