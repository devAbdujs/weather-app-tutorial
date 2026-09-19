const fs = require('fs');

const newContent = `'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { Compass, ChevronRight } from 'lucide-react';

const FRESHMAN_COURSES = [
  { id: 'English', label: 'English' },
  { id: 'Psychology', label: 'Psychology' },
  { id: 'Logic', label: 'Logic' },
  { id: 'Mathematics for Natural Sciences', label: 'Maths_Ns' },
  { id: 'Geography', label: 'Geography' },
  { id: 'Global Trends', label: 'Global' },
  { id: 'Economics', label: 'Economics' },
  { id: 'Applied Math I', label: 'Applied Math' },
  { id: 'Emerging Technology', label: 'Emerging Tech' },
  { id: 'Civics', label: 'Civics' },
  { id: 'Anthropology', label: 'Anthropology' },
  { id: 'Inclusiveness', label: 'Inclusiveness' },
];

const EUEE_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Scholastic Aptitude (SAT)', 'Geography', 'History', 'Economics', 'Civics & Citizenship', 'Agriculture'];
const EUEE_YEARS = [2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

const EXIT_DEPARTMENTS = [
  'Computer Science', 'Software Engineering', 'Information Technology', 'Information Systems',
  'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering',
  'Accounting and Finance', 'Management', 'Economics',
  'Law', 'Medicine', 'Nursing', 'Pharmacy'
];

export const PracticeHub = () => {
  const { haptic, setBackButton } = useTelegram();
  const router = useRouter();
  const targetExam = useAppStore(s => s.userProfile?.target_exam);

  // Entrance State
  const [subject, setSubject] = useState(EUEE_SUBJECTS[0]);
  const [year, setYear] = useState(EUEE_YEARS[0]);

  // Exit State
  const [dept, setDept] = useState(EXIT_DEPARTMENTS[0]);

  useEffect(() => {
    setBackButton(true, () => router.push('/'));
    return () => setBackButton(false);
  }, [setBackButton, router]);

  const handleFreshmanSelect = (courseId: string) => {
    haptic.selection();
    const params = new URLSearchParams({ examType: 'freshman', subject: courseId });
    router.push(\`/practice/sessions?\${params.toString()}\`);
  };

  const handleExitSelect = (deptId: string) => {
    haptic.selection();
    const params = new URLSearchParams({ examType: 'exit', subject: deptId });
    router.push(\`/practice/sessions?\${params.toString()}\`);
  };

  const handleEntranceContinue = () => {
    haptic.impact('heavy');
    const params = new URLSearchParams({ examType: 'entrance', subject, year: year.toString() });
    router.push(\`/practice/sessions?\${params.toString()}\`);
  };

  return (
    <div className="min-h-screen bg-ground pb-24 text-primary">
      <header className="bg-primary text-card pt-8 pb-6 px-6 rounded-b-[32px] shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <h1 className="text-3xl font-black tracking-tight relative z-10">Practice Hub</h1>
        <p className="text-white/80 font-medium text-sm mt-1 relative z-10">
          {targetExam === 'freshman' ? 'University Freshman Exams' : targetExam === 'entrance' ? 'Grade 12 EUEE' : 'University Exit Exams'}
        </p>
      </header>

      <div className="p-6 space-y-6">
        
        {/* FRESHMAN HIERARCHY */}
        {targetExam === 'freshman' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Select Course</label>
              <div className="grid grid-cols-2 gap-3">
                {FRESHMAN_COURSES.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => handleFreshmanSelect(c.id)}
                    className="px-4 py-4 rounded-[20px] bg-card border-2 border-black/5 hover:border-primary/50 text-primary shadow-sm font-bold transition-all text-left flex flex-col justify-between h-24 active:scale-95 group"
                  >
                    <span className="text-sm leading-tight">{c.label}</span>
                    <div className="w-8 h-8 rounded-full bg-ground flex items-center justify-center self-end group-hover:bg-primary group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENTRANCE HIERARCHY */}
        {targetExam === 'entrance' && (
          <div className="space-y-6 animate-fade-in flex flex-col min-h-[60vh]">
            <div className="space-y-3">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Select Subject</label>
              <div className="grid grid-cols-2 gap-2">
                {EUEE_SUBJECTS.map(s => (
                  <button key={s} onClick={() => { haptic.selection(); setSubject(s); }}
                    className={\`px-3 py-3 rounded-[16px] border-2 text-sm font-bold transition-all text-left \${subject === s ? 'bg-primary text-card border-primary shadow-sm' : 'bg-card text-secondary border-black/5'}\`}
                  >{s}</button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Year (E.C.)</label>
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {EUEE_YEARS.map(y => (
                  <button key={y} onClick={() => { haptic.selection(); setYear(y); }}
                    className={\`shrink-0 px-5 py-3 rounded-2xl border-2 font-bold transition-all \${year === y ? 'bg-primary text-card border-primary shadow-[0_4px_12px_rgba(27,58,107,0.2)]' : 'bg-card text-secondary border-black/5 hover:border-black/10'}\`}
                  >{y}</button>
                ))}
              </div>
            </div>
            
            <div className="mt-auto pt-6">
              <button 
                onClick={handleEntranceContinue}
                className="w-full h-14 bg-primary text-white rounded-[20px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <Compass className="w-5 h-5" />
                View Available Sessions
              </button>
            </div>
          </div>
        )}

        {/* EXIT HIERARCHY */}
        {targetExam === 'exit' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Select Department</label>
              <div className="flex flex-col gap-3">
                {EXIT_DEPARTMENTS.map(d => (
                  <button 
                    key={d} 
                    onClick={() => handleExitSelect(d)}
                    className="w-full p-4 rounded-[20px] bg-card border-2 border-black/5 hover:border-primary/50 text-primary shadow-sm font-bold transition-all text-left flex items-center justify-between active:scale-95 group"
                  >
                    <span className="text-sm leading-tight">{d}</span>
                    <div className="w-8 h-8 rounded-full bg-ground flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
`;

fs.writeFileSync('/home/abdu/scraping/ethio-exam-app/src/components/practice/PracticeHub.tsx', newContent);
