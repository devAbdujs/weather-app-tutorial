'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { 
  Compass, ChevronRight, BookOpen, Brain, Lightbulb, 
  Sigma, Globe, Network, TrendingUp, Binary, Rocket, 
  Landmark, Users, HeartHandshake, Terminal, Settings2, 
  Server, Database, Building2, Wrench, Zap, Coins, 
  Briefcase, Scale, Stethoscope, Pill, FlaskConical,
  Atom, Dna, Calculator, ScrollText
} from 'lucide-react';

const FRESHMAN_COURSES = [
  { id: 'English', Icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  { id: 'Psychology', Icon: Brain, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30' },
  { id: 'Logic', Icon: Lightbulb, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  { id: 'Mathematics for Natural Sciences', Icon: Sigma, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  { id: 'Geography', Icon: Globe, color: 'text-sky-600 bg-sky-50' },
  { id: 'Global Trends', Icon: Network, color: 'text-teal-600 bg-teal-50' },
  { id: 'Economics', Icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
  { id: 'Applied Math I', Icon: Binary, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'Emerging Technology', Icon: Rocket, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
  { id: 'Civics', Icon: Landmark, color: 'text-stone-600 bg-stone-100' },
  { id: 'Anthropology', Icon: Users, color: 'text-pink-600 bg-pink-50' },
  { id: 'Inclusiveness', Icon: HeartHandshake, color: 'text-lime-600 bg-lime-50' },
];

const EUEE_SUBJECTS = [
  { id: 'Mathematics', Icon: Sigma, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  { id: 'Physics', Icon: Atom, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  { id: 'Chemistry', Icon: FlaskConical, color: 'text-fuchsia-600 bg-fuchsia-50' },
  { id: 'Biology', Icon: Dna, color: 'text-green-600 bg-green-50' },
  { id: 'English', Icon: BookOpen, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
  { id: 'Scholastic Aptitude (SAT)', Icon: Brain, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30' },
  { id: 'Geography', Icon: Globe, color: 'text-sky-600 bg-sky-50' },
  { id: 'History', Icon: ScrollText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  { id: 'Economics', Icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
  { id: 'Civics & Citizenship', Icon: Landmark, color: 'text-stone-600 bg-stone-100' },
];
const EUEE_YEARS = [2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

const EXIT_DEPARTMENTS = [
  { id: 'Computer Science', Icon: Terminal, color: 'text-indigo-500 bg-indigo-50' },
  { id: 'Software Engineering', Icon: Settings2, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
  { id: 'Information Technology', Icon: Server, color: 'text-cyan-500 bg-cyan-50' },
  { id: 'Information Systems', Icon: Database, color: 'text-teal-500 bg-teal-50' },
  { id: 'Civil Engineering', Icon: Building2, color: 'text-orange-500 bg-orange-50' },
  { id: 'Mechanical Engineering', Icon: Wrench, color: 'text-slate-500 bg-slate-100' },
  { id: 'Electrical Engineering', Icon: Zap, color: 'text-yellow-500 bg-yellow-50' },
  { id: 'Accounting and Finance', Icon: Coins, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
  { id: 'Management', Icon: Briefcase, color: 'text-sky-500 bg-sky-50' },
  { id: 'Economics', Icon: TrendingUp, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
  { id: 'Law', Icon: Scale, color: 'text-stone-600 bg-stone-100' },
  { id: 'Medicine', Icon: Stethoscope, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' },
  { id: 'Nursing', Icon: Pill, color: 'text-pink-500 bg-pink-50' },
  { id: 'Pharmacy', Icon: FlaskConical, color: 'text-fuchsia-500 bg-fuchsia-50' },
];

export const PracticeHub = () => {
  const { haptic, setBackButton } = useTelegram();
  const router = useRouter();
  const profileTarget = useAppStore(s => s.userProfile?.target_exam);
  const devMode = useAppStore(s => s.devMode);

  // If devMode is true, we allow overriding. Otherwise lock to profile.
  const [activeTab, setActiveTab] = useState<string>(profileTarget || 'entrance');
  
  // Ensure we sync if profileTarget loads late or changes, but don't force it if in devMode
  useEffect(() => {
    if (!devMode && profileTarget) {
      setActiveTab(profileTarget);
    }
  }, [profileTarget, devMode]);

  const targetExam = devMode ? activeTab : profileTarget;


  useEffect(() => {
    setBackButton(false);
  }, [setBackButton]);

  const navigate = (examType: string, params: Record<string, string>) => {
    const p = new URLSearchParams({ examType, ...params });
    router.push(`/practice/sessions?${p.toString()}`);
  };

  const examTypeLabel = () => {
    if (targetExam === 'entrance') return 'Grade 12 EUEE';
    if (targetExam === 'freshman') return 'University Freshman';
    if (targetExam === 'exit') return 'University Exit Exam';
    return 'Practice';
  };

  return (
    <div className="flex flex-col pt-safe pb-8 animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="sticky top-0 z-10 bg-ground/90 dark:bg-ground/95 backdrop-blur-xl border-b border-black/5 dark:border-white/8 px-5 pt-safe pt-5 pb-4 mb-5">
        <h1 className="text-[28px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">Practice</h1>
        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mt-1">{examTypeLabel()}</p>
      </div>

      {devMode && (
        <div className="px-5 mb-6">
          <div className="flex p-1 bg-black/5 dark:bg-white dark:bg-card/5 rounded-[16px]">
            {['entrance', 'freshman', 'exit'].map(tab => (
              <button
                key={tab}
                onClick={() => { haptic.selection(); setActiveTab(tab); }}
                className={`flex-1 py-2 text-[13px] font-bold capitalize rounded-[12px] transition-all ${
                  activeTab === tab ? 'bg-white dark:bg-card text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-5">

        {/* ── FRESHMAN: course grid ── */}
        {targetExam === 'freshman' && (
          <div className="animate-fade-in">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Select a course</p>
            <div className="grid grid-cols-2 gap-3">
              {FRESHMAN_COURSES.map(c => (
                <button
                  key={c.id}
                  onClick={() => { haptic.selection(); navigate('freshman', { subject: c.id }); }}
                  className="group p-4 rounded-[20px] border border-black/5 dark:border-white/8 bg-card hover:border-primary/30 active:scale-[0.98] active:opacity-80 transition-all text-left flex flex-col gap-3 shadow-sm"
                >
                  <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${c.color}`}>
                    <c.Icon className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100 leading-tight flex-1">{c.id}</span>
                    <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ENTRANCE: subject picker ── */}
        {targetExam === 'entrance' && (
          <div className="animate-fade-in">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Select subject</p>
            <div className="grid grid-cols-2 gap-3">
              {EUEE_SUBJECTS.map(c => (
                <button
                  key={c.id}
                  onClick={() => { haptic.selection(); navigate('entrance', { subject: c.id }); }}
                  className="group p-4 rounded-[20px] border border-black/5 dark:border-white/8 bg-card hover:border-primary/30 active:scale-[0.98] active:opacity-80 transition-all text-left flex flex-col gap-3 shadow-sm"
                >
                  <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${c.color}`}>
                    <c.Icon className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100 leading-tight flex-1">{c.id}</span>
                    <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── EXIT: department list ── */}
        {targetExam === 'exit' && (
          <div className="animate-fade-in">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-2">Select department</p>
            <div className="bg-card rounded-[24px] border border-black/5 dark:border-white/8 shadow-sm overflow-hidden flex flex-col mb-10">
              {EXIT_DEPARTMENTS.map((d, index) => (
                <React.Fragment key={d.id}>
                  <button
                    onClick={() => { haptic.selection(); navigate('exit', { subject: d.id }); }}
                    className="w-full group bg-card p-4 active:bg-black/5 dark:bg-white dark:bg-card/5 transition-colors flex items-center gap-4"
                  >
                    <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${d.color}`}>
                      <d.Icon className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-[15px] font-bold text-gray-900 dark:text-gray-100 text-left">{d.id}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors shrink-0" />
                  </button>
                  {index < EXIT_DEPARTMENTS.length - 1 && (
                    <div className="h-[1px] bg-black/5 dark:bg-white dark:bg-card/5 ml-16" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
