'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Shuffle, CheckCircle2, HelpCircle, ChevronLeft, Sparkles } from 'lucide-react';
import { Flashcard, Question } from '@/types';
import { MathText } from '@/components/MathText';
import { useTelegram } from '@/hooks/useTelegram';
import { createClient } from '@/utils/supabase/client';
import { AITutorDrawer } from '@/components/ai/AITutorDrawer';
import { useRouter } from 'next/navigation';

interface FlashcardDeckProps {
  subject?: string;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ subject }) => {
  const router = useRouter();
  const onExit = () => router.push('/');
  
  const { haptic } = useTelegram();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Swipe State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);

  const loadDeck = useCallback(async () => {
    setLoading(true);
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    try {
      const supabase = createClient();
      let query = supabase.from('flashcards').select('*');
      
      if (subject && subject !== 'All') {
        query = query.ilike('subject', `%${subject}%`);
      }
      
      // Fetch more cards and apply random offset to get true variety
      const randomOffset = Math.floor(Math.random() * 200);
      const { data, error } = await query.range(randomOffset, randomOffset + 49);
      if (error) {
        // Fallback: if offset is beyond table size, fetch from start
        const { data: fallbackData, error: fallbackError } = await query.limit(50);
        if (fallbackError) throw fallbackError;
        if (fallbackData && fallbackData.length > 0) {
          // Fisher-Yates shuffle for true randomness
          const arr = [...fallbackData];
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          setCards(arr.slice(0, 15));
        } else {
          setCards([]);
        }
        return;
      }

      if (data && data.length > 0) {
        // Fisher-Yates shuffle for true randomness
        const arr = [...data];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        setCards(arr.slice(0, 15));
      } else {
        setCards([]);
      }

    } catch (err) {
      console.error("Error fetching flashcards from Supabase:", err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const nextCard = (difficulty: 'easy' | 'hard') => {
    haptic.impact(difficulty === 'easy' ? 'light' : 'medium');
    setIsFlipped(false);
    // Use functional updater to avoid stale closure on currentIndex
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= cards.length) {
        // Schedule completion after state update
        setTimeout(() => {
          setIsCompleted(true);
          haptic.notification('success');
        }, 160);
        return prev; // Don't advance past end
      }
      return next;
    });
  };


  const handleFlip = () => {
    haptic.selection();
    setIsFlipped(!isFlipped);
  };

  // Pointer Events for Swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isFlipped) return; 
    setIsDragging(true);
    dragStartX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const offset = e.clientX - dragStartX.current;
    setDragOffset(offset);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (dragOffset > 100) {
      nextCard('easy');
    } else if (dragOffset < -100) {
      nextCard('hard');
    }
    setDragOffset(0);
  };

  const currentCard = cards[currentIndex];
  const swipeRotation = dragOffset * 0.05; 
  const swipeOpacity = 1 - Math.min(Math.abs(dragOffset) / 300, 0.5);
  const progressPercent = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  // Map Flashcard to Question format for the AITutorDrawer
  const pseudoQuestion: Question | null = currentCard ? ({
    id: currentCard.id.toString(),
    question: `Explain this flashcard concept: ${currentCard.front}`,
    option_a: null, option_b: null, option_c: null, option_d: null,
    answer: currentCard.back,
    explanation: currentCard.back,
    subject: currentCard.subject || 'General',
    exam_type: 'Flashcard'
  } as unknown as Question) : null;

  return (
    <div className="min-h-screen bg-ground text-gray-900 dark:text-gray-100 pb-24 max-w-md mx-auto flex flex-col justify-between font-sans overflow-hidden">
      <header className="bg-ground/90 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08] flex flex-col z-10 relative animate-fade-up">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {onExit && (
              <button onClick={() => { haptic.impact('light'); onExit(); }} className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-card border border-black/[0.06] dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors active:scale-95 shadow-bespoke-sm">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-bespoke-sm">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Flashcards</h1>
            </div>
          </div>
          
          <button onClick={() => { haptic.impact('light'); loadDeck(); }} className="w-10 h-10 rounded-[12px] bg-card border border-black/[0.06] dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors active:scale-95 flex justify-center items-center shadow-bespoke-sm">
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-[2px] bg-black/[0.04] dark:bg-white/[0.04]">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-bespoke"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative w-full h-full">
        {loading ? (
          <div className="w-full max-w-sm h-[420px] rounded-[32px] bg-black/5 dark:bg-white/5 animate-pulse" />
        ) : isCompleted ? (
          <div className="w-full max-w-sm bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[32px] p-8 text-center space-y-6 shadow-bespoke-md animate-fade-in">
            <div className="w-20 h-20 rounded-[20px] bg-[hsl(145,42%,38%)]/10 border border-[hsl(145,42%,38%)]/20 mx-auto flex items-center justify-center shadow-bespoke-sm">
              <CheckCircle2 className="w-10 h-10 text-[hsl(145,42%,38%)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Deck Completed!</h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Excellent spaced repetition session.</p>
            </div>
            <button onClick={() => { haptic.impact('medium'); loadDeck(); }} className="w-full py-4 bg-primary text-white font-bold text-sm rounded-[16px] shadow-bespoke-md active:scale-[0.98] transition-all duration-200 ease-bespoke">
              Study Next Batch
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center font-bold text-gray-500 dark:text-gray-400">No cards found.</div>
        ) : (
          <div className="w-full max-w-sm space-y-6 relative flex flex-col items-center">
            
            <div className="w-full flex justify-between font-bold text-xs text-gray-500 dark:text-gray-400 tracking-widest uppercase px-1 tabular-nums">
              <span>{currentCard.subject}</span>
              <span>{currentIndex + 1} / {cards.length}</span>
            </div>

            {/* Background Hint Indicators */}
            {isFlipped && (
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-2 w-full pointer-events-none z-0">
                <div className={`text-error font-black text-2xl transition-opacity ${dragOffset < -50 ? 'opacity-100' : 'opacity-0'}`}>FORGOT</div>
                <div className={`text-[hsl(145,42%,38%)] font-black text-2xl transition-opacity ${dragOffset > 50 ? 'opacity-100' : 'opacity-0'}`}>KNOW IT</div>
              </div>
            )}

            {/* The Tinder Card */}
            <div 
              className={`w-full h-[400px] perspective-1000 select-none z-10 touch-none ${isFlipped ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onClick={!isFlipped ? handleFlip : undefined}
              ref={cardRef}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${swipeRotation}deg)`,
                opacity: swipeOpacity,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s'
              }}
            >
              <div className={`relative w-full h-full duration-[500ms] transform-style-3d ease-snap ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[32px] p-8 flex flex-col justify-center items-center backface-hidden shadow-bespoke-md">
                  <span className="absolute top-6 left-6 text-[10px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><HelpCircle className="w-4 h-4"/> Concept</span>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center leading-relaxed max-h-64 overflow-y-auto no-scrollbar w-full">
                    <MathText content={currentCard.front} />
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-[32px] p-8 flex flex-col justify-center items-center rotate-y-180 backface-hidden shadow-bespoke-md">
                  <span className="absolute top-6 left-6 text-[10px] uppercase tracking-widest font-black text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Answer</span>
                  <div className="text-base font-medium text-gray-900 dark:text-gray-100 text-center leading-relaxed max-h-64 overflow-y-auto no-scrollbar w-full">
                    <MathText content={currentCard.back} />
                  </div>
                  
                  {/* AI Tutor Integration Button */}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      haptic.impact('light');
                      setShowAI(true); 
                    }}
                    className="absolute bottom-6 right-6 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors active:scale-95 pointer-events-auto"
                  >
                     <Sparkles className="w-3.5 h-3.5"/> Ask AI
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-2 h-14 relative">
              {!isFlipped ? (
                <button onClick={handleFlip} className="w-full absolute inset-0 h-14 rounded-[16px] bg-primary text-white font-black uppercase tracking-widest text-sm transition-all duration-200 ease-bespoke animate-fade-in shadow-bespoke-sm active:scale-[0.98]">
                  Tap to Reveal Answer
                </button>
              ) : (
                <div className="flex gap-4 w-full absolute inset-0 animate-fade-in">
                  <button onClick={() => nextCard('hard')} className="flex-1 h-14 rounded-[16px] bg-card text-error font-black uppercase tracking-widest text-xs border border-error/20 shadow-bespoke-sm active:scale-[0.98] transition-all">
                    Forgot
                  </button>
                  <button onClick={() => nextCard('easy')} className="flex-1 h-14 rounded-[16px] bg-[hsl(145,42%,38%)] text-white font-black uppercase tracking-widest text-xs shadow-bespoke-sm active:scale-[0.98] transition-all">
                    Knew It
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {pseudoQuestion && (
        <AITutorDrawer question={pseudoQuestion} isOpen={showAI} onClose={() => setShowAI(false)} />
      )}
    </div>
  );
};
