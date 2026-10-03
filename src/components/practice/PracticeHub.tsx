'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { sounds } from '@/lib/sounds';
import { safeLocalStorage } from '@/lib/safeStorage';
import { MascotBubble } from '@/components/mascot/TemariMascot';
import { 
  ChevronRight, BookOpen, Brain, Lightbulb, 
  Sigma, Globe, Network, TrendingUp, Binary, Rocket, 
  Landmark, Users, HeartHandshake, Terminal, Settings2, 
  Server, Database, Building2, Wrench, Zap, Coins, 
  Briefcase, Scale, Stethoscope, Pill, FlaskConical,
  Atom, Dna, ArrowUpRight, ArrowRight, Star, Bookmark, Download, ScrollText
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
    { id: 'Economics', Icon: TrendingUp },
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

  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam) {
      const examType = targetExam || 'entrance';
      if (mode === 'notes') {
        const p = new URLSearchParams({ examType });
        router.replace(`/notes/${encodeURIComponent(subjectParam)}?${p.toString()}`);
      } else {
        const p = new URLSearchParams({ examType, subject: subjectParam });
        router.replace(`/practice/sessions?${p.toString()}`);
      }
    }
  }, [searchParams, targetExam, mode, router]);

  const navigate = (examType: string, params: Record<string, string>) => {
    sounds.playTap();
    haptic.selection();
    if (mode === 'notes') {
      const p = new URLSearchParams({ examType });
      router.push(`/notes/${encodeURIComponent(params.subject)}?${p.toString()}`);
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

  const [savedSubjects, setSavedSubjects] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = safeLocalStorage.getItem('temari_saved_subjects');
      if (stored) setSavedSubjects(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleSave = (subjectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playTap();
    haptic.selection();
    setSavedSubjects(prev => {
      const next = prev.includes(subjectId) ? prev.filter(s => s !== subjectId) : [...prev, subjectId];
      try { safeLocalStorage.setItem('temari_saved_subjects', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const displayedSubjects = filterMode === 'saved' 
    ? subjects.filter(s => savedSubjects.includes(s.id))
    : subjects;

  return (
    <div className="flex flex-col pt-safe pb-28 animate-fade-in max-w-lg mx-auto w-full">

      {/* ── 1. CLEAN HEADER ── */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">
            Practice
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <span>{profileStream}</span>
          </p>
        </div>
      </div>

      {/* ── 2. SEGMENTED TABS (ui_inspiration1.png) ── */}
      <div className="px-5 mb-3.5">
        <div className="p-1 bg-panel border-2 border-black/[0.08] dark:border-white/[0.08] rounded-full flex items-center shadow-inner">
          <button
            onClick={() => { sounds.playTap(); haptic.selection(); setFilterMode('all'); }}
            className={`
              flex-1 py-2 rounded-full text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5
              ${filterMode === 'all'
                ? 'bg-card text-foreground shadow-tactile-xs border border-black/[0.08] dark:border-white/[0.08]'
                : 'text-muted-foreground hover:text-foreground font-bold'}
            `}
          >
            <span>All Subjects</span>
            <span className="text-micro font-mono px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10">{subjects.length}</span>
          </button>
          <button
            onClick={() => { sounds.playTap(); haptic.selection(); setFilterMode('saved'); }}
            className={`
              flex-1 py-2 rounded-full text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5
              ${filterMode === 'saved'
                ? 'bg-card text-foreground shadow-tactile-xs border border-black/[0.08] dark:border-white/[0.08]'
                : 'text-muted-foreground hover:text-foreground font-bold'}
            `}
          >
            <Star className={`w-3.5 h-3.5 ${savedSubjects.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Saved ({savedSubjects.length})</span>
          </button>
        </div>
      </div>

      {/* Dev Mode Curriculum Override */}
      {devMode && (
        <div className="px-5 mb-3.5">
          <div className="flex p-1 bg-panel border-2 border-black/[0.08] dark:border-white/[0.08] rounded-card-sm">
            {['entrance', 'freshman', 'exit'].map(tab => (
              <button
                key={tab}
                onClick={() => { sounds.playTap(); haptic.selection(); setActiveTab(tab); }}
                className={`flex-1 py-1.5 text-xs font-black capitalize rounded-btn transition-all ${
                  activeTab === tab 
                    ? 'bg-card text-foreground shadow-tactile-xs border border-black/10 dark:border-white/10' 
                    : 'text-muted-foreground font-bold'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. ICON-FIRST SUBJECT CARDS ── */}
      <div className="px-5 space-y-2.5">
        {displayedSubjects.length === 0 ? (
          <div className="card-chunky p-8 text-center space-y-2">
            <span className="text-3xl">⭐</span>
            <h3 className="text-sm font-black text-foreground">No saved subjects yet</h3>
            <p className="text-xs font-bold text-muted-foreground">Tap the star on any subject to pin it here for quick access.</p>
            <button
              onClick={() => setFilterMode('all')}
              className="text-xs font-black text-primary hover:underline pt-1 block mx-auto"
            >
              Browse all subjects
            </button>
          </div>
        ) : (
          displayedSubjects.map((c) => {
            const style = getSubjectCardStyle(c.id);
            const IconComponent = c.Icon || BookOpen;
            const isSaved = savedSubjects.includes(c.id);

            return (
              <div
                key={c.id}
                onClick={() => navigate(targetExam || 'entrance', { subject: c.id })}
                className={`
                  group relative p-4 rounded-3xl border-2 border-b-[4px] ${style.card}
                  shadow-tactile-xs hover:-translate-y-0.5
                  transition-all duration-150 cursor-pointer
                  active:translate-y-0 active:border-b-2
                  flex items-center justify-between gap-3.5
                `}
              >
                {/* Left: Prominent Subject Icon */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${style.icon} border border-current/10`}>
                    <IconComponent className="w-6 h-6 stroke-[2.4]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-black tracking-tight leading-snug truncate">
                      {c.id}
                    </h3>
                    <p className="text-xs font-bold opacity-80 truncate mt-0.5">
                      {style.topics}
                    </p>
                  </div>
                </div>

                {/* Right: Star Bookmark & Tactile Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => toggleSave(c.id, e)}
                    aria-label={isSaved ? "Remove star" : "Star subject"}
                    title={isSaved ? "Saved" : "Save subject"}
                    className="w-9 h-9 rounded-2xl bg-white/80 dark:bg-black/40 border border-current/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xs"
                  >
                    <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gray-950 text-white dark:bg-white dark:text-gray-950 border border-black/15 dark:border-white/15 flex items-center justify-center shrink-0 shadow-tactile-xs group-hover:scale-105 active:scale-95 transition-all">
                    <ArrowRight className="w-4 h-4 stroke-[2.8]" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
