/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Flag, Grid, Sparkles, CheckCircle2, XCircle, Bookmark, Award, X, Lock, Lightbulb, Clock, Maximize2 } from 'lucide-react';
import { Question } from '@/types';
import Image from 'next/image';
import { MathText } from '@/components/MathText';
import { AIResponse } from '@/components/AIResponse';
import dynamic from 'next/dynamic';
import { ExamTimer } from './ExamTimer';
import { useTelegram } from '@/hooks/useTelegram';

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
  const { user, haptic } = useTelegram();
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
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: letter }));
    
    const normalizedAns = currentQ?.answer ? currentQ.answer.trim().toUpperCase() : null;
    
    if (!isSimulator) {
      if (!normalizedAns) {
        haptic.selection();
      } else if (letter === normalizedAns) {
        haptic.notification('success');
      } else {
        haptic.notification('error');
      }
    } else {
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

  const handleFinish = async () => {
    setIsFinished(true);
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setTimeSpentSeconds(elapsed);
    if (!hasRecordedCompletion) {
      setHasRecordedCompletion(true);
      try {
        if (!user?.id) return;
        await updateDailyStreak();

        // Record subject mastery stats
        let correctCount = 0;
        questions.forEach((q, idx) => {
          const norm = q.answer ? q.answer.trim().toUpperCase() : null;
          if (norm && selectedAnswers[idx] === norm) correctCount++;
        });

        await fetch('/api/exam/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            attempted: questions.length,
            correct: correctCount,
            timeSpentSeconds: elapsed
          })
        });

      } catch (err) {
        console.error("Error saving exam stats:", err);
      }
    }
  };

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
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-ground text-gray-900 dark:text-gray-100 p-6 flex flex-col justify-center items-center max-w-md mx-auto animate-fade-in font-sans">
        <div className="w-full bg-card border border-primary/20 rounded-[32px] p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-[16px] bg-primary border border-primary/20 mx-auto flex items-center justify-center shadow-sm text-gray-900 dark:text-gray-100">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Exam Completed!</h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">{title}</p>
          </div>
          <div className="py-8 bg-ground rounded-[24px] border border-black/5 dark:border-white/10">
            <div className="text-6xl font-black text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">{percentage}%</div>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mt-2">Correct: <span className="text-accent-emerald">{score}</span> / {questions.length}</p>
            {isSimulator && <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2">Time: {Math.floor(timeSpentSeconds / 60)}m {timeSpentSeconds % 60}s</p>}
          </div>
          <div className="space-y-4 pt-2">
            <button onClick={() => { haptic.impact('medium'); setIsFinished(false); setIsReviewMode(true); setCurrentIndex(0); }} className="w-full  py-4 bg-primary text-white rounded-[16px] font-bold text-sm transition-all">Review Answers</button>
            <button onClick={() => { haptic.impact('medium'); setIsFinished(false); setIsReviewMode(false); setCurrentIndex(0); setSelectedAnswers({}); setFlagged(new Set()); startTimeRef.current = Date.now(); setHasRecordedCompletion(false); }} className="w-full  py-4 bg-card text-gray-900 dark:text-gray-100 rounded-[16px] font-bold text-sm transition-all">Retake Exam</button>
            <button onClick={onExit} className="w-full  py-4 bg-ground border-black/10 dark:border-white/20 text-gray-600 dark:text-gray-400 rounded-[16px] font-bold text-sm transition-all">Exit to Dashboard</button>
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
      <header className="sticky top-0 z-30 bg-ground/90 backdrop-blur-md pt-safe border-b border-black/5 dark:border-white/10 pb-3">
        <div className="px-5 pt-3 pb-2 flex justify-between items-center mb-1">
          <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-[14px] bg-card border border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 active:scale-[0.98] active:opacity-80 transition-transform"><X className="w-5 h-5" /></button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">{title}</span>
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
          }} className={`w-10 h-10 flex items-center justify-center rounded-[14px] border-2 transition-all active:scale-[0.98] active:opacity-80 ${flagged.has(currentIndex) ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-900/50 text-rose-500 shadow-sm' : 'bg-card border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100'}`}><Flag className="w-4 h-4" fill={flagged.has(currentIndex) ? 'currentColor' : 'none'} /></button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-5">
          <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#229ED9] transition-all duration-300 ease-out rounded-full" 
               style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
             />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-6 relative">
        <div className="bg-card border border-black/5 dark:border-white/10 rounded-[24px] p-6 shadow-sm relative mb-2">
          <button onClick={toggleBookmark} className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.98] active:opacity-80 ${isSaved ? 'bg-primary/10 text-gray-900 dark:text-gray-100' : 'bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100'}`}><Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} /></button>
          
          <div className="pr-8 text-lg leading-relaxed font-bold text-gray-900 dark:text-gray-100 relative whitespace-pre-wrap">
            <MathText content={currentQ.question} />
          </div>

          {currentQ.image_url && (
            <button onClick={() => { haptic.selection(); setZoomImage(currentQ.image_url || null); }} className="w-full mt-4 rounded-[16px] border border-black/5 dark:border-white/10 overflow-hidden bg-white dark:bg-card relative group active:scale-[0.98] transition-transform block focus-ring">
              <Image width={800} height={400} src={currentQ.image_url} alt="Question diagram" className="w-full h-auto max-h-64 object-contain" />
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

            let cls = 'bg-card border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-black/20 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5';
            
            if (isSelected) cls = 'bg-primary/10 border-primary/50 text-gray-900 dark:text-gray-100 font-bold scale-[0.99] shadow-sm';
            
            if (isRevealed) {
              if (isCorrect) {
                cls = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm font-bold scale-[0.99]';
              } else if (isWrongSelected) {
                cls = 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-500/50 text-rose-950 dark:text-rose-200 shadow-sm font-bold scale-[0.99]';
              } else if (isSelected && !normalizedAns) {
                cls = 'bg-primary/10 border-primary text-gray-900 dark:text-gray-100 shadow-sm font-bold scale-[0.99]';
              } else {
                cls = 'bg-card border-black/10 dark:border-white/20 text-gray-900 dark:text-gray-100 opacity-50';
              }
            }

            return (
              <button
                key={letter}
                onClick={() => (!isReviewMode && (isSimulator || !isAnswered)) && handleSelectOption(letter as any)}
                disabled={isReviewMode || (!isSimulator && isAnswered)}
                className={`w-full flex items-center justify-between gap-4 p-4 rounded-[20px] border-2 transition-all duration-200 text-left ${cls} ${(!isReviewMode && (isSimulator || !isAnswered)) ? 'active:scale-[0.98] active:opacity-80' : ''}`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${isRevealed && isCorrect ? 'bg-emerald-500 text-white' : isRevealed && isWrongSelected ? 'bg-rose-500 text-white' : isSelected ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/5'}`}>
                    {letter}
                  </div>
                  <span className="text-sm leading-relaxed flex-1 font-medium whitespace-pre-wrap self-center"><MathText content={opt} /></span>
                </div>

                {isRevealed && isCorrect && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 self-center" />
                )}

                {isRevealed && isWrongSelected && (
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {(!isSimulator || isReviewMode) && (isAnswered || isReviewMode) && (
          <div className="pt-2 pb-4 animate-fade-up">
            <div className="bg-amber-50 dark:bg-amber-900/50 border border-amber-200/50 rounded-[24px] p-5">
              <div className="flex items-start gap-3 mb-3">
                {currentQ?.answer?.trim() ? (
                  <>
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full p-1.5 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-900 dark:text-amber-100/60 dark:text-amber-100/60 uppercase tracking-widest block mb-0.5">Correct Answer</span>
                      <p className="text-base font-black text-emerald-950 dark:text-emerald-100">{currentQ.answer.trim().toUpperCase()}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full p-1.5 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-900 dark:text-amber-100/60 dark:text-amber-100/60 uppercase tracking-widest block mb-0.5">No Key Provided</span>
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Tap <strong className="text-amber-950 dark:text-amber-100">Ask AI</strong> below for a detailed solution.</p>
                    </div>
                  </>
                )}
              </div>

              {currentQ.explanation ? (
                <div className="pl-10 mt-3 border-t border-amber-200/50 pt-3">
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-100/60 dark:text-amber-100/60 uppercase tracking-widest block mb-2">Explanation</span>
                  <div className="text-sm text-amber-950 dark:text-amber-100 font-medium leading-relaxed whitespace-pre-wrap">
                    <MathText content={currentQ.explanation} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-ground/90 backdrop-blur-md border-t border-black/5 dark:border-white/10 p-4 z-30 flex justify-between items-center pb-safe">
        <button 
          onClick={() => { 
            if (canUseAI) {
              haptic.impact('light'); 
              setShowAI(true); 
            } else {
              haptic.notification('error');
            }
          }} 
          className={`px-5 h-14 rounded-[20px] text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98] active:opacity-80 ${
            canUseAI 
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 hover:bg-amber-200' 
              : 'bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 opacity-70'
          }`}
        >
          {canUseAI ? (
            <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500"/>
          ) : (
            <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
          Ask AI
        </button>
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <button onClick={() => { haptic.selection(); setCurrentIndex(prev => prev - 1); }} className="w-14 h-14 rounded-[20px] bg-card border border-black/5 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-gray-100 active:scale-[0.98] active:opacity-80 hover:border-black/10 dark:hover:border-white/20 dark:border-white/20 transition-all shadow-sm"><ChevronLeft className="w-5 h-5"/></button>
          )}
          <button onClick={() => { haptic.selection(); setShowGrid(true); }} className="w-14 h-14 rounded-[20px] bg-card border border-black/5 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-gray-100 active:scale-[0.98] active:opacity-80 hover:border-black/10 dark:hover:border-white/20 dark:border-white/20 transition-all shadow-sm"><Grid className="w-5 h-5"/></button>
          {currentIndex < questions.length - 1 ? (
            <button onClick={() => { haptic.selection(); setCurrentIndex(prev => prev + 1); }} className="px-6 h-14 bg-primary text-white rounded-[20px] text-sm font-bold active:scale-[0.98] active:opacity-80 flex items-center gap-2 shadow-sm shadow-primary/20 transition-all">Next <ChevronRight className="w-5 h-5"/></button>
          ) : (
            <button onClick={isReviewMode ? () => setIsFinished(true) : handleFinish} className="px-6 h-14 bg-primary text-white rounded-[20px] text-sm font-bold active:scale-[0.98] active:opacity-80 flex items-center gap-2 shadow-sm shadow-primary/20 transition-all">{isReviewMode ? 'Finish' : 'Submit'}</button>
          )}
        </div>
      </footer>

      {showGrid && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in" onClick={() => setShowGrid(false)}>
          <div className="w-full max-w-sm bg-card rounded-[32px] p-6 shadow-2xl animate-scale-bounce" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-black/5 dark:border-white/10">
              <h3 className="font-bold tracking-tight text-xl text-gray-900 dark:text-gray-100">Question Grid</h3>
              <button onClick={() => setShowGrid(false)} className="w-10 h-10 flex justify-center items-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 dark:bg-white/10 text-gray-900 dark:text-gray-100 active:scale-[0.98] active:opacity-80 transition-all"><X className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pb-2 pt-2">
              {questions.map((_, i) => {
                const qIdLoop = questions[i]?.id || `${subject}-${questions[i]?.question.substring(0, 20)}`;
                const isBkmrk = savedQuestions.has(qIdLoop);
                const isFlg = flagged.has(i);
                
                return (
                  <button key={i} onClick={() => { setCurrentIndex(i); setShowGrid(false); }} className={`relative h-12 rounded-[16px] border-2 text-sm font-bold tabular-nums transition-all active:scale-[0.98] active:opacity-80 ${currentIndex === i ? 'bg-primary border-primary text-card shadow-sm -translate-y-1' : isFlg ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-900/50 text-rose-600 shadow-sm' : selectedAnswers[i] ? 'bg-black/5 dark:bg-white/5 border-transparent text-gray-900 dark:text-gray-100' : 'bg-card border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-primary/50'}`}>
                    {i + 1}
                    {isBkmrk && <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-card" />}
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

      {/* Full-screen Image Lightbox Overlay */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { haptic.selection(); setZoomImage(null); }}
        >
          <button className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-card border border-primary/20 rounded-full text-gray-900 dark:text-gray-100 transition-all active:scale-[0.98] active:opacity-80 shadow-sm">
            <X className="w-6 h-6" />
          </button>
          <Image width={800} height={400} src={zoomImage} className="w-full max-h-[90vh] object-contain rounded-xl" alt="Zoomed diagram" />
        </div>
      )}
    </div>
  );
};
