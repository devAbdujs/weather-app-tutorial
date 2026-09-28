'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { sounds } from '@/lib/sounds';
import { TemariMascot, MascotBubble } from '@/components/mascot/TemariMascot';
import { 
  Compass, ChevronRight, BookOpen, Brain, Lightbulb, 
  Sigma, Globe, Network, TrendingUp, Binary, Rocket, 
  Landmark, Users, HeartHandshake, Terminal, Settings2, 
  Server, Database, Building2, Wrench, Zap, Coins, 
  Briefcase, Scale, Stethoscope, Pill, FlaskConical,
  Atom, Dna, Calculator, ScrollText, Sparkles
} from 'lucide-react';

export const getSubjectTheme = (name: string) => {
  /* Bespoke semantic subject palette — automatic light/dark adaptive */
  if (/math|applied|sigma/i.test(name))
    return 'text-primary bg-primary/10 border border-primary/20';
  if (/physic|atom|logic|psych|brain/i.test(name))
    return 'text-accent-purple bg-accent-purple/10 border border-accent-purple/20';
  if (/chem|flask|bio|dna|agri/i.test(name))
    return 'text-accent-emerald bg-accent-emerald/10 border border-accent-emerald/20';
  if (/econ|financ|coin|manage|entrepreneur|hist|civic|law|scale|landmark/i.test(name))
    return 'text-accent-gold bg-accent-gold/10 border border-accent-gold/20';
  if (/geog|global|world|network|tech|comput|soft|server|data|rocket/i.test(name))
    return 'text-accent-blue bg-accent-blue/10 border border-accent-blue/20';
  if (/med|nurse|health|steth|pill/i.test(name))
    return 'text-accent-rose bg-accent-rose/10 border border-accent-rose/20';
  return 'text-primary bg-primary/10 border border-primary/20';
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
    sounds.playTap();
    haptic.selection();
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
    <div className="flex flex-col pt-safe pb-10 animate-fade-in max-w-lg mx-auto w-full">

      {/* ── PAGE HEADER ── */}
      <div className="px-5 pt-3 pb-2 mb-3">
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">
          {pageTitle}
        </h1>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">
          {pageSubtitle}
        </p>
      </div>

      {/* ── MASCOT ENCOURAGEMENT BANNER ── */}
      <div className="px-5 mb-5">
        <MascotBubble
          mood="studying"
          mascotSize={64}
          message={
            mode === 'notes' ? (
              <span>📖 Read summary notes & unlock mastery! Each set earns <span className="text-primary font-black">+15 XP</span>.</span>
            ) : mode === 'flashcards' ? (
              <span>⚡ Flip through key formulas and definitions! Complete a deck for <span className="text-primary font-black">+25 XP</span>.</span>
            ) : (
              <span>🎯 Pick a topic! Every 10 questions solved boosts your streak & earns <span className="text-primary font-black">+10 XP</span>!</span>
            )
          }
        />
      </div>

      {devMode && (
        <div className="px-5 mb-5">
          <div className="flex p-1 bg-panel border border-black/[0.08] dark:border-white/[0.08] rounded-card-sm">
            {['entrance', 'freshman', 'exit'].map(tab => (
              <button
                key={tab}
                onClick={() => { sounds.playTap(); haptic.selection(); setActiveTab(tab); }}
                className={`flex-1 py-2 text-xs font-black capitalize rounded-btn transition-all ${
                  activeTab === tab ? 'bg-primary text-white shadow-tactile-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
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
            <p className="text-caption font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">Select a course</p>
            <div className="grid grid-cols-2 gap-3">
              {(FRESHMAN_COURSES[profileStream] || FRESHMAN_COURSES['Natural Science']).map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate('freshman', { subject: c.id })}
                  className="group relative p-3.5 rounded-card btn-3d-card hover:border-primary/40 text-left flex flex-col justify-between h-32"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${getSubjectTheme(c.id)} shadow-tactile-xs`}>
                      <c.Icon className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-micro font-black px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      +10 XP
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-compact font-black text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 flex-1 pr-1">{c.id}</span>
                    <div className="w-6 h-6 rounded-full bg-ground flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ENTRANCE: subject picker ── */}
        {targetExam === 'entrance' && (
          <div className="animate-fade-in">
            <p className="text-caption font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">Select subject</p>
            <div className="grid grid-cols-2 gap-3">
              {(EUEE_SUBJECTS[profileStream] || EUEE_SUBJECTS['Natural Science']).map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate('entrance', { subject: c.id })}
                  className="group relative p-3.5 rounded-card btn-3d-card hover:border-primary/40 text-left flex flex-col justify-between h-32"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${getSubjectTheme(c.id)} shadow-tactile-xs`}>
                      <c.Icon className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-micro font-black px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      +10 XP
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-compact font-black text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 flex-1 pr-1">{c.id}</span>
                    <div className="w-6 h-6 rounded-full bg-ground flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── EXIT: department list ── */}
        {targetExam === 'exit' && (
          <div className="animate-fade-in">
            <p className="text-caption font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">Select department</p>
            <div className="flex flex-col gap-2.5 mb-10">
              {EXIT_DEPARTMENTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate('exit', { subject: d.id })}
                  className="w-full group p-3.5 rounded-card-sm btn-3d-card hover:border-primary/40 flex items-center gap-3.5 text-left"
                >
                  <div className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${getSubjectTheme(d.id)} shadow-tactile-xs`}>
                    <d.Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <span className="flex-1 text-sm font-black text-gray-900 dark:text-gray-100">{d.id}</span>
                  <span className="inline-flex items-center gap-0.5 text-micro font-black px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30 mr-1">
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    +10 XP
                  </span>
                  <div className="w-6 h-6 rounded-full bg-ground flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:text-white transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
