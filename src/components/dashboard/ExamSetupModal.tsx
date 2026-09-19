"use client";
import React, { useState } from 'react';
import { X, Play, Zap, FileText } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';

const G12_SUBJECTS: Record<string, { id: string; label: string }[]> = {
  'Natural Science': [
    { id: 'Physics',     label: 'Physics' },
    { id: 'Chemistry',   label: 'Chemistry' },
    { id: 'Biology',     label: 'Biology' },
    { id: 'Mathematics', label: 'Mathematics' },
    { id: 'English',     label: 'English' },
    { id: 'Aptitude',    label: 'Aptitude / GAT' },
  ],
  'Social Science': [
    { id: 'Geography',   label: 'Geography' },
    { id: 'History',     label: 'History' },
    { id: 'Economics',   label: 'Economics' },
    { id: 'Mathematics', label: 'Mathematics' },
    { id: 'English',     label: 'English' },
    { id: 'Aptitude',    label: 'Aptitude / GAT' },
  ],
};

const FRESHMAN_COURSES = [
  { id: 'Logic',       label: 'Logic & Critical Thinking' },
  { id: 'English',     label: 'Communicative English' },
  { id: 'Psychology',  label: 'General Psychology' },
  { id: 'Mathematics for Natural Sciences', label: 'Mathematics' },
  { id: 'Geography',   label: 'Geography of Ethiopia' },
  { id: 'Economics',   label: 'Economics' },
  { id: 'Civics',      label: 'Moral & Civics' },
  { id: 'History',     label: 'History of Ethiopia' },
  { id: 'Physics',     label: 'General Physics' },
  { id: 'Emerging Technology\n', label: 'Emerging Technology' },
  { id: 'Global Trends\n', label: 'Global Trends' },
  { id: 'Inclusiveness', label: 'Inclusiveness' },
  { id: 'Entrepreneurship', label: 'Entrepreneurship' },
  { id: 'Anthropology', label: 'Social Anthropology' },
];

export const ExamSetupModal: React.FC = () => {
  const { haptic } = useTelegram();
  const router = useRouter();
  const [mode, setMode] = useState('practice');
  const [mixType, setMixType] = useState<'quick' | 'past_paper'>('quick');
  const [selectedYear, setSelectedYear] = useState<number>(2015);

  const setupModalType = useAppStore(s => s.setupModalType);
  const userProfile = useAppStore(s => s.userProfile);
  const setSetupModalType = useAppStore(s => s.setSetupModalType);

  const targetExam = userProfile?.target_exam || '';
  const profileStream = userProfile?.stream || '';

  const g12Subjects = G12_SUBJECTS[profileStream] || [];
  const isFreshman  = targetExam === 'freshman';
  const isExit      = targetExam === 'exit';
  const isG12       = targetExam === 'entrance';

  const getDefaultSubject = () => {
    if (setupModalType === 'flashcards') return 'Biology';
    if (setupModalType === 'notes')      return 'All';
    if (isG12)      return g12Subjects[0]?.id || 'Physics';
    if (isFreshman) return FRESHMAN_COURSES[0].id;
    if (isExit)     return profileStream;
    return 'Physics';
  };

  const [subject, setSubject] = useState(getDefaultSubject());
  const [stream]  = useState(profileStream);

  const resolveExamType = () => {
    if (isFreshman) return 'University Freshman';
    if (isExit)     return 'University Exit Exam';
    return 'Grade 12 EUEE';
  };

  const handleStart = () => {
    haptic.impact('heavy');
    const dbExamType = isFreshman ? 'freshman' : isExit ? 'exit' : 'entrance';
    const encodedSubject = encodeURIComponent(subject);

    if (setupModalType === 'flashcards') {
      router.push(`/notebook/${encodedSubject}`);
    } else if (setupModalType === 'notes') {
      // Pass examType so the server-side query can isolate content correctly
      router.push(`/notes/${encodedSubject}?examType=${dbExamType}`);
    } else if (setupModalType === 'exam') {
      // Bug fix: was routing to non-existent /exam/[subject]/[mode] route.
      // Correct route is /exam/session with all params as query strings.
      const params = new URLSearchParams({
        examType: dbExamType,
        subject,
        sessionSize: '50',
        sessionOffset: '0',
      });
      if (isG12 && mixType === 'past_paper' && selectedYear) {
        params.set('year', selectedYear.toString());
      }
      router.push(`/exam/session?${params.toString()}`);
    }

    setSetupModalType(null);
  };

  const onClose = () => {
    haptic.impact('light');
    setSetupModalType(null);
  };

  if (!setupModalType) return null;

  const titles = {
    exam:       'Start Practice',
    flashcards: 'My Notebook',
    notes:      'Study Notes',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in bg-black/40 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t-2 sm:border border-black/5 animate-sheet-up flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-primary leading-tight">{titles[setupModalType]}</h2>
            <p className="text-sm font-bold text-tertiary">Configure your session</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 active:scale-95 transition-all text-secondary focus-ring">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
          {setupModalType === 'exam' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Target Exam</label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="px-4 py-3 rounded-[16px] bg-primary text-card font-bold text-sm shadow-sm">
                    {resolveExamType()}
                  </div>
                </div>
              </div>

              {/* Subject Selection based on track */}
              {isG12 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Subject</label>
                  <div className="grid grid-cols-2 gap-2">
                    {g12Subjects.map((s) => (
                      <button key={s.id} type="button" onClick={() => { haptic.selection(); setSubject(s.id); }}
                        className={`px-3 py-2.5 rounded-[12px] border-2 text-sm font-bold transition-all text-left ${subject === s.id ? 'bg-primary text-card border-primary' : 'bg-card text-secondary border-black/10 hover:border-black/20'}`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {isFreshman && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Course</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FRESHMAN_COURSES.map((s) => (
                      <button key={s.id} type="button" onClick={() => { haptic.selection(); setSubject(s.id); }}
                        className={`px-3 py-2.5 rounded-[12px] border-2 text-sm font-bold transition-all text-left ${subject === s.id ? 'bg-primary text-card border-primary' : 'bg-card text-secondary border-black/10 hover:border-black/20'}`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {isExit && profileStream && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Discipline</label>
                  <div className="px-4 py-3 rounded-[14px] bg-primary/5 border border-primary/20/10 font-bold text-primary text-sm">
                    {profileStream}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                {isG12 && (
                  <>
                    <div className="space-y-3 mt-4 pt-4 border-t border-black/5">
                      <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Session Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => { haptic.selection(); setMixType('quick'); setMode('practice'); }}
                          className={`p-4 rounded-[16px] border-2 text-sm font-bold transition-all flex flex-col items-center text-center ${mixType === 'quick' ? 'bg-primary text-card border-primary shadow-sm' : 'bg-card text-secondary border-black/10'}`}
                        >
                          <div className="text-2xl mb-1">⚡</div>Quick Drill
                        </button>
                        <button type="button" onClick={() => { haptic.selection(); setMixType('past_paper'); setMode('simulator'); }}
                          className={`p-4 rounded-[16px] border-2 text-sm font-bold transition-all flex flex-col items-center text-center ${mixType === 'past_paper' ? 'bg-primary text-card border-primary shadow-sm' : 'bg-card text-secondary border-black/10'}`}
                        >
                          <div className="text-2xl mb-1">🏛️</div>Past Paper
                        </button>
                      </div>
                    </div>

                    {mixType === 'past_paper' && (
                      <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Select Year (EC)</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                          {[2015, 2014, 2013, 2012, 2011, 2010].map((yr) => (
                            <button key={yr} type="button" onClick={() => { haptic.selection(); setSelectedYear(yr); }}
                              className={`shrink-0 px-4 py-2.5 rounded-[12px] border-2 text-sm font-bold transition-all ${selectedYear === yr ? 'bg-primary text-card border-primary shadow-sm' : 'bg-card text-secondary border-black/10 hover:border-black/20'}`}
                            >{yr}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {setupModalType === 'flashcards' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Choose Subject</label>
                <div className="grid grid-cols-2 gap-2">
                  {(isFreshman
                    ? [{ id: 'All', label: '📚 All Mixed' }, ...FRESHMAN_COURSES]
                    : isExit
                    ? [{ id: profileStream, label: `📚 ${profileStream}` }]
                    : [
                        { id: 'All',         label: '📚 All Mixed' },
                        ...g12Subjects.map(s => ({ id: s.id, label: s.label })),
                      ]
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { haptic.selection(); setSubject(s.id); }}
                      className={`px-3 py-3 rounded-[14px] border-2 text-sm font-bold transition-all text-left active:scale-95 ${
                        subject === s.id
                          ? 'bg-primary text-card border-primary shadow-sm'
                          : 'bg-card text-secondary border-black/10 hover:border-black/20'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-[20px] bg-accent-amber/10 border-2 border-accent-amber/20 flex items-center gap-3">
                <Zap className="w-6 h-6 text-accent-amber shrink-0 fill-accent-amber" />
                <p className="text-xs font-bold text-primary leading-relaxed">Your saved highlights and custom pinned notes.</p>
              </div>
            </div>
          )}

          {setupModalType === 'notes' && (
            <div className="space-y-5">
              {isG12 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Subject Notes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {g12Subjects.map((s) => (
                      <button key={s.id} type="button" onClick={() => { haptic.selection(); setSubject(s.id); }}
                        className={`px-3 py-2.5 rounded-[12px] border-2 text-sm font-bold transition-all text-left ${subject === s.id ? 'bg-primary text-card border-primary' : 'bg-card text-secondary border-black/10'}`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {isFreshman && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Course Notes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FRESHMAN_COURSES.map((s) => (
                      <button key={s.id} type="button" onClick={() => { haptic.selection(); setSubject(s.id); }}
                        className={`px-3 py-2.5 rounded-[12px] border-2 text-sm font-bold transition-all text-left ${subject === s.id ? 'bg-primary text-card border-primary' : 'bg-card text-secondary border-black/10'}`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {isExit && profileStream && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-tertiary uppercase tracking-widest pl-1">Discipline Notes</label>
                  <div className="px-4 py-3 rounded-[14px] bg-primary/5 border border-primary/20/10 font-bold text-primary text-sm">
                    {profileStream}
                  </div>
                </div>
              )}


            </div>
          )}
        </div>

        <button onClick={handleStart} className="shrink-0 w-full  py-4 bg-primary text-card rounded-[16px] font-black text-lg flex items-center justify-center gap-2 focus-ring hover:opacity-90 active:scale-95 transition-all">
          <Play className="w-5 h-5 fill-card" /> Start Session
        </button>
      </div>
    </div>
  );
};
