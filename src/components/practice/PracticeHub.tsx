'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { ArrowLeft, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { getSessionCounts } from '@/app/actions/practice';

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
];

const EUEE_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Scholastic Aptitude (SAT)', 'Geography', 'History', 'Economics', 'Civics & Citizenship', 'Agriculture'];
const EUEE_YEARS = [2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];
const EXIT_DEPARTMENTS = [
  'Accounting and Finance', 'Architecture and Urban Planning', 'Biology', 
  'Chemical Engineering', 'Civil Engineering', 'Computer Science', 
  'Economics', 'Electrical and Computer Engineering', 'English', 
  'Geography', 'History', 'Information Technology (IT)', 'Law', 
  'Management', 'Mechanical Engineering', 'Medicine', 'Nursing', 
  'Pharmacy', 'Physics', 'Psychology', 'Public Health Science', 
  'Sociology', 'Software Engineering', 'Water Resource Engineering'
];

export const PracticeHub = () => {
  const { haptic, setBackButton } = useTelegram();
  const router = useRouter();
  const targetExam = useAppStore(s => s.targetExam);

  // Shared State
  const [loading, setLoading] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<number | null>(null);

  // Freshman State
  const [course, setCourse] = useState(FRESHMAN_COURSES[0].id);

  // Entrance State
  const [subject, setSubject] = useState(EUEE_SUBJECTS[0]);
  const [year, setYear] = useState(EUEE_YEARS[0]);

  // Exit State
  const [dept, setDept] = useState(EXIT_DEPARTMENTS[0]);

  useEffect(() => {
    setBackButton(true, () => router.push('/'));
    return () => setBackButton(false);
  }, [router, setBackButton]);

  const cache = useRef<Map<string, number>>(new Map());

  // Fetch counts when filters change
  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      setLoading(true);
      setAvailableQuestions(null);
      let filters: any = { examType: targetExam };
      
      if (targetExam === 'freshman') {
        filters = { ...filters, subject: course };
      } else if (targetExam === 'entrance') {
        filters = { ...filters, subject, year };
      } else if (targetExam === 'exit') {
        filters = { ...filters, subject: dept };
      }
      
      const cacheKey = JSON.stringify(filters);
      if (cache.current.has(cacheKey)) {
        setAvailableQuestions(cache.current.get(cacheKey)!);
        setLoading(false);
        return;
      }

      const counts = await getSessionCounts(filters);
      
      if (active) {
        cache.current.set(cacheKey, counts);
        setAvailableQuestions(counts);
        setLoading(false);
      }
    };
    fetchCount();
    return () => { active = false; };
  }, [targetExam, course, subject, year, dept]);

  const sessionSize = useMemo(() => {
    if (targetExam === 'freshman') return 50;
    if (targetExam === 'entrance') return ['Mathematics', 'Physics', 'Scholastic Aptitude (SAT)'].includes(subject) ? 60 : 100;
    return 100;
  }, [targetExam, subject]);

  const sessions = useMemo(() => {
    if (availableQuestions === null) return [];
    if (availableQuestions === 0) return [];
    const fullSessions = Math.floor(availableQuestions / sessionSize);
    const remainder = availableQuestions % sessionSize;
    const list = Array.from({ length: fullSessions }).map((_, i) => ({ id: i + 1, count: sessionSize }));
    if (remainder > 0) list.push({ id: fullSessions + 1, count: remainder });
    // If somehow empty but we have questions
    if (list.length === 0 && availableQuestions > 0) list.push({ id: 1, count: availableQuestions });
    return list;
  }, [availableQuestions, sessionSize]);

  const handleStartSession = (sessionId: number, count: number) => {
    haptic.impact('heavy');
    // Build query params
    const params = new URLSearchParams({
      examType: targetExam,
      sessionSize: count.toString(),
      sessionOffset: ((sessionId - 1) * sessionSize).toString(),
    });
    
    if (targetExam === 'freshman') {
      params.set('subject', course);
    } else if (targetExam === 'entrance') {
      params.set('subject', subject);
      params.set('year', year.toString());
    } else if (targetExam === 'exit') {
      params.set('subject', dept);
    }

    // Pass this to ExamSessionLoader via URL
    router.push(`/exam/session?${params.toString()}`);
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
            {/* Course */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Course</label>
              <div className="grid grid-cols-2 gap-2">
                {FRESHMAN_COURSES.map(c => (
                  <button key={c.id} onClick={() => { haptic.selection(); setCourse(c.id); }}
                    className={`px-3 py-3 rounded-[16px] border-2 text-sm font-bold transition-all text-left ${course === c.id ? 'bg-primary text-card border-primary' : 'bg-card text-secondary border-black/5'}`}
                  >{c.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENTRANCE HIERARCHY */}
        {targetExam === 'entrance' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Subject</label>
              <div className="grid grid-cols-2 gap-2">
                {EUEE_SUBJECTS.map(s => (
                  <button key={s} onClick={() => { haptic.selection(); setSubject(s); }}
                    className={`px-3 py-3 rounded-[16px] border-2 text-sm font-bold transition-all text-left ${subject === s ? 'bg-primary text-card border-primary' : 'bg-card text-secondary border-black/5'}`}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Year (E.C.)</label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {EUEE_YEARS.map(y => (
                  <button key={y} onClick={() => { haptic.selection(); setYear(y); }}
                    className={`shrink-0 px-5 py-3 rounded-2xl border-2 font-bold transition-all ${year === y ? 'bg-primary text-card border-primary shadow-[0_4px_12px_rgba(27,58,107,0.2)]' : 'bg-card text-secondary border-black/5 hover:border-black/10'}`}
                  >{y}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EXIT HIERARCHY */}
        {targetExam === 'exit' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Department</label>
              <select 
                value={dept} onChange={(e) => setDept(e.target.value)}
                className="w-full p-4 border-2 border-primary/20 rounded-2xl bg-card font-bold text-primary focus:border-primary focus:outline-none"
              >
                {EXIT_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* SESSIONS SECTION */}
        <div className="mt-8 pt-8 border-t-2 border-black/5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-accent-blue" />
            <h2 className="text-xl font-black text-primary">
              {targetExam === 'entrance' ? 'Available Sessions' : 'Question Bank'}
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-primary/5 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : availableQuestions === 0 ? (
            <div className="bg-card border-2 border-dashed border-black/10 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-tertiary" />
              </div>
              <h3 className="font-bold text-primary mb-2">No questions available yet.</h3>
              <p className="text-sm font-medium text-tertiary">
                Content for this selection is coming soon. Please check back later or try another combination!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStartSession(s.id, s.count)}
                  className="w-full group bg-card p-4 rounded-2xl border-2 border-black/5 hover:border-primary/50 shadow-sm active:scale-[0.98] transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center font-black text-lg text-primary">
                      {s.id}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-primary">
                        {targetExam === 'entrance' ? `Session ${s.id}` : `Practice Part ${s.id}`}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-tertiary mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {s.count} Questions
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-ground flex items-center justify-center group-hover:bg-primary group-hover:text-card transition-colors">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
