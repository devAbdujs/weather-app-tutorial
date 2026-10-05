'use client';

import React, { useState } from 'react';
import { SubdomainType } from '@/lib/subdomains';
import { Sparkles, Clock, CheckCircle2, ChevronRight, Zap, BookOpen, Layers } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface MobileDeviceMockupProps {
  portal: SubdomainType;
}

export const MobileDeviceMockup: React.FC<MobileDeviceMockupProps> = ({ portal }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const isEntrance = portal === 'entrance' || portal === 'root';
  const isFreshman = portal === 'freshman';
  const isExit = portal === 'exit';

  const handleSelectOption = (idx: number, isCorrect: boolean) => {
    sounds.playTap();
    setSelectedOption(idx);
    if (isCorrect) {
      sounds.playCorrect();
    }
    setShowExplanation(true);
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none">
      {/* Device Outer Chassis */}
      <div className="relative rounded-[44px] p-3.5 bg-slate-900 border-[7px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10 overflow-hidden">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30 flex items-center justify-between px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800" />
          <div className="w-2 h-2 rounded-full bg-blue-900/60" />
        </div>

        {/* Screen Bezel & Display */}
        <div className="relative bg-ground text-foreground rounded-[34px] overflow-hidden border border-black/5 dark:border-white/10 min-h-[500px] flex flex-col justify-between">
          {/* Top Status Bar */}
          <div className="pt-2 px-5 pb-1 flex justify-between items-center text-[11px] font-black text-slate-500 tracking-wider">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-5 h-2.5 border border-slate-500 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-slate-500 rounded-xs" />
              </div>
            </div>
          </div>

          {/* Subdomain-Specific Interactive Screen */}
          <div className="p-4 flex-1 flex flex-col justify-between pt-3">
            {isEntrance && (
              <div className="space-y-3">
                {/* Exam Sub-header */}
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">⚛️</span>
                    <span className="text-xs font-black text-foreground">EUEE Physics · 2016</span>
                  </div>
                  <span className="text-micro font-black px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> 24:15
                  </span>
                </div>

                {/* Question Pill */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    Question 14 of 50
                  </span>
                  <span className="text-[11px] font-black text-accent-gold flex items-center gap-0.5">
                    <Zap className="w-3 h-3 fill-current" /> +10 XP
                  </span>
                </div>

                {/* Question Card */}
                <div className="p-3 rounded-2xl bg-card border border-black/[0.06] dark:border-white/[0.08] shadow-sm text-xs font-bold leading-relaxed text-foreground">
                  A car accelerates uniformly from rest to 20 m/s in 5.0 seconds along a straight highway. What is the total displacement?
                </div>

                {/* Options */}
                <div className="space-y-1.5">
                  {[
                    { letter: 'A', text: '100 m', correct: false },
                    { letter: 'B', text: '50 m', correct: true },
                    { letter: 'C', text: '25 m', correct: false },
                    { letter: 'D', text: '4 m', correct: false },
                  ].map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const isCorrect = opt.correct;
                    let btnStyle = 'bg-card border-black/[0.08] dark:border-white/[0.08] text-foreground hover:border-primary/50';

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400 font-bold';
                      }
                    }

                    return (
                      <button
                        key={opt.letter}
                        onClick={() => handleSelectOption(i, isCorrect)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all active:scale-[0.98] ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center font-black text-[10px]">
                            {opt.letter}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {selectedOption !== null && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive AI Explanation Drawer */}
                {showExplanation && (
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] leading-relaxed animate-fade-in">
                    <div className="flex items-center gap-1 font-black text-primary mb-1">
                      <Sparkles className="w-3 h-3 text-accent-gold" />
                      <span>AI Tutor Breakdown</span>
                    </div>
                    <p className="text-muted-foreground font-semibold">
                      s = ½(v₀ + v)·t = ½(0 + 20)·5 = <strong className="text-foreground">50 m</strong>. Option B is correct!
                    </p>
                  </div>
                )}
              </div>
            )}

            {isFreshman && (
              <div className="space-y-3">
                {/* Freshman Header */}
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">📐</span>
                    <span className="text-xs font-black text-foreground">Applied Math I · Limits</span>
                  </div>
                  <span className="text-micro font-black px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5" /> High Yield
                  </span>
                </div>

                {/* Shortnote Concept Card */}
                <div className="p-3 rounded-2xl bg-card border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-2">
                  <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                    Theorem: Special Trigonometric Limit
                  </span>
                  <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-center font-mono font-black text-xs text-foreground">
                    lim(x → 0) [sin(x) / x] = 1
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    Essential for university midterm exams. Directly used to derive derivatives of trigonometric functions.
                  </p>
                </div>

                {/* Quick Check */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                    Quick Self-Check Drill:
                  </span>
                  <div className="text-xs font-bold text-foreground">
                    What is lim(x → 0) [(1 - cos x) / x]?
                  </div>
                  {[
                    { letter: 'A', text: '1', correct: false },
                    { letter: 'B', text: '0', correct: true },
                    { letter: 'C', text: 'Undefined', correct: false },
                  ].map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const isCorrect = opt.correct;
                    let btnStyle = 'bg-card border-black/[0.08] dark:border-white/[0.08] text-foreground hover:border-primary/50';

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400 font-bold';
                      }
                    }

                    return (
                      <button
                        key={opt.letter}
                        onClick={() => handleSelectOption(i, isCorrect)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all active:scale-[0.98] ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center font-black text-[10px]">
                            {opt.letter}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {selectedOption !== null && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {showExplanation && (
                  <div className="p-2.5 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-[11px] leading-relaxed animate-fade-in">
                    <p className="text-muted-foreground font-semibold">
                      Multiply top & bottom by (1 + cos x) to get sin²x / [x(1 + cos x)] = 1 · 0/2 = <strong className="text-foreground">0</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {isExit && (
              <div className="space-y-3">
                {/* Exit Exam Header */}
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🏆</span>
                    <span className="text-xs font-black text-foreground">MoE Exit Exam · CS/IT</span>
                  </div>
                  <span className="text-micro font-black px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5" /> 50% Cutoff
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    Database Systems Module
                  </span>
                  <span className="text-[11px] font-black text-emerald-500">Benchmark Ready</span>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-black/[0.06] dark:border-white/[0.08] shadow-sm text-xs font-bold leading-relaxed text-foreground">
                  Which normal form specifically addresses and removes transitive dependencies in relational database schemas?
                </div>

                <div className="space-y-1.5">
                  {[
                    { letter: 'A', text: 'First Normal Form (1NF)', correct: false },
                    { letter: 'B', text: 'Second Normal Form (2NF)', correct: false },
                    { letter: 'C', text: 'Third Normal Form (3NF)', correct: true },
                    { letter: 'D', text: 'Boyce-Codd (BCNF)', correct: false },
                  ].map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const isCorrect = opt.correct;
                    let btnStyle = 'bg-card border-black/[0.08] dark:border-white/[0.08] text-foreground hover:border-primary/50';

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400 font-bold';
                      }
                    }

                    return (
                      <button
                        key={opt.letter}
                        onClick={() => handleSelectOption(i, isCorrect)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all active:scale-[0.98] ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center font-black text-[10px]">
                            {opt.letter}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {selectedOption !== null && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {showExplanation && (
                  <div className="p-2.5 rounded-xl bg-accent-gold/10 border border-accent-gold/20 text-[11px] leading-relaxed animate-fade-in">
                    <p className="text-muted-foreground font-semibold">
                      <strong className="text-foreground">3NF</strong> requires relations to be in 2NF and have NO transitive functional dependencies.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom App Bar Simulation */}
            <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-around text-slate-400 text-micro font-bold">
              <span className="text-primary font-black flex items-center gap-1">
                ● Practice
              </span>
              <span>Notes</span>
              <span>AI Tutor</span>
              <span>Profile</span>
            </div>
          </div>

          {/* Bottom Home Indicator */}
          <div className="pb-2 pt-1 flex justify-center">
            <div className="w-28 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
