import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Search, Sparkles, GraduationCap } from 'lucide-react';
import { updateProfilePreferences } from '@/app/actions/user';
import { useTelegram } from '@/hooks/useTelegram';
import { TemariMascot, MascotBubble } from '@/components/mascot/TemariMascot';
import { sounds } from '@/lib/sounds';

interface OnboardingResult {
  target: string;
  stream: string;
}

interface WelcomeOnboardingProps {
  onComplete: (result: OnboardingResult) => void;
  onCancel?: () => void;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const G12_STREAMS = [
  { id: 'Natural Science', label: 'Natural Science', desc: 'Physics, Chemistry, Biology, Math (Natural)' },
  { id: 'Social Science',  label: 'Social Science',  desc: 'Economics, Geography, History, Math (Social)' },
];

const TARGET_OPTIONS = [
  { 
    id: 'entrance', 
    title: 'Grade 12 EUEE', 
    subtitle: 'National University Entrance Exam',
    icon: '🎓',
    tag: 'High School'
  },
  { 
    id: 'freshman', 
    title: 'University Freshman', 
    subtitle: 'Remedial & Common University Courses',
    icon: '🏛️',
    tag: 'Year 1'
  },
  { 
    id: 'exit', 
    title: 'University Exit Exam', 
    subtitle: 'MoSHE Graduation Competency Test',
    icon: '⚖️',
    tag: 'Final Year'
  },
];

// For Exit Exam, "Discipline Area" IS the subject — no separate subject needed
const EXIT_DISCIPLINES = [
  { id: 'Computer Science',                    label: 'Computer Science' },
  { id: 'Software Engineering',                label: 'Software Engineering' },
  { id: 'Information Technology (IT)',         label: 'Information Technology (IT)' },
  { id: 'Electrical and Computer Engineering', label: 'Electrical & Computer Engineering' },
  { id: 'Mechanical Engineering',              label: 'Mechanical Engineering' },
  { id: 'Civil Engineering',                   label: 'Civil Engineering' },
  { id: 'Chemical Engineering',                label: 'Chemical Engineering' },
  { id: 'Water Resource Engineering',          label: 'Water Resource Engineering' },
  { id: 'Architecture and Urban Planning',     label: 'Architecture & Urban Planning' },
  { id: 'Medicine',                            label: 'Medicine' },
  { id: 'Nursing',                             label: 'Nursing' },
  { id: 'Pharmacy',                            label: 'Pharmacy' },
  { id: 'Public Health Science',               label: 'Public Health Science' },
  { id: 'Accounting and Finance',              label: 'Accounting & Finance' },
  { id: 'Management',                          label: 'Management' },
  { id: 'Economics',                           label: 'Economics' },
  { id: 'Law',                                 label: 'Law' },
  { id: 'Sociology',                           label: 'Sociology' },
  { id: 'GAT (Graduate Admission Test)',       label: 'GAT (Graduate Admission Test)' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ onComplete, onCancel }) => {
  const { haptic } = useTelegram();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [target, setTarget] = useState<string>('');
  const [stream, setStream] = useState<string>(''); // used for G12 stream and Exit discipline
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const select = (val: string, setter: (v: string) => void) => {
    sounds.playTap();
    haptic.selection();
    setter(val);
  };

  const goNext = () => {
    sounds.playTap();
    haptic.impact('light');
    if (step === 1) {
      if (target === 'entrance' || target === 'freshman') { setStep(2); return; }
      if (target === 'exit')     { setStep(3); return; }
    } else {
      handleSave(stream); // step 2 (G12 stream) or step 3 (Exit discipline)
    }
  };

  const handleSave = async (finalStream: string) => {
    setIsSaving(true);
    haptic.impact('medium');
    try {
      await updateProfilePreferences(target, finalStream);
      sounds.playCelebration();
      haptic.notification('success');
      onComplete({ target, stream: finalStream });
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      setIsSaving(false);
    }
  };

  const canProceed =
    (step === 1 && !!target) ||
    (step === 2 && !!stream) ||
    (step === 3 && !!stream);

  return (
    <div className="fixed inset-0 z-50 bg-ground flex flex-col px-5 py-8 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-md mx-auto flex flex-col gap-5 flex-1 pb-6">

        {/* Navigation & Progress Header */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={() => { sounds.playTap(); haptic.impact('light'); setStep(1); setStream(''); }} 
              className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-xl bg-card border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/5"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            onCancel ? (
              <button 
                onClick={() => { sounds.playTap(); haptic.impact('light'); onCancel(); }} 
                className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-xl bg-card border border-black/[0.08] dark:border-white/[0.08]"
              >
                <ChevronLeft className="w-4 h-4" /> Cancel
              </button>
            ) : <div />
          )}

          {/* Chunky Step Indicator */}
          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent-gold" /> Step {step} of {target === 'freshman' ? 2 : target === 'entrance' ? 2 : 2}
          </div>
        </div>

        {/* Chunky Duolingo-style Progress Bar */}
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-black/[0.06] dark:border-white/[0.08]">
          <div 
            className="h-full bg-gradient-to-r from-accent-emerald to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: step === 1 ? '45%' : '100%' }}
          />
        </div>

        {/* Mascot Speech Bubble Greeting */}
        <MascotBubble
          mood={step === 1 ? 'greeting' : step === 2 ? 'studying' : 'tutor'}
          mascotSize={64}
          message={
            step === 1 
              ? "Selam! I'm Teme 🦁 What exam are we mastering together?" 
              : step === 2 
                ? "Awesome! Which stream or track are you in?" 
                : "Great! Which discipline are you preparing for?"
          }
          subtext={
            step === 1 
              ? "I will customize your practice questions, streak challenges, and notes."
              : "I'll curate past exam papers specifically for your track."
          }
        />

        {/* ── Step 1: Exam Type ── */}
        {step === 1 && (
          <div className="flex flex-col gap-3 mt-1">
            {TARGET_OPTIONS.map((opt) => {
              const isSelected = target === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => select(opt.id, setTarget)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-100 text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10 border-b-[3px] border-b-primary shadow-xs'
                      : 'border-black/[0.08] dark:border-white/[0.08] bg-card border-b-[3px] hover:border-black/20 dark:hover:border-white/20 active:translate-y-[1px]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-ground border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {opt.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
                          {opt.title}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-slate-500 dark:text-slate-400">
                          {opt.tag}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {opt.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isSelected 
                      ? 'border-primary bg-primary text-white' 
                      : 'border-black/20 dark:border-white/20'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 2: Stream ── */}
        {step === 2 && (
          <div className="flex flex-col gap-3 mt-1">
            {G12_STREAMS.map((s) => {
              const isSelected = stream === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => select(s.id, setStream)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-100 text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10 border-b-[3px] border-b-primary shadow-xs'
                      : 'border-black/[0.08] dark:border-white/[0.08] bg-card border-b-[3px] hover:border-black/20 active:translate-y-[1px]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-ground border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-xl shrink-0">
                      {s.id === 'Natural Science' ? '🔬' : '📚'}
                    </div>
                    <div>
                      <span className={`font-black text-sm block ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
                        {s.label}
                      </span>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isSelected ? 'border-primary bg-primary text-white' : 'border-black/20 dark:border-white/20'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 3: Exit Discipline ── */}
        {step === 3 && (
          <div className="flex flex-col gap-3 mt-1 flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search your department..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-[3px] rounded-2xl text-sm font-bold focus:border-primary focus:ring-0 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex-1 max-h-[300px] overflow-y-auto rounded-2xl border border-black/[0.08] dark:border-white/[0.08] p-2 space-y-1.5 bg-card">
              {EXIT_DISCIPLINES.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase())).map(d => {
                const isSelected = stream === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => select(d.id, setStream)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black transition-all duration-100 border ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary border-b-[3px]' 
                        : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 active:translate-y-[1px]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
              {EXIT_DISCIPLINES.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                 <p className="text-center text-xs font-bold text-gray-400 py-6">No departments found.</p>
              )}
            </div>
          </div>
        )}

        {/* 3D Tactile CTA Button */}
        <button
          onClick={goNext}
          disabled={!canProceed || isSaving}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 mt-auto transition-all duration-100 ${
            canProceed && !isSaving
              ? 'btn-3d-primary shadow-bespoke-md cursor-pointer'
              : 'bg-ground border border-black/[0.08] dark:border-white/[0.08] text-slate-400 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Personalizing your journey...
            </span>
          ) : step >= 2 ? (
            <>
              <span>Let's Start Learning!</span>
              <GraduationCap className="w-5 h-5" />
            </>
          ) : (
            <>
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

      </div>
    </div>
  );
};

