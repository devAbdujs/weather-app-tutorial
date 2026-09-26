'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export const getSubjectTheme = (name: string) => {
  /* Desaturated, muted subject colors — consistent with bespoke design system */
  /* Dark mode: same background opacity but softer text via opacity reduction */
  if (/math|applied|sigma/i.test(name))
    return 'text-[hsl(213,55%,42%)] dark:text-[hsl(213,50%,68%)] bg-[hsl(213,55%,42%)]/10 border border-[hsl(213,55%,42%)]/20';
  if (/physic|atom/i.test(name))
    return 'text-[hsl(268,45%,48%)] dark:text-[hsl(268,40%,70%)] bg-[hsl(268,45%,48%)]/10 border border-[hsl(268,45%,48%)]/20';
  if (/chem|flask/i.test(name))
    return 'text-[hsl(175,45%,38%)] dark:text-[hsl(175,38%,65%)] bg-[hsl(175,45%,38%)]/10 border border-[hsl(175,45%,38%)]/20';
  if (/bio|dna/i.test(name))
    return 'text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] bg-[hsl(145,42%,38%)]/10 border border-[hsl(145,42%,38%)]/20';
  if (/eng|logic|psych|brain/i.test(name))
    return 'text-[hsl(235,45%,48%)] dark:text-[hsl(235,40%,70%)] bg-[hsl(235,45%,48%)]/10 border border-[hsl(235,45%,48%)]/20';
  if (/econ|financ|coin|manage|entrepreneur/i.test(name))
    return 'text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] bg-[hsl(36,58%,42%)]/10 border border-[hsl(36,58%,42%)]/20';
  if (/hist|civic|law|scale|landmark/i.test(name))
    return 'text-[hsl(25,35%,42%)] dark:text-[hsl(25,28%,62%)] bg-[hsl(25,35%,42%)]/10 border border-[hsl(25,35%,42%)]/20';
  if (/geog|global|world|network/i.test(name))
    return 'text-[hsl(195,48%,40%)] dark:text-[hsl(195,42%,65%)] bg-[hsl(195,48%,40%)]/10 border border-[hsl(195,48%,40%)]/20';
  if (/tech|comput|soft|server|data|rocket/i.test(name))
    return 'text-[hsl(205,55%,42%)] dark:text-[hsl(205,48%,68%)] bg-[hsl(205,55%,42%)]/10 border border-[hsl(205,55%,42%)]/20';
  if (/med|nurse|health|steth|pill/i.test(name))
    return 'text-[hsl(348,48%,48%)] dark:text-[hsl(348,40%,68%)] bg-[hsl(348,48%,48%)]/10 border border-[hsl(348,48%,48%)]/20';
  return 'text-primary dark:text-primary/80 bg-primary/10 border border-primary/20';
};

const FRESHMAN_COURSES: Record<string, any[]> = {
  'Natural Science': [
    { id: 'English', Icon: BookOpen },
    { id: 'Psychology', Icon: Brain },
    { id: 'Logic', Icon: Lightbulb },
    { id: 'Mathematics for Natural Sciences', Icon: Sigma },
    { id: 'Applied Math I', Icon: Binary },
    { id: 'Civics', Icon: Landmark },
    { id: 'Physics', Icon: Atom },
    { id: 'Emerging Technology', Icon: Rocket },
    { id: 'Global Trends', Icon: Network },
    { id: 'Inclusiveness', Icon: HeartHandshake },
    { id: 'Entrepreneurship', Icon: Briefcase },
  ],
  'Social Science': [
    { id: 'English', Icon: BookOpen },
    { id: 'Psychology', Icon: Brain },
    { id: 'Logic', Icon: Lightbulb },
    { id: 'Geography', Icon: Globe },
    { id: 'Economics', Icon: TrendingUp },
    { id: 'Civics', Icon: Landmark },
    { id: 'History', Icon: ScrollText },
    { id: 'Emerging Technology', Icon: Rocket },
    { id: 'Global Trends', Icon: Network },
    { id: 'Inclusiveness', Icon: HeartHandshake },
    { id: 'Entrepreneurship', Icon: Briefcase },
    { id: 'Anthropology', Icon: Users },
  ]
};

const EUEE_SUBJECTS: Record<string, any[]> = {
  'Natural Science': [
    { id: 'Mathematics', Icon: Sigma },
    { id: 'Physics', Icon: Atom },
    { id: 'Chemistry', Icon: FlaskConical },
    { id: 'Biology', Icon: Dna },
    { id: 'English', Icon: BookOpen },
    { id: 'Scholastic Aptitude (SAT)', Icon: Brain },
    { id: 'Civics & Citizenship', Icon: Landmark },
    { id: 'Agriculture', Icon: Globe },
  ],
  'Social Science': [
    { id: 'Mathematics', Icon: Sigma },
    { id: 'English', Icon: BookOpen },
    { id: 'Scholastic Aptitude (SAT)', Icon: Brain },
    { id: 'Geography', Icon: Globe },
    { id: 'History', Icon: ScrollText },
    { id: 'Economics', Icon: TrendingUp },
    { id: 'Civics & Citizenship', Icon: Landmark },
    { id: 'Agriculture', Icon: Globe },
  ]
};
const EUEE_YEARS = [2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

const EXIT_DEPARTMENTS = [
  { id: 'Computer Science', Icon: Terminal },
  { id: 'Software Engineering', Icon: Settings2 },
  { id: 'Information Technology (IT)', Icon: Server },
  { id: 'Civil Engineering', Icon: Building2 },
  { id: 'Mechanical Engineering', Icon: Wrench },
  { id: 'Electrical and Computer Engineering', Icon: Zap },
  { id: 'Chemical Engineering', Icon: FlaskConical },
  { id: 'Water Resource Engineering', Icon: Globe },
  { id: 'Architecture and Urban Planning', Icon: Building2 },
  { id: 'Accounting and Finance', Icon: Coins },
  { id: 'Management', Icon: Briefcase },
  { id: 'Economics', Icon: TrendingUp },
  { id: 'Law', Icon: Scale },
  { id: 'Medicine', Icon: Stethoscope },
  { id: 'Nursing', Icon: Pill },
  { id: 'Pharmacy', Icon: FlaskConical },
  { id: 'Public Health Science', Icon: HeartHandshake },
  { id: 'Sociology', Icon: Users },
  { id: 'GAT (Graduate Admission Test)', Icon: Brain },
];

export const PracticeHub = () => {
  const { haptic, setBackButton } = useTelegram();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'exam';
  const profileTarget = useAppStore(s => s.userProfile?.target_exam);
  const profileStream = useAppStore(s => s.userProfile?.stream || 'Natural Science');
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
    if (mode === 'notes') {
      const p = new URLSearchParams({ examType });
      router.push(`/notes/${encodeURIComponent(params.subject)}?${p.toString()}`);
    } else if (mode === 'flashcards') {
      router.push(`/flashcards/${encodeURIComponent(params.subject)}`);
    } else {
      const p = new URLSearchParams({ examType, ...params });
      router.push(`/practice/sessions?${p.toString()}`);
    }
  };

  const examTypeLabel = () => {
    if (targetExam === 'entrance') return 'Grade 12 EUEE';
    if (targetExam === 'freshman') return 'University Freshman';
    if (targetExam === 'exit') return 'University Exit Exam';
    return 'Practice';
  };

  const pageTitle = mode === 'notes' ? 'Short Notes' : mode === 'flashcards' ? 'Flashcards' : 'Practice';
  const pageSubtitle = mode === 'notes' ? 'Choose a subject to study' : mode === 'flashcards' ? 'Swipeable concept review' : examTypeLabel();

  return (
    <div className="flex flex-col pt-safe pb-8 animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="px-5 pt-3 pb-2 mb-4">
        <h1 className="text-[28px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">
          {pageTitle}
        </h1>
        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mt-1">
          {pageSubtitle}
        </p>
      </div>

      {devMode && (
        <div className="px-5 mb-6">
          <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-[16px]">
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
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Select a course</p>
            <div className="grid grid-cols-2 gap-3">
              {(FRESHMAN_COURSES[profileStream] || FRESHMAN_COURSES['Natural Science']).map(c => (
                <button
                  key={c.id}
                  onClick={() => { haptic.selection(); navigate('freshman', { subject: c.id }); }}
                  className="group p-4 rounded-[22px] border border-black/5 dark:border-white/[0.08] bg-card hover:border-primary/30 active:scale-[0.98] transition-all text-left flex flex-col gap-3 shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${getSubjectTheme(c.id)}`}>
                    <c.Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100 leading-tight flex-1">{c.id}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ENTRANCE: subject picker ── */}
        {targetExam === 'entrance' && (
          <div className="animate-fade-in">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Select subject</p>
            <div className="grid grid-cols-2 gap-3">
              {(EUEE_SUBJECTS[profileStream] || EUEE_SUBJECTS['Natural Science']).map(c => (
                <button
                  key={c.id}
                  onClick={() => { haptic.selection(); navigate('entrance', { subject: c.id }); }}
                  className="group p-4 rounded-[22px] border border-black/5 dark:border-white/[0.08] bg-card hover:border-primary/30 active:scale-[0.98] transition-all text-left flex flex-col gap-3 shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${getSubjectTheme(c.id)}`}>
                    <c.Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100 leading-tight flex-1">{c.id}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── EXIT: department list ── */}
        {targetExam === 'exit' && (
          <div className="animate-fade-in">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Select department</p>
            <div className="bg-card rounded-[24px] border border-black/5 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col mb-10 divide-y divide-black/5 dark:divide-white/[0.05]">
              {EXIT_DEPARTMENTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { haptic.selection(); navigate('exit', { subject: d.id }); }}
                  className="w-full group bg-card p-4 active:bg-black/5 dark:active:bg-white/5 transition-colors flex items-center gap-3.5"
                >
                  <div className={`w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 ${getSubjectTheme(d.id)}`}>
                    <d.Icon className="w-4.5 h-4.5" strokeWidth={2} />
                  </div>
                  <span className="flex-1 text-[15px] font-bold text-gray-900 dark:text-gray-100 text-left">{d.id}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
