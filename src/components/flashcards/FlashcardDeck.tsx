'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Award, 
  CheckCircle2, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Flashcard } from '@/types';
import { MathText } from '@/components/MathText';
import { useTelegram } from '@/hooks/useTelegram';

export const FlashcardDeck: React.FC = () => {
  const { haptic } = useTelegram();
  const [subjects, setSubjects] = useState<{ subject: string; count: number }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState({ easy: 0, good: 0, hard: 0 });

  // Fetch subjects metadata
  useEffect(() => {
    fetch('/api/flashcards?meta=subjects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.subjects) {
          setSubjects(data.subjects);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch flashcards for subject
  const loadDeck = useCallback((subject: string) => {
    setLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);
    setIsCompleted(false);
    setStats({ easy: 0, good: 0, hard: 0 });

    const url = subject === 'All' 
      ? '/api/flashcards?limit=30' 
      : `/api/flashcards?subject=${encodeURIComponent(subject)}&limit=30`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.flashcards) {
          setCards(data.flashcards);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDeck(selectedSubject);
  }, [selectedSubject, loadDeck]);

  const handleFlip = () => {
    haptic.selection();
    setIsFlipped((prev) => !prev);
  };

  const handleRateCard = (rating: 'hard' | 'good' | 'easy') => {
    haptic.impact(rating === 'easy' ? 'light' : rating === 'good' ? 'medium' : 'heavy');
    setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    } else {
      setIsCompleted(true);
      haptic.notification('success');
    }
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 max-w-md mx-auto flex flex-col justify-between">
      {/* Top Bar */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 p-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-amber-500/20">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Active Flashcards</h1>
              <p className="text-[10px] text-slate-400">10,500+ Spaced Repetition Cards</p>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.impact('light');
              loadDeck(selectedSubject);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Subject Pill Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => {
              haptic.selection();
              setSelectedSubject('All');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border shrink-0 ${
              selectedSubject === 'All'
                ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((s) => {
            const isActive = selectedSubject === s.subject;
            return (
              <button
                key={s.subject}
                onClick={() => {
                  haptic.selection();
                  setSelectedSubject(s.subject);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.subject} ({s.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Flashcard Arena */}
      <div className="flex-1 p-4 flex flex-col justify-center items-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-slate-500 space-y-2 py-20">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Loading flashcards deck...</span>
          </div>
        ) : isCompleted ? (
          /* Completion Deck Card */
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Award className="w-8 h-8 text-white" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">Deck Completed!</h2>
              <p className="text-xs text-slate-400 mt-1">You reviewed all {cards.length} cards in this session.</p>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-3 gap-2 py-3 bg-slate-800/50 rounded-2xl border border-slate-800">
              <div className="text-center">
                <span className="text-lg font-bold text-emerald-400">{stats.easy}</span>
                <span className="block text-[10px] text-slate-400">Easy</span>
              </div>
              <div className="text-center border-x border-slate-700/60">
                <span className="text-lg font-bold text-blue-400">{stats.good}</span>
                <span className="block text-[10px] text-slate-400">Good</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-rose-400">{stats.hard}</span>
                <span className="block text-[10px] text-slate-400">Hard</span>
              </div>
            </div>

            <button
              onClick={() => {
                haptic.impact('medium');
                loadDeck(selectedSubject);
              }}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              Study Next Batch
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No flashcards found for this subject.
          </div>
        ) : (
          /* 3D Flippable Card */
          <div className="w-full max-w-sm space-y-4">
            {/* Card Counter & Progress */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold text-amber-400">
                Card {currentIndex + 1} of {cards.length}
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                {currentCard.subject} {currentCard.unit ? `• ${currentCard.unit}` : ''}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800/80">
              <div
                className="bg-amber-500 h-full transition-all duration-200"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
            </div>

            {/* Flip Container */}
            <div
              onClick={handleFlip}
              className="w-full h-80 perspective-1000 cursor-pointer select-none"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between backface-hidden shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Concept / Question
                    </span>
                    <span className="text-[10px] text-slate-500">Tap to reveal</span>
                  </div>

                  <div className="text-sm font-medium text-slate-100 text-center leading-relaxed my-auto overflow-y-auto max-h-48 px-2">
                    <MathText content={currentCard.front} />
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1 hover:text-slate-300">
                      <RotateCw className="w-3 h-3" />
                      Tap card to flip
                    </span>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between rotate-y-180 backface-hidden shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Answer / Explanation
                    </span>
                    <span className="text-[10px] text-slate-500">Tap to flip back</span>
                  </div>

                  <div className="text-xs font-normal text-slate-200 text-center leading-relaxed my-auto overflow-y-auto max-h-48 px-2">
                    <MathText content={currentCard.back} />
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1 hover:text-slate-300">
                      <RotateCw className="w-3 h-3" />
                      Tap card to flip
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            {isFlipped ? (
              /* Spaced Repetition Rating Buttons */
              <div className="grid grid-cols-3 gap-2 pt-2 animate-fade-in">
                <button
                  onClick={() => handleRateCard('hard')}
                  className="py-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 font-semibold text-xs transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                >
                  <span>Hard</span>
                  <span className="text-[9px] text-rose-400/80">Soon</span>
                </button>
                <button
                  onClick={() => handleRateCard('good')}
                  className="py-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-blue-300 hover:bg-blue-900/60 font-semibold text-xs transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                >
                  <span>Good</span>
                  <span className="text-[9px] text-blue-400/80">Regular</span>
                </button>
                <button
                  onClick={() => handleRateCard('easy')}
                  className="py-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 font-semibold text-xs transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                >
                  <span>Easy</span>
                  <span className="text-[9px] text-emerald-400/80">Mastered</span>
                </button>
              </div>
            ) : (
              /* Simple Card Navigation */
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    haptic.selection();
                    setCurrentIndex((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentIndex === 0}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium text-xs disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => {
                    haptic.selection();
                    setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1));
                  }}
                  disabled={currentIndex === cards.length - 1}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium text-xs disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
