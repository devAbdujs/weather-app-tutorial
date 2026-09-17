/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Flag, Grid, Sparkles, CheckCircle2, XCircle, Bookmark, Award, X, Lock, Lightbulb } from 'lucide-react';
import { Question } from '@/types';
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
        } catch (e) {}
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
    const telegramId = user.id.toString();

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
      <div className="min-h-screen bg-ground text-primary p-6 flex flex-col justify-center items-center max-w-md mx-auto animate-fade-in font-sans">
        <div className="w-full bg-card border border-primary/20 rounded-[32px] p-8 text-center shadow-brutal-heavy space-y-6">
          <div className="w-16 h-16 rounded-[16px] bg-primary border border-primary/20 mx-auto flex items-center justify-center shadow-sm text-primary">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Exam Completed!</h2>
            <p className="text-sm font-medium text-secondary mt-2">{title}</p>
          </div>
          <div className="py-8 bg-ground rounded-[24px] border border-black/5">
            <div className="text-6xl font-black text-primary tracking-tight tabular-nums">{percentage}%</div>
            <p className="text-sm font-bold text-secondary mt-2">Correct: <span className="text-accent-emerald">{score}</span> / {questions.length}</p>
            {isSimulator && <p className="text-xs font-bold text-tertiary mt-2">Time: {Math.floor(timeSpentSeconds / 60)}m {timeSpentSeconds % 60}s</p>}
          </div>
          <div className="space-y-4 pt-2">
            <button onClick={() => { haptic.impact('medium'); setIsFinished(false); setIsReviewMode(true); setCurrentIndex(0); }} className="w-full  py-4 bg-primary text-card rounded-[16px] font-bold text-sm transition-all">Review Answers</button>
            <button onClick={() => { haptic.impact('medium'); setIsFinished(false); setIsReviewMode(false); setCurrentIndex(0); setSelectedAnswers({}); setFlagged(new Set()); startTimeRef.current = Date.now(); setHasRecordedCompletion(false); }} className="w-full  py-4 bg-card text-primary rounded-[16px] font-bold text-sm transition-all">Retake Exam</button>
            <button onClick={onExit} className="w-full  py-4 bg-ground border-black/10 text-secondary rounded-[16px] font-bold text-sm transition-all">Exit to Dashboard</button>
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
    <div className={`min-h-screen ${isSimulator && !isReviewMode ? 'exam-mode-active' : 'bg-ground'} text-primary flex flex-col justify-between max-w-md mx-auto pb-24 font-sans select-none relative`}>
      <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur-md border-b-2 border-black/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-card border border-black/5 text-secondary hover:text-primary transition-colors focus-ring active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-bold text-secondary tabular-nums">Q {currentIndex + 1}/{questions.length}</span>
        </div>
        <div className="flex items-center gap-3">
          {isSimulator && !isReviewMode && (
            <ExamTimer 
              initialSeconds={timeLimitMinutes * 60} 
              isPaused={isFinished || isReviewMode} 
              onTimeUp={() => {
                haptic.notification('warning');
                handleFinish();
              }} 
            />
          )}
          <button onClick={toggleBookmark} className={`w-10 h-10 flex items-center justify-center rounded-[12px] border-2 transition-all active:scale-95 ${isSaved ? 'bg-primary border-primary text-card shadow-sm' : 'bg-card border-black/5 text-secondary hover:text-primary'}`}><Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} /></button>
          <button onClick={() => {
            haptic.impact('light');
            const next = new Set(flagged);
            if (next.has(currentIndex)) next.delete(currentIndex);
            else next.add(currentIndex);
            setFlagged(next);
          }} className={`w-10 h-10 flex items-center justify-center rounded-[12px] border-2 transition-all active:scale-95 ${flagged.has(currentIndex) ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-card border-black/5 text-secondary hover:text-primary'}`}><Flag className="w-4 h-4" fill={flagged.has(currentIndex) ? 'currentColor' : 'none'} /></button>
        </div>
      </header>

      <main 
        className="flex-1 px-5 py-6 space-y-6 overflow-y-auto relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="text-lg leading-relaxed font-bold text-primary relative">
          <MathText content={currentQ.question} />
        </div>

        {currentQ.image_url && (
          <button 
            onClick={() => {
              haptic.impact('light');
              setZoomImage(getImageUrl(currentQ.image_url!));
            }}
            className="w-full rounded-[16px] border border-black/5 overflow-hidden bg-white relative group active:scale-[0.98] transition-transform block focus-ring"
          >
            <img
              src={getImageUrl(currentQ.image_url)}
              alt="Question diagram"
              className="w-full h-auto max-h-64 object-contain"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
              Tap to zoom
            </div>
          </button>
        )}

        {(!isAnswered && !isSimulator) && (
          <div className="my-2">
            {!inlineHint && !isHintLoading ? (
              <button 
                onClick={handleGetHint} 
                className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors active:scale-95"
              >
                <Lightbulb className="w-4 h-4 text-accent-amber fill-accent-amber/20"/> Give me hint
              </button>
            ) : (
              <div className="bg-primary/5 border-2 border-primary/10 rounded-[20px] p-5 text-sm font-medium text-primary">
                {isHintLoading && !inlineHint ? (
                  <span className="animate-pulse flex items-center gap-2 font-bold text-primary uppercase tracking-widest text-[10px]">
                    <Lightbulb className="w-4 h-4 text-accent-amber"/> Thinking...
                  </span>
                ) : (
                  <div className="flex gap-3 items-start">
                    <Lightbulb className="w-5 h-5 text-accent-amber shrink-0 mt-0.5 fill-accent-amber/20"/>
                    <div className="flex-1 overflow-x-auto">
                      <AIResponse content={inlineHint || ''} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {(['A', 'B', 'C', 'D'] as const).map((letter) => {
            const opt = currentQ[`option_${letter.toLowerCase()}` as keyof Question] as string;
            if (!opt) return null;
            const isSelected = chosenAnswer === letter;
            const normalizedAns = currentQ?.answer ? currentQ.answer.trim().toUpperCase() : null;
            let cls = 'bg-card border-black/5 text-secondary hover:border-primary';
            
            const isRevealed = (!isSimulator || isReviewMode) && (isAnswered || isReviewMode);
            const isCorrect = normalizedAns ? letter === normalizedAns : false;
            const isWrongSelected = isSelected && normalizedAns ? letter !== normalizedAns : false;

            // Neobrutalist active state
            if (isSelected) cls = 'bg-primary border-primary text-white shadow-md font-bold -translate-y-1';
            
            // Review/Practice reveal
            if (isRevealed) {
              if (isCorrect) {
                cls = 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-sm font-bold -translate-y-1';
              } else if (isWrongSelected) {
                cls = 'bg-red-100 border-red-500 text-red-950 shadow-sm font-bold -translate-y-1';
              } else if (isSelected && !normalizedAns) {
                cls = 'bg-primary/20 border-primary text-white shadow-md font-bold -translate-y-1';
              } else {
                cls = 'bg-card border-black/10 text-primary';
              }
            }

            return (
              <button 
                key={letter} 
                onClick={() => (!isReviewMode && (isSimulator || !isAnswered)) && handleSelectOption(letter)} 
                disabled={isReviewMode || (!isSimulator && isAnswered)} 
                className={`w-full flex items-center justify-between gap-4 p-4 rounded-[16px] border-2 transition-all text-left ${cls} ${(!isReviewMode && (isSimulator || !isAnswered)) ? 'active:translate-y-1 active:shadow-none' : ''}`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <span className="text-sm font-black uppercase tracking-widest mt-0.5 w-6 shrink-0">{letter}</span>
                  <span className="text-sm leading-relaxed flex-1 font-medium"><MathText content={opt} /></span>
                </div>

                {isRevealed && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 self-center" />
                )}

                {isRevealed && isWrongSelected && (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {(!isSimulator || isReviewMode) && (isAnswered || isReviewMode) && (
          <div className="pt-2 pb-4 animate-fade-up">
            <div className="flex items-start gap-3 mb-3">
              {currentQ?.answer?.trim() ? (
                <>
                  <div className="bg-emerald-100 text-emerald-600 rounded-full p-1 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">Answer</span>
                    <p className="text-base font-black text-primary mt-0.5">{currentQ.answer.trim().toUpperCase()}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-black/5 text-secondary rounded-full p-1 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">No Key Provided</span>
                    <p className="text-xs font-medium text-secondary mt-0.5">Tap <strong className="text-primary">AI Tutor</strong> below for a detailed solution.</p>
                  </div>
                </>
              )}
            </div>

            {currentQ.explanation ? (
              <div className="pl-9">
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setShowExplanation((prev) => !prev);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors focus-ring active:scale-[0.99]"
                >
                  {showExplanation ? 'Hide Explanation' : 'Read Explanation'}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${showExplanation ? 'rotate-180' : ''}`}
                  />
                </button>

                {showExplanation && (
                  <div className="text-sm text-secondary font-medium leading-relaxed pt-3 animate-fade-in">
                    <MathText content={currentQ.explanation} />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-ground/90 backdrop-blur-md border-t-2 border-black/5 p-4 z-30 flex justify-between items-center pb-safe">
        <button 
          onClick={() => { 
            if (canUseAI) {
              haptic.impact('light'); 
              setShowAI(true); 
            } else {
              haptic.notification('error');
            }
          }} 
          className={`px-4 h-14 border-2 rounded-[16px] text-sm font-bold flex items-center gap-2 transition-all ${
            canUseAI 
              ? 'bg-card border-black/5 text-primary active:scale-95 hover:border-primary' 
              : 'bg-ground border-black/5 text-tertiary opacity-70'
          }`}
        >
          {canUseAI ? (
            <Sparkles className="w-5 h-5 fill-accent-amber text-accent-amber"/>
          ) : (
            <Lock className="w-4 h-4 text-tertiary" />
          )}
          Ask AI
        </button>
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <button onClick={() => { haptic.selection(); setCurrentIndex(prev => prev - 1); }} className="w-14 h-14 rounded-[16px] bg-card border border-black/5 flex items-center justify-center text-primary active:scale-95 hover:border-primary transition-all"><ChevronLeft className="w-5 h-5"/></button>
          )}
          <button onClick={() => { haptic.selection(); setShowGrid(true); }} className="w-14 h-14 rounded-[16px] bg-card border border-black/5 flex items-center justify-center text-primary active:scale-95 hover:border-primary transition-all"><Grid className="w-5 h-5"/></button>
          {currentIndex < questions.length - 1 ? (
            <button onClick={() => { haptic.selection(); setCurrentIndex(prev => prev + 1); }} className="px-6 h-14 bg-primary text-card rounded-[16px] text-sm font-bold active:scale-95 flex items-center gap-2 shadow-sm ">Next <ChevronRight className="w-5 h-5"/></button>
          ) : (
            <button onClick={isReviewMode ? () => setIsFinished(true) : handleFinish} className="px-6 h-14 bg-primary text-white rounded-[16px] text-sm font-bold shadow-md ">{isReviewMode ? 'Finish Review' : 'Submit Exam'}</button>
          )}
        </div>
      </footer>

      {showGrid && (
        <div className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-primary/20 rounded-[32px] p-6 shadow-brutal-heavy animate-scale-bounce">
            <div className="flex justify-between items-center border-b-2 border-black/5 pb-4 mb-4">
              <h3 className="font-bold tracking-tight text-lg text-primary">Question Matrix</h3>
              <button onClick={() => setShowGrid(false)} className="w-10 h-10 flex justify-center items-center rounded-[12px] bg-ground border-2 border-transparent hover:border-black/5 text-primary"><X className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pb-2 pt-2">
              {questions.map((_, i) => {
                const qIdLoop = questions[i]?.id || `${subject}-${questions[i]?.question.substring(0, 20)}`;
                const isBkmrk = savedQuestions.has(qIdLoop);
                const isFlg = flagged.has(i);
                
                return (
                  <button key={i} onClick={() => { setCurrentIndex(i); setShowGrid(false); }} className={`relative h-12 rounded-[12px] border-2 text-sm font-bold tabular-nums transition-all active:scale-95 ${currentIndex === i ? 'bg-primary border-primary text-card shadow-sm -translate-y-1' : isFlg ? 'bg-primary/10 border-primary text-primary shadow-sm -translate-y-1' : selectedAnswers[i] ? 'bg-ground border-black/20 text-primary' : 'bg-card border-black/5 text-secondary hover:border-primary hover:-translate-y-1 hover:shadow-sm'}`}>
                    {i + 1}
                    {isBkmrk && <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-card" />}
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
          <button className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-card border border-primary/20 rounded-[12px] text-primary transition-all active:scale-95 shadow-sm">
            <X className="w-6 h-6" />
          </button>
          <img src={zoomImage} className="w-full max-h-[90vh] object-contain rounded-xl" alt="Zoomed diagram" />
        </div>
      )}
    </div>
  );
};
