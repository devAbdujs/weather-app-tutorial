import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
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
  { id: 'Agriculture',                         label: 'Agriculture' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ onComplete, onCancel }) => {
  const { user, haptic } = useTelegram();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [target, setTarget] = useState<string>('');
  const [stream, setStream] = useState<string>(''); // used for G12 stream and Exit discipline
  const [isSaving, setIsSaving] = useState(false);

  const select = (val: string, setter: (v: string) => void) => {
    haptic.selection();
    setter(val);
  };

  const goNext = () => {
    haptic.impact('light');
    if (step === 1) {
      if (target === 'entrance') { setStep(2); return; } // G12 → pick stream
      if (target === 'exit')     { setStep(3); return; } // Exit → pick discipline
      handleSave(''); // Freshman → no stream needed
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
          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
            value === o.id
              ? 'border-accent-blue bg-accent-blue/5'
              : 'border-black/5 bg-card hover:border-black/10'
          }`}
        >
          <span className={`font-bold text-sm ${value === o.id ? 'text-accent-blue' : 'text-gray-900'}`}>
            {o.label}
          </span>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 ${value === o.id ? 'border-accent-blue bg-accent-blue text-white' : 'border-black/10'}`}>
            {value === o.id && <CheckCircle2 className="w-3 h-3" />}
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
            <button onClick={() => { haptic.impact('light'); setStep(1); setStream(''); }} className="flex items-center gap-1 text-sm font-bold text-gray-600 w-fit">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            onCancel ? (
              <button onClick={() => { haptic.impact('light'); onCancel(); }} className="flex items-center gap-1 text-sm font-bold text-gray-600 w-fit">
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
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${step >= (s as number) ? 'bg-accent-blue' : 'bg-black/10'}`} />
            ))}
        </div>

        {/* ── Step 1: Exam Type ── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">What are you<br/>preparing for?</h1>
              <p className="text-sm font-medium text-gray-500 mt-2">This personalizes your entire experience.</p>
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

        {/* ── Step 2: G12 Stream only ── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Stream</h1>
              <p className="text-sm font-medium text-gray-500 mt-2">You can switch subjects freely each session within your stream.</p>
            </div>
            <PillList options={G12_STREAMS} value={stream} onChange={setStream} />
          </>
        )}

        {/* ── Step 3: Exit Discipline ── */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Discipline</h1>
              <p className="text-sm font-medium text-gray-500 mt-2">Select your field of study for the Exit Exam.</p>
            </div>
            <PillList options={EXIT_DISCIPLINES} value={stream} onChange={setStream} />
          </>
        )}

        {/* CTA */}
        <button
          onClick={goNext}
          disabled={!canProceed || isSaving}
          className={`w-full py-4 rounded-[16px] border-2 font-bold text-base flex items-center justify-center gap-2 transition-all mt-auto ${
            canProceed && !isSaving
              ? 'bg-accent-blue border-primary text-white active:scale-[0.98] active:opacity-80 shadow-sm -translate-y-1'
              : 'bg-ground border-black/10 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : step === 1 && target === 'freshman' ? 'Get Started' : step >= 2 ? 'Finish Setup' : 'Continue'}
          {!isSaving && <ChevronRight className="w-5 h-5" />}
        </button>

      </div>
    </div>
  );
};
