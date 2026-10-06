'use client';

import React, { useState } from 'react';
import { SubdomainType } from '@/lib/subdomains';
import { AlertTriangle, Award, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';

interface ExamStoryboardProps {
  portal: SubdomainType;
}

export const ExamStoryboard: React.FC<ExamStoryboardProps> = ({ portal }) => {
  const [activeTab, setActiveTab] = useState<'entrance' | 'freshman' | 'exit'>('entrance');

  // Lock strictly to the portal when on dedicated subdomains; allow tab switching on root
  const currentTrack: 'entrance' | 'freshman' | 'exit' = portal === 'root' ? activeTab : portal;

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Root portal switcher tabs — ONLY shown when on root temari.top */}
      {portal === 'root' && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            onClick={() => setActiveTab('entrance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'entrance'
                ? 'bg-primary text-primary-foreground shadow-tactile-xs'
                : 'bg-card border border-black/10 dark:border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            🎓 Grade 12 EUEE
          </button>
          <button
            onClick={() => setActiveTab('freshman')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'freshman'
                ? 'bg-primary text-primary-foreground shadow-tactile-xs'
                : 'bg-card border border-black/10 dark:border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            🏛️ Univ. Freshman
          </button>
          <button
            onClick={() => setActiveTab('exit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'exit'
                ? 'bg-primary text-primary-foreground shadow-tactile-xs'
                : 'bg-card border border-black/10 dark:border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            🏆 Exit Exam
          </button>
        </div>
      )}

      {/* ── 1. ENTRANCE EXAM: PASS/FAIL REALITY CHECK ── */}
      {currentTrack === 'entrance' && (
        <section className="bg-card rounded-3xl p-6 sm:p-8 border border-black/[0.08] dark:border-white/[0.08] shadow-tactile-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-micro font-black uppercase tracking-widest bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                National Exam Reality Check
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Why 95% of Grade 12 Students Miss University Admission
              </h3>
              <p className="text-xs font-semibold text-muted-foreground mt-1 max-w-lg">
                Official Ministry of Education (MoE) pass rates over the last 3 academic years.
              </p>
            </div>
            <div className="shrink-0 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] text-center sm:text-right">
              <span className="text-2xl font-black text-red-500">~95%</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Missed University Cutoff</p>
            </div>
          </div>

          {/* 3-Year Pass vs Fail Bar Visual Comparison */}
          <div className="space-y-2.5 mb-6">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              National University Pass Rates (Last 3 Academic Years)
            </h4>
            
            <div className="space-y-2">
              {[
                { year: '2016 E.C. (2024)', passPct: 5.4, passCount: '36,400 passed / 670k candidates' },
                { year: '2015 E.C. (2023)', passPct: 3.2, passCount: '27,000 passed / 845k candidates' },
                { year: '2014 E.C. (2022)', passPct: 3.3, passCount: '29,600 passed / 896k candidates' },
              ].map((item) => (
                <div key={item.year} className="p-3 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
                  <div className="flex justify-between items-center text-xs font-black mb-1">
                    <span className="text-foreground">{item.year}</span>
                    <span className="text-primary font-black">{item.passPct}% Passed <span className="text-muted-foreground font-normal text-[11px]">({item.passCount})</span></span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-red-500/20 dark:bg-red-500/30 overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-end pr-1 text-[8px] font-black text-white"
                      style={{ width: `${Math.max(item.passPct, 8)}%` }}
                    >
                      {item.passPct}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Bottlenecks & Temari Solution */}
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <h5 className="font-black text-xs uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Where Students Lose Marks
              </h5>
              <div className="space-y-2">
                {[
                  { subject: 'Grade 12 Mathematics (Natural)', passRate: '18% Avg' },
                  { subject: 'Grade 11/12 Physics', passRate: '21% Avg' },
                  { subject: 'Chemistry Formulas & Organic', passRate: '27% Avg' },
                  { subject: 'Scholastic Aptitude (SAT)', passRate: '34% Avg' },
                ].map((s) => (
                  <div key={s.subject} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">{s.subject}</span>
                    <span className="font-black text-foreground bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md text-[11px]">
                      {s.passRate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-between">
              <div>
                <h5 className="font-black text-xs uppercase tracking-wider text-primary mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  How Temari Flips the Odds
                </h5>
                <ul className="text-xs font-semibold text-muted-foreground space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">✓</span>
                    <span><strong>15,000+ Past Exam Questions</strong> (2010–2018 E.C.) with full derivations.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">✓</span>
                    <span><strong>KaTeX Math Engine</strong> renders authentic paper matric equations.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">✓</span>
                    <span><strong>24/7 AI Tutor</strong> explains wrong options and formula steps.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-3 pt-2.5 border-t border-primary/20 flex items-center justify-between text-xs font-black text-primary">
                <span>Target: 500+ Top 5%</span>
                <span className="text-accent-gold">★ Free Practice</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. FRESHMAN STORYBOARD: SURVIVING SEMESTER 1 ── */}
      {currentTrack === 'freshman' && (
        <section className="bg-card rounded-3xl p-6 sm:p-8 border border-black/[0.08] dark:border-white/[0.08] shadow-tactile-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-micro font-black uppercase tracking-widest bg-accent-purple/15 text-accent-purple border border-accent-purple/30 mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                Freshman Academic Survival Storyboard
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                The University Transition: Don&apos;t Get Dropped in Semester 1
              </h3>
              <p className="text-xs font-semibold text-muted-foreground mt-1 max-w-lg">
                Freshmen at AAU, ASTU, and regional universities face fast-paced modular courses with steep grading curves.
              </p>
            </div>
            <div className="shrink-0 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] text-center sm:text-right">
              <span className="text-2xl font-black text-accent-purple">~38%</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Warning or Remedial Rate</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
            <div className="p-3 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-lg font-black text-foreground">38%</span>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Sem 1 Warning Rate</p>
            </div>
            <div className="p-3 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-lg font-black text-foreground">3.5+</span>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">CGPA for Top Depts</p>
            </div>
            <div className="p-3 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-lg font-black text-foreground">80%</span>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Midterm/Final Weight</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-8 h-8 rounded-xl bg-accent-purple/15 flex items-center justify-center font-black text-accent-purple mb-2.5 text-xs">
                1
              </div>
              <h4 className="font-black text-sm text-foreground mb-1">
                The Calculus Shock
              </h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Applied Math I causes high failure rates. Master Limits, Derivatives, and Integrals with step-by-step notes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-8 h-8 rounded-xl bg-accent-purple/15 flex items-center justify-center font-black text-accent-purple mb-2.5 text-xs">
                2
              </div>
              <h4 className="font-black text-sm text-foreground mb-1">
                Midterm &amp; Final Past Exams
              </h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Lecturers recycle exam archetypes. Practice AAU &amp; ASTU past midterms before exam day.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-8 h-8 rounded-xl bg-accent-purple/15 flex items-center justify-center font-black text-accent-purple mb-2.5 text-xs">
                3
              </div>
              <h4 className="font-black text-sm text-foreground mb-1">
                Securing Top Department
              </h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Department placement depends on freshman CGPA. Stay safely above the 3.5 cutoff.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. EXIT EXAM BENCHMARK STORYBOARD: MINISTRY OF EDUCATION CUTOFF ── */}
      {currentTrack === 'exit' && (
        <section className="bg-card rounded-3xl p-6 sm:p-8 border border-black/[0.08] dark:border-white/[0.08] shadow-tactile-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-micro font-black uppercase tracking-widest bg-accent-gold/15 text-accent-gold border border-accent-gold/30 mb-2">
                <Award className="w-3.5 h-3.5" />
                National Exit Exam Benchmark
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Pass the MoE Exit Exam to Qualify for Graduation
              </h3>
              <p className="text-xs font-semibold text-muted-foreground mt-1 max-w-lg">
                Under MoE regulations, no undergraduate degree is conferred without passing the national computer-based exit exam.
              </p>
            </div>
            <div className="shrink-0 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] text-center sm:text-right">
              <span className="text-2xl font-black text-accent-gold">50%</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mandatory Cutoff</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
            <div className="p-3 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-lg font-black text-foreground">50%</span>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Mandatory Cutoff</p>
            </div>
            <div className="p-3 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-lg font-black text-foreground">~42%</span>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">National Pass Rate</p>
            </div>
            <div className="p-3 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-lg font-black text-foreground">15</span>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Core Modules Tested</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="text-xl mb-1.5">🎯</div>
              <h4 className="font-black text-sm text-foreground mb-1">Mandatory 50% Benchmark</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Score ≥ 50% to graduate; failure delays degree conferral and career licensing.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="text-xl mb-1.5">📚</div>
              <h4 className="font-black text-sm text-foreground mb-1">15 Core Modules Tested</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Synthesizes 4 years of coursework across CS, Engineering, Law, and Health.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-ground border border-black/[0.06] dark:border-white/[0.08]">
              <div className="text-xl mb-1.5">⏱️</div>
              <h4 className="font-black text-sm text-foreground mb-1">Timed Computer Simulation</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Practice under realistic exam timers identical to the national testing platform.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
