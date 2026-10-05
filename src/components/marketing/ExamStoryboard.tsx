'use client';

import React from 'react';
import { SubdomainType } from '@/lib/subdomains';
import { AlertTriangle, TrendingUp, Award, CheckCircle2, ShieldAlert, BookOpen, Target, Zap } from 'lucide-react';

interface ExamStoryboardProps {
  portal: SubdomainType;
}

export const ExamStoryboard: React.FC<ExamStoryboardProps> = ({ portal }) => {
  const isEntrance = portal === 'entrance' || portal === 'root';
  const isFreshman = portal === 'freshman';
  const isExit = portal === 'exit';

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-10 space-y-12">
      {/* ── 1. ENTRANCE EXAM: 3-YEAR PASS/FAIL REALITY CHECK ── */}
      {isEntrance && (
        <section className="bg-card rounded-3xl p-6 sm:p-10 border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-micro font-black uppercase tracking-widest bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                National Exam Reality Check
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Why 95% of Grade 12 Students Miss University Admission
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1 max-w-xl">
                Official Ministry of Education (MoE) data reveals that university entrance is one of Ethiopia&apos;s most competitive hurdles.
              </p>
            </div>
            <div className="shrink-0 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] text-center sm:text-right">
              <span className="text-2xl font-black text-red-500">~95%</span>
              <p className="text-micro font-bold text-muted-foreground uppercase tracking-wider">Failed or Remedial Cutoff</p>
            </div>
          </div>

          {/* 3-Year Pass vs Fail Bar Visual Comparison */}
          <div className="space-y-4 mb-8">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              National University Pass Rates (Last 3 Academic Years)
            </h4>
            
            <div className="space-y-3">
              {[
                { year: '2016 E.C. (2024)', passPct: 5.4, examinees: '670,000+ candidates', passCount: '36,400 passed' },
                { year: '2015 E.C. (2023)', passPct: 3.2, examinees: '845,000+ candidates', passCount: '27,000 passed' },
                { year: '2014 E.C. (2022)', passPct: 3.3, examinees: '896,000+ candidates', passCount: '29,600 passed' },
              ].map((item) => (
                <div key={item.year} className="p-3.5 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex justify-between items-center text-xs font-black mb-1.5">
                    <span className="text-foreground">{item.year}</span>
                    <span className="text-primary font-black">{item.passPct}% Passed ({item.passCount})</span>
                  </div>
                  {/* Stacked Percentage Bar */}
                  <div className="w-full h-4 rounded-full bg-red-500/20 dark:bg-red-500/30 overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-end pr-1 text-[9px] font-black text-white"
                      style={{ width: `${Math.max(item.passPct, 8)}%` }}
                    >
                      {item.passPct}%
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mt-1">
                    <span>{item.examinees}</span>
                    <span className="text-red-600 dark:text-red-400 font-bold">{(100 - item.passPct).toFixed(1)}% scored below cutoff</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Difficulty Bottlenecks */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <h5 className="font-black text-sm text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Where Students Lose Marks
              </h5>
              <div className="space-y-2.5">
                {[
                  { subject: 'Grade 12 Mathematics (Natural)', passRate: '18% Avg', status: 'Critical' },
                  { subject: 'Grade 11/12 Physics', passRate: '21% Avg', status: 'High Trap' },
                  { subject: 'Chemistry Formula & Organic', passRate: '27% Avg', status: 'High Trap' },
                  { subject: 'Scholastic Aptitude (SAT)', passRate: '34% Avg', status: 'Time Pressure' },
                ].map((s) => (
                  <div key={s.subject} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">{s.subject}</span>
                    <span className="font-black text-foreground bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">
                      {s.passRate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-between">
              <div>
                <h5 className="font-black text-sm text-primary mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  How Temari Flips the Odds
                </h5>
                <ul className="text-xs font-semibold text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span><strong>15,000+ Past Exam Questions</strong> spanning 2010 to 2018 E.C. with complete step-by-step math derivations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span><strong>KaTeX Math Engine</strong> renders authentic exam equations identically to the paper matric.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span><strong>24/7 AI Tutor</strong> explains tricky options and why common distractors are incorrect.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between text-xs font-black text-primary">
                <span>Target: 500+ Top 5% Score</span>
                <span className="text-accent-gold flex items-center gap-1">★ Free Practice</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. FRESHMAN STORYBOARD: SURVIVING SEMESTER 1 ── */}
      {(isFreshman || isEntrance) && (
        <section className="bg-card rounded-3xl p-6 sm:p-10 border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-micro font-black uppercase tracking-widest bg-accent-purple/15 text-accent-purple border border-accent-purple/30 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Freshman Academic Survival Storyboard
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
            The University Transition: Don&apos;t Get Dropped in Semester 1
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground max-w-2xl mb-8">
            Every year, Ethiopian public university freshmen (AAU, ASTU, AASTU, regional institutes) face high-paced modular semesters with steep calculus and physics grading curves.
          </p>

          <div className="grid sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/15 flex items-center justify-center font-black text-accent-purple mb-3">
                1
              </div>
              <h4 className="font-black text-base text-foreground mb-1">
                The Calculus Shock
              </h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Applied Math I has a 40%+ D/F rate across engineering faculties. Temari provides concise summary notes for Limits, Derivatives, and Integrals with solved examples.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/15 flex items-center justify-center font-black text-accent-purple mb-3">
                2
              </div>
              <h4 className="font-black text-base text-foreground mb-1">
                Midterm &amp; Final Past Exams
              </h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Lecturers recycle classic question archetypes. Practicing AAU &amp; ASTU past midterm papers prepares you for actual university exam traps before test day.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/15 flex items-center justify-center font-black text-accent-purple mb-3">
                3
              </div>
              <h4 className="font-black text-base text-foreground mb-1">
                Securing Top Department
              </h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Department placement (Software Engineering, Medicine, Civil) depends on freshman CGPA. Temari study notes and quizzes keep you safely above the 3.5 cutoff.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. EXIT EXAM BENCHMARK STORYBOARD: MINISTRY OF EDUCATION CUTOFF ── */}
      {(isExit || isEntrance) && (
        <section className="bg-card rounded-3xl p-6 sm:p-10 border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-micro font-black uppercase tracking-widest bg-accent-gold/15 text-accent-gold border border-accent-gold/30 mb-2">
            <Award className="w-3.5 h-3.5" />
            National Exit Exam Benchmark
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
            Pass the MoE Exit Exam to Qualify for Graduation
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground max-w-2xl mb-8">
            Under Ethiopian Ministry of Education regulations, no undergraduate degree or transcript is conferred without passing the comprehensive national computer-based exit exam.
          </p>

          <div className="grid sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-black text-base text-foreground mb-1">Mandatory 50% Benchmark</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Strict binary outcome: score ≥ 50% to graduate, or face re-examination delaying employment and degree certification.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="text-2xl mb-2">📚</div>
              <h4 className="font-black text-base text-foreground mb-1">15 Core Modules Tested</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Comprehensive curriculum synthesis covering 4 years of university coursework in Software Eng, Accounting, Law, Health, and Electrical.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="text-2xl mb-2">⏱️</div>
              <h4 className="font-black text-base text-foreground mb-1">Timed Computer Simulation</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Experience full-length timed mock exams identical to the national online testing platform, with automatic diagnostic scoring.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
