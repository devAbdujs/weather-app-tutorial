'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { Compass, ChevronRight } from 'lucide-react';

const FRESHMAN_COURSES = [
  { id: 'English', emoji: '📖', color: 'bg-blue-50 border-blue-100' },
  { id: 'Psychology', emoji: '🧠', color: 'bg-violet-50 border-violet-100' },
  { id: 'Logic', emoji: '💡', color: 'bg-amber-50 border-amber-100' },
  { id: 'Mathematics for Natural Sciences', emoji: '📐', color: 'bg-emerald-50 border-emerald-100' },
  { id: 'Geography', emoji: '🌍', color: 'bg-sky-50 border-sky-100' },
  { id: 'Global Trends', emoji: '🌐', color: 'bg-teal-50 border-teal-100' },
  { id: 'Economics', emoji: '📈', color: 'bg-orange-50 border-orange-100' },
  { id: 'Applied Math I', emoji: '🔢', color: 'bg-indigo-50 border-indigo-100' },
  { id: 'Emerging Technology', emoji: '🚀', color: 'bg-rose-50 border-rose-100' },
  { id: 'Civics', emoji: '🏛️', color: 'bg-stone-50 border-stone-100' },
  { id: 'Anthropology', emoji: '🫂', color: 'bg-pink-50 border-pink-100' },
  { id: 'Inclusiveness', emoji: '🤝', color: 'bg-lime-50 border-lime-100' },
];

const EUEE_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Scholastic Aptitude (SAT)', 'Geography', 'History', 'Economics',
  'Civics & Citizenship', 'Agriculture'
];
const EUEE_YEARS = [2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

const EXIT_DEPARTMENTS = [
  { id: 'Computer Science', emoji: '💻' },
  { id: 'Software Engineering', emoji: '⚙️' },
  { id: 'Information Technology', emoji: '🖧' },
  { id: 'Information Systems', emoji: '📊' },
  { id: 'Civil Engineering', emoji: '🏗️' },
  { id: 'Mechanical Engineering', emoji: '🔧' },
  { id: 'Electrical Engineering', emoji: '⚡' },
  { id: 'Accounting and Finance', emoji: '💰' },
  { id: 'Management', emoji: '📋' },
  { id: 'Economics', emoji: '📈' },
  { id: 'Law', emoji: '⚖️' },
  { id: 'Medicine', emoji: '🩺' },
  { id: 'Nursing', emoji: '💊' },
  { id: 'Pharmacy', emoji: '🧪' },
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

  // Entrance state
  const [subject, setSubject] = useState(EUEE_SUBJECTS[0]);
  const [year, setYear] = useState(EUEE_YEARS[0]);

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
      <div className="px-5 pt-5 pb-5">
        <h1 className="text-[26px] font-black text-primary tracking-tight">Practice</h1>
        <p className="text-sm font-medium text-tertiary mt-0.5">{examTypeLabel()}</p>
      </div>

      {devMode && (
        <div className="px-5 mb-6">
          <div className="flex p-1 bg-black/5 rounded-[16px]">
            {['entrance', 'freshman', 'exit'].map(tab => (
              <button
                key={tab}
                onClick={() => { haptic.selection(); setActiveTab(tab); }}
                className={`flex-1 py-2 text-[13px] font-bold capitalize rounded-[12px] transition-all ${
                  activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-tertiary hover:text-secondary'
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
            <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-4">Select a course</p>
            <div className="grid grid-cols-2 gap-3">
              {FRESHMAN_COURSES.map(c => (
                <button
                  key={c.id}
                  onClick={() => { haptic.selection(); navigate('freshman', { subject: c.id }); }}
                  className={`group p-4 rounded-[20px] border-2 ${c.color} active:scale-95 transition-all text-left flex flex-col gap-3 shadow-sm`}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-black text-primary leading-tight flex-1">{c.id}</span>
                    <ChevronRight className="w-4 h-4 text-tertiary shrink-0 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ENTRANCE: subject + year picker ── */}
        {targetExam === 'entrance' && (
          <div className="animate-fade-in space-y-5">
            <div>
              <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3">Select subject</p>
              <div className="grid grid-cols-2 gap-2">
                {EUEE_SUBJECTS.map(s => (
                  <button
                    key={s}
                    onClick={() => { haptic.selection(); setSubject(s); }}
                    className={`px-3 py-3 rounded-[14px] border-2 text-sm font-bold transition-all text-left active:scale-95 ${
                      subject === s
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-card text-secondary border-black/5 hover:border-black/15'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3">Year (E.C.)</p>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {EUEE_YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => { haptic.selection(); setYear(y); }}
                    className={`shrink-0 px-4 py-2.5 rounded-[14px] border-2 font-bold text-sm transition-all active:scale-95 ${
                      year === y
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-card text-secondary border-black/5'
                    }`}
                  >{y}</button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { haptic.impact('heavy'); navigate('entrance', { subject, year: year.toString() }); }}
              className="w-full h-14 bg-primary text-white rounded-[20px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-[0.97] transition-all"
            >
              <Compass className="w-5 h-5" />
              View Sessions
            </button>
          </div>
        )}

        {/* ── EXIT: department list ── */}
        {targetExam === 'exit' && (
          <div className="animate-fade-in">
            <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-4">Select department</p>
            <div className="flex flex-col gap-2.5">
              {EXIT_DEPARTMENTS.map(d => (
                <button
                  key={d.id}
                  onClick={() => { haptic.selection(); navigate('exit', { subject: d.id }); }}
                  className="w-full group bg-card p-4 rounded-[20px] border-2 border-black/5 hover:border-primary/30 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4"
                >
                  <span className="text-xl w-8 text-center">{d.emoji}</span>
                  <span className="flex-1 text-sm font-bold text-primary text-left">{d.id}</span>
                  <ChevronRight className="w-4 h-4 text-tertiary group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
