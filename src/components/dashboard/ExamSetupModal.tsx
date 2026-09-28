"use client";
import React, { useState } from 'react';
import { X, Play, Zap, FileText } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { sounds } from '@/lib/sounds';
import { TemariMascot } from '@/components/mascot/TemariMascot';

const G12_SUBJECTS: Record<string, { id: string; label: string }[]> = {
  'Natural Science': [
    { id: 'Physics',     label: 'Physics' },
    { id: 'Chemistry',   label: 'Chemistry' },
    { id: 'Biology',     label: 'Biology' },
    { id: 'Mathematics', label: 'Mathematics' },
    { id: 'English',     label: 'English' },
    { id: 'Scholastic Aptitude (SAT)', label: 'Scholastic Aptitude (SAT)' },
    { id: 'Civics & Citizenship', label: 'Civics & Citizenship' },
    { id: 'Agriculture', label: 'Agriculture' },
  ],
  'Social Science': [
    { id: 'Geography',   label: 'Geography' },
    { id: 'History',     label: 'History' },
    { id: 'Economics',   label: 'Economics' },
    { id: 'Mathematics', label: 'Mathematics' },
    { id: 'English',     label: 'English' },
    { id: 'Scholastic Aptitude (SAT)', label: 'Scholastic Aptitude (SAT)' },
    { id: 'Civics & Citizenship', label: 'Civics & Citizenship' },
    { id: 'Agriculture', label: 'Agriculture' },
  ],
};

const FRESHMAN_COURSES: Record<string, { id: string; label: string }[]> = {
  'Natural Science': [
    { id: 'Logic',       label: 'Logic & Critical Thinking' },
    { id: 'English',     label: 'Communicative English' },
    { id: 'Psychology',  label: 'General Psychology' },
    { id: 'Mathematics for Natural Sciences', label: 'Mathematics for Natural Sciences' },
    { id: 'Applied Math I', label: 'Applied Math I' },
    { id: 'Civics',      label: 'Moral & Civics' },
    { id: 'Physics',     label: 'General Physics' },
    { id: 'Emerging Technology', label: 'Emerging Technology' },
    { id: 'Global Trends', label: 'Global Trends' },
    { id: 'Inclusiveness', label: 'Inclusiveness' },
    { id: 'Entrepreneurship', label: 'Entrepreneurship' },
  ],
  'Social Science': [
    { id: 'Logic',       label: 'Logic & Critical Thinking' },
    { id: 'English',     label: 'Communicative English' },
    { id: 'Psychology',  label: 'General Psychology' },
    { id: 'Geography',   label: 'Geography of Ethiopia' },
    { id: 'Economics',   label: 'Economics' },
    { id: 'Civics',      label: 'Moral & Civics' },
    { id: 'History',     label: 'History of Ethiopia' },
    { id: 'Emerging Technology', label: 'Emerging Technology' },
    { id: 'Global Trends', label: 'Global Trends' },
    { id: 'Inclusiveness', label: 'Inclusiveness' },
    { id: 'Entrepreneurship', label: 'Entrepreneurship' },
    { id: 'Anthropology', label: 'Social Anthropology' },
  ]
};

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
  const freshmanSubjects = FRESHMAN_COURSES[profileStream] || FRESHMAN_COURSES['Natural Science'] || [];
  const isFreshman  = targetExam === 'freshman';
  const isExit      = targetExam === 'exit';
  const isG12       = targetExam === 'entrance';

  const getDefaultSubject = () => {
    if (setupModalType === 'flashcards') return 'Biology';
    if (setupModalType === 'notes')      return 'All';
    if (isG12)      return g12Subjects[0]?.id || 'Physics';
    if (isFreshman) return freshmanSubjects[0]?.id || 'English';
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
      router.push(`/flashcards/${encodedSubject}`);
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
    flashcards: 'Speed Flashcards',
    notes:      'Study Notes',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in bg-black/40 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-t-modal sm:rounded-modal p-6 shadow-tactile-lg border border-black/[0.06] dark:border-white/[0.08] animate-sheet-up flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <TemariMascot mood="happy" size={46} />
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{titles[setupModalType]}</h2>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Configure your study session</p>
            </div>
          </div>
          <button onClick={() => { sounds.playTap(); onClose(); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-ground border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-gray-600 dark:text-gray-400">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
          {setupModalType === 'exam' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Target Exam</label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="px-4 py-3 rounded-btn bg-primary text-white font-black text-sm shadow-tactile-xs border border-primary/30 border-b-bevel border-b-black/25">
                    {resolveExamType()}
                  </div>
                </div>
              </div>

              {/* Subject Selection based on track */}
              {isG12 && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Subject</label>
                  <div className="grid grid-cols-2 gap-2">
                    {g12Subjects.map((s) => (
                      <button key={s.id} type="button" onClick={() => { sounds.playTap(); haptic.selection(); setSubject(s.id); }}
                        className={`px-3 py-2.5 rounded-btn border text-xs font-black transition-all text-left ${subject === s.id ? 'bg-primary text-white border-primary border-b-bevel border-b-black/25 shadow-tactile-xs' : 'bg-card text-gray-800 dark:text-gray-200 border-black/[0.08] dark:border-white/[0.08] border-b-bevel border-b-black/[0.14] dark:border-b-white/[0.14] hover:border-primary/40 active:translate-y-[1px]'}`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {isFreshman && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Course</label>
                  <div className="grid grid-cols-2 gap-2">
                    {freshmanSubjects.map((s) => (
                      <button key={s.id} type="button" onClick={() => { sounds.playTap(); haptic.selection(); setSubject(s.id); }}
                        className={`px-3 py-2.5 rounded-btn border text-xs font-black transition-all text-left ${subject === s.id ? 'bg-primary text-white border-primary border-b-bevel border-b-black/25 shadow-tactile-xs' : 'bg-card text-gray-800 dark:text-gray-200 border-black/[0.08] dark:border-white/[0.08] border-b-bevel border-b-black/[0.14] dark:border-b-white/[0.14] hover:border-primary/40 active:translate-y-[1px]'}`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {isExit && profileStream && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Discipline</label>
                  <div className="px-4 py-3 rounded-card-sm bg-primary/10 border-2 border-primary/20 font-black text-gray-900 dark:text-gray-100 text-sm">
                    {profileStream}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                {isG12 && (
                  <>
                    <div className="space-y-3 mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Session Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => { sounds.playTap(); haptic.selection(); setMixType('quick'); setMode('practice'); }}
                          className={`p-3.5 rounded-card-sm border text-xs font-black transition-all flex flex-col items-center text-center ${mixType === 'quick' ? 'bg-primary text-white border-primary border-b-bevel border-b-black/25 shadow-tactile-xs' : 'bg-card text-gray-800 dark:text-gray-200 border-black/[0.08] dark:border-white/[0.08] border-b-bevel border-b-black/[0.14] dark:border-b-white/[0.14] hover:border-primary/40 active:translate-y-[1px]'}`}
                        >
                          <div className="text-2xl mb-1">⚡</div>
                          <span className="text-compact font-black leading-tight">Quick Drill</span>
                          <span className={`mt-1 inline-flex items-center text-micro font-black px-2 py-0.5 rounded-full ${mixType === 'quick' ? 'bg-white/20 text-white border border-white/25' : 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'}`}>+10 XP</span>
                        </button>
                        <button type="button" onClick={() => { sounds.playTap(); haptic.selection(); setMixType('past_paper'); setMode('simulator'); }}
                          className={`p-3.5 rounded-card-sm border text-xs font-black transition-all flex flex-col items-center text-center ${mixType === 'past_paper' ? 'bg-primary text-white border-primary border-b-bevel border-b-black/25 shadow-tactile-xs' : 'bg-card text-gray-800 dark:text-gray-200 border-black/[0.08] dark:border-white/[0.08] border-b-bevel border-b-black/[0.14] dark:border-b-white/[0.14] hover:border-primary/40 active:translate-y-[1px]'}`}
                        >
                          <div className="text-2xl mb-1">🏛️</div>
                          <span className="text-compact font-black leading-tight">Past Paper</span>
                          <span className={`mt-1 inline-flex items-center text-micro font-black px-2 py-0.5 rounded-full ${mixType === 'past_paper' ? 'bg-white/20 text-white border border-white/25' : 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'}`}>+50 XP</span>
                        </button>
                      </div>
                    </div>

                    {mixType === 'past_paper' && (
                      <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Select Year (EC)</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                          {[2015, 2014, 2013, 2012, 2011, 2010].map((yr) => (
                            <button key={yr} type="button" onClick={() => { haptic.selection(); setSelectedYear(yr); }}
                              className={`shrink-0 px-4 py-2.5 rounded-control border text-sm font-bold transition-all duration-200 ease-bespoke ${selectedYear === yr ? 'bg-primary text-white border-primary shadow-tactile-sm' : 'bg-ground text-gray-700 dark:text-gray-300 border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'}`}
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
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Choose Subject</label>
                <div className="grid grid-cols-2 gap-2">
                  {(isFreshman
                    ? [{ id: 'All', label: '📚 All Mixed' }, ...freshmanSubjects]
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
                      className={`px-3 py-3 rounded-btn border text-sm font-bold transition-all duration-200 ease-bespoke text-left active:scale-[0.98] ${
                        subject === s.id
                          ? 'bg-primary text-white border-primary shadow-tactile-sm'
                          : 'bg-ground text-gray-700 dark:text-gray-300 border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-card bg-accent-gold/10 border border-accent-gold/20 flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent-gold shrink-0" />
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-relaxed">Swipe through rapid-fire question cards to master key concepts.</p>
              </div>
            </div>
          )}

          {setupModalType === 'notes' && (
            <div className="space-y-5">
              {isG12 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Subject Notes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {g12Subjects.map((s) => (
                      <button key={s.id} type="button" onClick={() => { haptic.selection(); setSubject(s.id); }}
                        className={`px-3 py-2.5 rounded-control border text-sm font-bold transition-all duration-200 ease-bespoke text-left ${subject === s.id ? 'bg-primary text-white border-primary shadow-tactile-sm' : 'bg-ground text-gray-700 dark:text-gray-300 border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'}`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {isFreshman && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Course Notes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {freshmanSubjects.map((s) => (
                      <button key={s.id} type="button" onClick={() => { haptic.selection(); setSubject(s.id); }}
                        className={`px-3 py-2.5 rounded-control border text-sm font-bold transition-all duration-200 ease-bespoke text-left ${subject === s.id ? 'bg-primary text-white border-primary shadow-tactile-sm' : 'bg-ground text-gray-700 dark:text-gray-300 border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'}`}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {isExit && profileStream && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Discipline Notes</label>
                  <div className="px-4 py-3 rounded-btn bg-primary/5 border border-primary/10 font-bold text-gray-900 dark:text-gray-100 text-sm">
                    {profileStream}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => { sounds.playTap(); handleStart(); }} 
          className="btn-3d-primary shrink-0 w-full py-4 rounded-card font-black text-base flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-white" /> Start Session
        </button>
      </div>
    </div>
  );
};
