import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Search } from 'lucide-react';
import { updateProfilePreferences } from '@/app/actions/user';
import { useTelegram } from '@/hooks/useTelegram';

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
  { id: 'Natural Science', label: 'Natural Science' },
  { id: 'Social Science',  label: 'Social Science' },
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
  const { user, haptic } = useTelegram();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [target, setTarget] = useState<string>('');
  const [stream, setStream] = useState<string>(''); // used for G12 stream and Exit discipline
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const select = (val: string, setter: (v: string) => void) => {
    haptic.selection();
    setter(val);
  };

  const goNext = () => {
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
      haptic.notification('success');
      onComplete({ target, stream: finalStream });
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      setIsSaving(false);
    }
  };

  // ── Reusable pill selector ────────────────────────────────────────────────

  const PillList = ({
    options, value, onChange,
  }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
    <div className="w-full flex flex-col gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => select(o.id, onChange)}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border text-left transition-all duration-200 ease-bespoke active:scale-[0.98] ${
            value === o.id
              ? 'border-primary/40 bg-primary/10 shadow-bespoke-sm'
              : 'border-black/[0.06] dark:border-white/[0.08] bg-card hover:border-black/20 dark:hover:border-white/20'
          }`}
        >
          <span className={`font-bold text-sm ${value === o.id ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
            {o.label}
          </span>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${value === o.id ? 'border-primary bg-primary text-white' : 'border-black/20 dark:border-white/20'}`}>
            {value === o.id && <CheckCircle2 className="w-3.5 h-3.5" />}
          </div>
        </button>
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const canProceed =
    (step === 1 && !!target) ||
    (step === 2 && !!stream) ||
    (step === 3 && !!stream);

  return (
    <div className="fixed inset-0 z-50 bg-ground flex flex-col px-6 py-12 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 flex-1">

        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button onClick={() => { haptic.impact('light'); setStep(1); setStream(''); }} className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-400 w-fit">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            onCancel ? (
              <button onClick={() => { haptic.impact('light'); onCancel(); }} className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-400 w-fit">
                <ChevronLeft className="w-4 h-4" /> Cancel
              </button>
            ) : <div />
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {[1, target === 'entrance' ? 2 : null, target === 'exit' ? 3 : null]
            .filter(Boolean)
            .map((s, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-200 ease-bespoke ${step >= (s as number) ? 'bg-primary' : 'bg-black/10 dark:bg-white/10'}`} />
            ))}
        </div>

        {/* ── Step 1: Exam Type ── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">What are you<br/>preparing for?</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">This personalizes your entire experience.</p>
            </div>
            <PillList
              options={[
                { id: 'entrance', label: 'Grade 12 EUEE (University Entrance)' },
                { id: 'freshman', label: 'University Freshman Common Courses' },
                { id: 'exit',     label: 'University Exit Exam' },
              ]}
              value={target}
              onChange={setTarget}
            />
          </>
        )}

        {/* ── Step 2: Stream ── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Your Stream</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Select your academic track to personalize your materials.</p>
            </div>
            <PillList options={G12_STREAMS} value={stream} onChange={setStream} />
          </>
        )}

        {/* ── Step 3: Exit Discipline ── */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Your Discipline</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Search and select your field of study.</p>
            </div>
            <div className="flex flex-col gap-4 mt-2 h-full min-h-[300px]">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search departments..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-sm font-bold focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-bespoke-sm"
                />
              </div>
              <div className="flex-1 overflow-y-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-2 space-y-1 bg-card">
                {EXIT_DISCIPLINES.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase())).map(d => (
                  <button
                    key={d.id}
                    onClick={() => select(d.id, setStream)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${stream === d.id ? 'bg-primary/10 text-primary' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                  >
                    {d.label}
                  </button>
                ))}
                {EXIT_DISCIPLINES.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                   <p className="text-center text-sm font-bold text-gray-400 mt-4">No departments found.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* CTA */}
        <button
          onClick={goNext}
          disabled={!canProceed || isSaving}
          className={`w-full py-4 rounded-[16px] font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ease-bespoke mt-auto ${
            canProceed && !isSaving
              ? 'bg-primary text-white shadow-bespoke-md active:scale-[0.98]'
              : 'bg-ground border border-black/[0.06] dark:border-white/[0.08] text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : step >= 2 ? 'Finish Setup' : 'Continue'}
          {!isSaving && <ChevronRight className="w-5 h-5" />}
        </button>

      </div>
    </div>
  );
};
