'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { sounds } from '@/lib/sounds';
import { MascotBubble } from '@/components/mascot/TemariMascot';
import { 
  ChevronRight, BookOpen, Brain, Lightbulb, 
  Sigma, Globe, Network, TrendingUp, Binary, Rocket, 
  Landmark, Users, HeartHandshake, Terminal, Settings2, 
  Server, Database, Building2, Wrench, Zap, Coins, 
  Briefcase, Scale, Stethoscope, Pill, FlaskConical,
  Atom, Dna, ArrowUpRight, Star, Bookmark, Download, ScrollText
} from 'lucide-react';

export const getSubjectTheme = (name: string) => {
  if (/math|applied|sigma/i.test(name))
    return 'text-accent-purple bg-accent-purple/10 border border-accent-purple/20';
  if (/physic|atom|logic|psych|brain/i.test(name))
    return 'text-accent-gold bg-accent-gold/10 border border-accent-gold/20';
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

export const getSubjectCardStyle = (name: string) => {
  if (/math|applied|sigma|calculus/i.test(name)) {
    return {
      card: 'bg-tint-purple text-tint-purple-fg border-tint-purple-border',
      badge: 'bg-white/80 dark:bg-black/30 text-purple-900 dark:text-purple-200 border-purple-200/40',
      icon: 'text-purple-600 bg-white/70 dark:bg-black/25',
      star: '4.9',
      topics: 'Algebra, Calculus & Geometry',
    };
  }
  if (/bio|dna|life|chem|flask|agri/i.test(name)) {
    return {
      card: 'bg-tint-green text-tint-green-fg border-tint-green-border',
      badge: 'bg-white/80 dark:bg-black/30 text-emerald-950 dark:text-emerald-200 border-emerald-200/40',
      icon: 'text-emerald-600 bg-white/70 dark:bg-black/25',
      star: '4.9',
      topics: 'Genetics, Ecology & Cellular Biology',
    };
  }
  if (/physic|atom|logic|psych|brain/i.test(name)) {
    return {
      card: 'bg-tint-peach text-tint-peach-fg border-tint-peach-border',
      badge: 'bg-white/80 dark:bg-black/30 text-amber-950 dark:text-amber-200 border-amber-200/40',
      icon: 'text-amber-600 bg-white/70 dark:bg-black/25',
      star: '4.8',
      topics: 'Mechanics, Waves & Thermodynamics',
    };
  }
  if (/eng|book|lit|read|aptitude|sat/i.test(name)) {
    return {
      card: 'bg-tint-sky text-tint-sky-fg border-tint-sky-border',
      badge: 'bg-white/80 dark:bg-black/30 text-sky-950 dark:text-sky-200 border-sky-200/40',
      icon: 'text-sky-600 bg-white/70 dark:bg-black/25',
      star: '4.8',
      topics: 'Reading, Grammar & Vocabulary',
    };
  }
  if (/civic|hist|law|landmark|scroll|econ|financ|coin/i.test(name)) {
    return {
      card: 'bg-tint-rose text-tint-rose-fg border-tint-rose-border',
      badge: 'bg-white/80 dark:bg-black/30 text-rose-950 dark:text-rose-200 border-rose-200/40',
      icon: 'text-rose-600 bg-white/70 dark:bg-black/25',
      star: '4.7',
      topics: 'Constitution, History & Governance',
    };
  }
  return {
    card: 'bg-tint-cream text-tint-cream-fg border-tint-cream-border',
    badge: 'bg-white/80 dark:bg-black/30 text-stone-900 dark:text-stone-200 border-orange-200/40',
    icon: 'text-primary bg-white/70 dark:bg-black/25',
    star: '4.8',
    topics: 'Foundational Knowledge & Practice',
  };
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
    { id: 'Biology', Icon: Dna },
    { id: 'Physics', Icon: Atom },
    { id: 'Chemistry', Icon: FlaskConical },
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

  const [activeTab, setActiveTab] = useState<string>(profileTarget || 'entrance');
  const [filterMode, setFilterMode] = useState<'all' | 'saved'>('all');
  
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

  const getSubjectList = () => {
    if (targetExam === 'freshman') {
      return FRESHMAN_COURSES[profileStream] || FRESHMAN_COURSES['Natural Science'];
    }
    if (targetExam === 'exit') {
      return EXIT_DEPARTMENTS;
    }
    return EUEE_SUBJECTS[profileStream] || EUEE_SUBJECTS['Natural Science'];
  };

  const subjects = getSubjectList();

  return (
    <div className="flex flex-col pt-safe pb-28 animate-fade-in max-w-lg mx-auto w-full">

      {/* ── 1. HEADER (ui_inspiration1.png) ── */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">
            My <span className="text-primary">Library</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Track your questions and saved solutions
          </p>
        </div>
      </div>

      {/* ── 2. TOP STAT BOXES (ui_inspiration1.png) ── */}
      <div className="px-5 grid grid-cols-2 gap-3 mt-2 mb-4">
        {/* Questions Asked Box (Cyan Pastel) */}
        <div className="bg-tint-sky text-tint-sky-fg border-2 border-b-[3px] border-tint-sky-border rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="text-3xl font-black font-mono leading-none">
            32
          </div>
          <div className="text-xs font-black uppercase tracking-wider leading-tight">
            Questions<br />Asked
          </div>
        </div>

        {/* Solutions Saved Box (Peach/Amber Pastel) */}
        <div className="bg-tint-peach text-tint-peach-fg border-2 border-b-[3px] border-tint-peach-border rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
          <div className="text-3xl font-black font-mono leading-none">
            18
          </div>
          <div className="text-xs font-black uppercase tracking-wider leading-tight">
            Solutions<br />Saved
          </div>
        </div>
      </div>

      {/* ── 3. SEGMENTED TOGGLE (ui_inspiration1.png: "My Questions" / "Saved") ── */}
      <div className="px-5 mb-4">
        <div className="p-1 bg-[#F0EBE5] dark:bg-[#18202C] border-2 border-black/[0.08] dark:border-white/[0.08] rounded-full flex items-center shadow-inner">
          <button
            onClick={() => { sounds.playTap(); haptic.selection(); setFilterMode('all'); }}
            className={`
              flex-1 py-2.5 rounded-full text-xs font-black transition-all duration-150
              ${filterMode === 'all'
                ? 'bg-white dark:bg-[#10141D] text-gray-950 dark:text-white shadow-tactile-xs border border-black/[0.08] dark:border-white/[0.08]'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white font-bold'}
            `}
          >
            All Subjects
          </button>
          <button
            onClick={() => { sounds.playTap(); haptic.selection(); setFilterMode('saved'); }}
            className={`
              flex-1 py-2.5 rounded-full text-xs font-black transition-all duration-150
              ${filterMode === 'saved'
                ? 'bg-white dark:bg-[#10141D] text-gray-950 dark:text-white shadow-tactile-xs border border-black/[0.08] dark:border-white/[0.08]'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white font-bold'}
            `}
          >
            Saved &amp; Starred
          </button>
        </div>
      </div>

      {/* Dev Mode Curriculum Override */}
      {devMode && (
        <div className="px-5 mb-4">
          <div className="flex p-1 bg-panel border-2 border-black/[0.08] dark:border-white/[0.08] rounded-card-sm">
            {['entrance', 'freshman', 'exit'].map(tab => (
              <button
                key={tab}
                onClick={() => { sounds.playTap(); haptic.selection(); setActiveTab(tab); }}
                className={`flex-1 py-2 text-xs font-black capitalize rounded-btn transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-[#10141D] text-gray-950 dark:text-white shadow-tactile-xs border border-black/10' 
                    : 'text-gray-700 dark:text-gray-300 font-bold'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. COLORFUL PASTEL SUBJECT CARDS (ui_inspiration1.png) ── */}
      <div className="px-5 space-y-3.5">
        {subjects.map((c) => {
          const style = getSubjectCardStyle(c.id);

          return (
            <div
              key={c.id}
              onClick={() => navigate(targetExam || 'entrance', { subject: c.id })}
              className={`
                group relative p-5 rounded-3xl border-2 border-b-[4px] ${style.card}
                shadow-tactile-xs hover:-translate-y-0.5
                transition-all duration-150 cursor-pointer
                active:translate-y-0 active:border-b-2
                flex flex-col justify-between
              `}
            >
              {/* Top Row: White Pill Badge + Star Rating */}
              <div className="flex items-center justify-between mb-2.5">
                <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-2xs border ${style.badge}`}>
                  {c.id}
                </span>

                <div className="flex items-center gap-1 bg-white/85 dark:bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-black text-amber-700 dark:text-amber-300 border border-amber-400/30 shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{style.star}</span>
                </div>
              </div>

              {/* Middle Row: Title & Subtitle (High Contrast) */}
              <div className="my-1.5 pr-2">
                <h3 className="text-base font-black tracking-tight leading-snug">
                  {c.id} — Complete Exam Syllabus
                </h3>
                <p className="text-xs font-bold opacity-90 mt-1 line-clamp-1">
                  {style.topics}
                </p>
              </div>

              {/* Bottom Row: Status Indicator & Pure Icon Buttons (ui_inspiration1.png) */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
                <span className="flex items-center gap-1.5 text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Syllabus</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); sounds.playTap(); haptic.selection(); }}
                    aria-label="Bookmark subject"
                    title="Bookmark"
                    className="w-9 h-9 rounded-2xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 flex items-center justify-center text-gray-800 dark:text-gray-200 hover:text-primary transition-all shadow-2xs active:scale-90"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(targetExam || 'entrance', { subject: c.id }); }}
                    aria-label="Enter practice session"
                    title="Start Practice"
                    className="w-9 h-9 rounded-2xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 flex items-center justify-center text-primary hover:scale-105 transition-all shadow-2xs active:scale-90"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
