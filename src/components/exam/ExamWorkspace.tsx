/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flag, Grid, Sparkles, CheckCircle2, Bookmark, RefreshCw, Award } from 'lucide-react';
import { Question } from '@/types';
import { MathText } from '@/components/MathText';
import { AITutorDrawer } from '@/components/ai/AITutorDrawer';
import { useTelegram } from '@/hooks/useTelegram';

interface ExamWorkspaceProps {
  questions: Question[];
  title: string;
  isSimulator?: boolean;
  timeLimitMinutes?: number;
  onExit: () => void;
}

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({
  questions,
  title,
  isSimulator = false,
  timeLimitMinutes = 60,
  onExit
}) => {
  const { haptic } = useTelegram();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [savedMistakes, setSavedMistakes] = useState<Set<string>>(new Set());
  const [showGrid, setShowGrid] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes * 60);

  const currentQ = questions[currentIndex];

  // Countdown timer for exam simulator
  useEffect(() => {
    if (!isSimulator || isFinished) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          haptic.notification('warning');
          return 0;
        }
        if (prev === 300) {
          haptic.impact('heavy'); // 5-minute warning
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulator, isFinished, haptic]);

  const handleSelectOption = (letter: 'A' | 'B' | 'C' | 'D') => {
    haptic.selection();
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: letter }));

    if (!isSimulator) {
      // Practice mode instant feedback
      if (letter === currentQ.answer) {
        haptic.notification('success');
      } else {
        haptic.notification('error');
      }
    }
  };

  const toggleFlag = (idx: number) => {
    haptic.impact('light');
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSaveMistake = async (q: Question) => {
    haptic.impact('light');
    const qId = q.id;
    const isSaved = savedMistakes.has(qId);

    setSavedMistakes((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });

    if (typeof window !== 'undefined') {
      const { offlineDb } = await import('@/lib/offlineDb');
      if (offlineDb) {
        if (isSaved) {
          await offlineDb.savedQuestions.delete(qId);
        } else {
          await offlineDb.savedQuestions.put({
            id: qId,
            savedAt: new Date().toISOString(),
            question: q,
          });
        }
      }
    }
  };

  const calculateScore = useCallback(() => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        score++;
      }
    });
    return score;
  }, [questions, selectedAnswers]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isFinished) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-5 flex flex-col justify-center items-center max-w-md mx-auto animate-fade-in">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Award className="w-8 h-8 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Exam Completed!</h2>
            <p className="text-xs text-slate-400 mt-1">{title}</p>
          </div>

          {/* Score Badge */}
          <div className="py-5 px-4 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <div className="text-4xl font-black text-blue-400 tracking-tight">
              {percentage}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              You answered <span className="text-emerald-400 font-semibold">{score}</span> out of <span className="font-semibold">{questions.length}</span> questions correctly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                haptic.impact('medium');
                setIsFinished(false);
                setCurrentIndex(0);
                setSelectedAnswers({});
                setSecondsLeft(timeLimitMinutes * 60);
              }}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <RefreshCw className="w-4 h-4" />
              Retake Examination
            </button>
            <button
              onClick={() => {
                haptic.selection();
                onExit();
              }}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chosenAnswer = selectedAnswers[currentIndex];
  const isAnswered = chosenAnswer !== undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto pb-20 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            haptic.selection();
            onExit();
          }}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1 px-2">
          <h1 className="text-xs font-semibold text-slate-200 truncate">{title}</h1>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-[10px] text-blue-400 font-medium">
              Q {currentIndex + 1} of {questions.length}
            </span>
            {isSimulator && (
              <span className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${
                secondsLeft < 300 ? 'text-rose-400 animate-pulse' : 'text-slate-400'
              }`}>
                <Clock className="w-3 h-3" />
                {formatTime(secondsLeft)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            data-testid="header-save-btn"
            onClick={() => toggleSaveMistake(currentQ)}
            className={`p-2 rounded-xl transition-all ${
              savedMistakes.has(currentQ.id)
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFlag(currentIndex)}
            className={`p-2 rounded-xl transition-all ${
              flagged.has(currentIndex)
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Flag className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setShowGrid(true);
            }}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/50 h-1">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Content Arena */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Question Text */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-100 leading-relaxed">
            <MathText content={currentQ.question} />
          </div>

          {/* Diagram Image if present */}
          {currentQ.image_url && (
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 bg-black/40 flex justify-center p-2">
              <img
                src={currentQ.image_url}
                alt="Question diagram"
                className="max-h-60 object-contain rounded-lg shadow-md"
                loading="eager"
              />
            </div>
          )}
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {(['A', 'B', 'C', 'D'] as const).map((letter) => {
            const optKey = `option_${letter.toLowerCase()}` as keyof Question;
            const optText = currentQ[optKey] as string;
            if (!optText) return null;

            const isSelected = chosenAnswer === letter;
            const isCorrect = currentQ.answer === letter;

            let cardStyle = 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700';
            let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';

            if (!isSimulator && isAnswered) {
              // Practice mode reveals immediately
              if (isCorrect) {
                cardStyle = 'bg-emerald-950/40 border-emerald-500/80 text-emerald-100 shadow-md shadow-emerald-950/20';
                badgeStyle = 'bg-emerald-600 text-white border-emerald-500';
              } else if (isSelected) {
                cardStyle = 'bg-rose-950/40 border-rose-500/80 text-rose-100 shadow-md shadow-rose-950/20';
                badgeStyle = 'bg-rose-600 text-white border-rose-500';
              }
            } else if (isSelected) {
              cardStyle = 'bg-blue-950/40 border-blue-500 text-blue-100 shadow-md shadow-blue-950/20';
              badgeStyle = 'bg-blue-600 text-white border-blue-500';
            }

            return (
              <button
                key={letter}
                onClick={() => handleSelectOption(letter)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-150 flex items-start gap-3 active:scale-[0.99] ${cardStyle}`}
              >
                <span className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${badgeStyle}`}>
                  {letter}
                </span>
                <span className="text-xs pt-1 leading-relaxed">
                  <MathText content={optText} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Practice Mode Solution Card */}
        {!isSimulator && isAnswered && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Correct Answer: Option {currentQ.answer}
              </span>
              <button
                data-testid="save-question-btn"
                onClick={() => toggleSaveMistake(currentQ)}
                className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                  savedMistakes.has(currentQ.id)
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                {savedMistakes.has(currentQ.id) ? 'Saved' : 'Save'}
              </button>
            </div>
            {currentQ.explanation ? (
              <div className="text-xs text-slate-300 leading-relaxed pt-1">
                <MathText content={currentQ.explanation} />
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic pt-1">
                Tap &quot;Ask AI Tutor&quot; below for a step-by-step conceptual walkthrough.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Control Bar */}
      <footer className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3">
        <div className="flex items-center justify-between gap-2">
          {/* AI Master Tutor Trigger */}
          <button
            onClick={() => {
              haptic.impact('light');
              setShowAI(true);
            }}
            className="flex items-center gap-1.5 py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Ask AI Tutor
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                haptic.selection();
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => {
                  haptic.selection();
                  setCurrentIndex((prev) => prev + 1);
                }}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  haptic.impact('medium');
                  setIsFinished(true);
                }}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Question Matrix Grid Modal */}
      {showGrid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-sm text-slate-100">Question Matrix</h3>
              <button
                onClick={() => setShowGrid(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
              {questions.map((_, idx) => {
                const isCur = currentIndex === idx;
                const isAns = selectedAnswers[idx] !== undefined;
                const isFlg = flagged.has(idx);

                let btnStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                if (isCur) btnStyle = 'ring-2 ring-blue-500 bg-blue-600 text-white font-bold';
                else if (isFlg) btnStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold';
                else if (isAns) btnStyle = 'bg-slate-700 text-slate-100 font-medium';

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      haptic.selection();
                      setCurrentIndex(idx);
                      setShowGrid(false);
                    }}
                    className={`h-10 rounded-xl border text-xs flex items-center justify-center transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Matrix Legend */}
            <div className="flex items-center justify-around text-[10px] text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" /> Current
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/40 inline-block" /> Flagged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI Master Tutor Drawer */}
      <AITutorDrawer
        question={currentQ}
        isOpen={showAI}
        onClose={() => setShowAI(false)}
      />
    </div>
  );
};
