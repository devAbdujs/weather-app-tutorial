'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, Sparkles, List, Pin, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { StudyNote } from '@/types';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const AITutorDrawer = dynamic(() => import('@/components/ai/AITutorDrawer').then(m => m.AITutorDrawer), { ssr: false });
const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer'), { ssr: false, loading: () => <div className="animate-pulse h-32 bg-black/5 rounded-xl" /> });

interface StudyNotesViewProps {
  subject: string;
  examType: string;
  initialNotes: StudyNote[];
}

// Maps subject names to emoji for visual identity on chapter cards
const SUBJECT_EMOJI: Record<string, string> = {
  'Mathematics': '📐', 'Physics': '⚛️', 'Chemistry': '🧪', 'Biology': '🧬',
  'Economics': '📈', 'History': '📜', 'Geography': '🌍', 'English': '📝',
  'Logic': '🧠', 'Civics': '⚖️', 'Psychology': '💡', 'Computer Science': '💻',
  'Software Engineering': '🖥️', 'Emerging Technology': '🚀', 'Aptitude': '🎯',
};



const SUBJECT_BG_COLOR: Record<string, string> = {
  'Mathematics':         'bg-blue-50',
  'Physics':             'bg-violet-50',
  'Chemistry':           'bg-emerald-50',
  'Biology':             'bg-green-50',
  'Economics':           'bg-amber-50',
  'History':             'bg-orange-50',
  'Geography':           'bg-teal-50',
  'English':             'bg-sky-50',
  'Logic':               'bg-indigo-50',
  'Civics':              'bg-rose-50',
  'Psychology':          'bg-purple-50',
  'Computer Science':    'bg-cyan-50',
  'Software Engineering':'bg-blue-50',
  'Emerging Technology': 'bg-fuchsia-50',
  'Aptitude':            'bg-yellow-50',
};

const ReadingProgress = ({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement> }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const totalHeight = scrollHeight - clientHeight;
        setProgress(totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0);
      }
    };
    const elem = scrollRef.current;
    if (elem) { elem.addEventListener('scroll', handleScroll); handleScroll(); }
    return () => { if (elem) elem.removeEventListener('scroll', handleScroll); };
  }, [scrollRef]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-150 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const StudyNotesView: React.FC<StudyNotesViewProps> = ({ subject, examType, initialNotes }) => {
  const router = useRouter();
  const { user, haptic, setBackButton } = useTelegram();
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [showTutor, setShowTutor] = useState(false);

  const [selectedText, setSelectedText] = useState('');
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const dept = subject && subject !== 'All' ? subject : 'General';
  const accentBar = 'bg-primary';
  const accentText = 'text-primary';
  const accentBg = 'bg-primary/5';
  const emoji       = SUBJECT_EMOJI[dept]     ?? '📚';

  const handleBackFromNote = useCallback(() => {
    setSelectedNote(null);
    setShowTutor(false);
    haptic.impact('light');
  }, [haptic]);

  useEffect(() => {
    if (selectedNote) setBackButton(true, handleBackFromNote);
    else              setBackButton(true, () => router.push('/'));
  }, [selectedNote, setBackButton, router, handleBackFromNote]);

  // Text selection → Pin to Notebook
  useEffect(() => {
    if (!selectedNote) return;
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 5) {
        const text = selection.toString().trim();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const container = document.getElementById('note-content');
        if (container && container.contains(selection.anchorNode)) {
          setSelectedText(text);
          setSelectionRect({ top: rect.top - 54, left: rect.left + rect.width / 2 });
        } else {
          setSelectionRect(null); setSelectedText('');
        }
      } else {
        setTimeout(() => {
          if (!window.getSelection()?.toString().trim()) {
            setSelectionRect(null); setSelectedText('');
          }
        }, 100);
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [selectedNote]);

  const savePin = async () => {
    if (!user?.id || !selectedText) return;
    haptic.impact('medium');
    setIsPinning(true);
    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject || 'General',
          chapter_title: selectedNote?.title,
          content: selectedText,
        }),
      });
      if (res.ok) {
        haptic.notification('success');
        setPinSuccess(true);
        setTimeout(() => {
          setPinSuccess(false); setSelectionRect(null); setSelectedText('');
          window.getSelection()?.removeAllRanges();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to pin:', err);
      haptic.notification('error');
    } finally {
      setIsPinning(false);
    }
  };

  const calculateReadTime = (text: string) =>
    Math.max(1, Math.ceil(text.split(/\s+/).length / 200));

  const courseDisplayName = subject === 'All' ? 'All Subjects' : subject;

  // ─── NOTE READER VIEW ───────────────────────────────────────────────────────
  if (selectedNote) {
    const readMins = calculateReadTime(selectedNote.content || '');
    return (
      <div className="min-h-screen bg-ground flex flex-col font-sans animate-fade-in relative">

        {/* Floating Pin Button */}
        {selectionRect && selectedText && (
          <div
            className="fixed z-50 animate-scale-bounce"
            style={{
              top: Math.max(72, selectionRect.top),
              left: Math.max(10, Math.min(selectionRect.left - 80, window.innerWidth - 170)),
            }}
          >
            <button
              onClick={savePin}
              disabled={isPinning || pinSuccess}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-black text-sm shadow-2xl border-2 transition-all active:scale-95 ${
                pinSuccess
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : 'bg-amber-300 text-amber-900 border-amber-400 hover:bg-amber-400'
              }`}
            >
              {pinSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Pin className="w-4 h-4 fill-amber-700" />}
              {pinSuccess ? 'Saved!' : 'Pin Note'}
            </button>
          </div>
        )}

        {/* Sticky Header */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-xl z-40 border-b border-black/8 px-4 pt-3 pb-0">
          <div className="flex items-center gap-3 pb-3">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${accentBg}`}>
              {emoji}
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] font-black text-primary leading-snug line-clamp-1 tracking-tight">
                {selectedNote.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[11px] font-black uppercase tracking-widest ${accentText}`}>
                  {selectedNote.department}
                </span>
                <span className="text-tertiary text-[11px]">·</span>
                <Clock className="w-3 h-3 text-tertiary" />
                <span className="text-[11px] font-semibold text-tertiary">{readMins} min read</span>
              </div>
            </div>
          </div>
          <ReadingProgress scrollRef={scrollRef} />
        </header>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 pt-6 pb-28 custom-scrollbar scroll-smooth"
        >
          <div id="note-content" className="w-full">
            <MarkdownRenderer 
              content={selectedNote.content || ''} 
              accentBg={accentBg} 
              accentText={accentText} 
            />
          </div>

          <div className={`mt-10 mb-4 p-5 rounded-2xl ${accentBg} border border-black/5 text-center`}>
            <div className="text-3xl mb-2">🎓</div>
            <p className={`font-black text-[15px] ${accentText}`}>End of Chapter</p>
            <p className="text-[13px] text-primary/50 font-medium mt-1">
              Highlight any text to save it to your notebook
            </p>
          </div>
        </div>

        {/* Footer Action Bar */}
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-black/8 p-4 z-30 flex gap-3 pb-safe">
          <button
            onClick={() => { haptic.impact('light'); setShowTutor(true); }}
            className={`flex-1 h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-black/5 ${accentBg} ${accentText}`}
          >
            <Sparkles className="w-4 h-4" />
            Ask AI Tutor
          </button>
          <button
            onClick={handleBackFromNote}
            className="flex-1 h-12 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <List className="w-4 h-4" />
            Chapters
          </button>
        </footer>

        <AITutorDrawer
          mode="notes"
          noteText={selectedNote.content || ''}
          isOpen={showTutor}
          onClose={() => setShowTutor(false)}
        />
      </div>
    );
  }

  // ─── CHAPTER LIST VIEW ──────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col pb-24 overflow-y-auto animate-fade-in bg-ground no-scrollbar">

      <div className={`${accentBg} px-5 pt-6 pb-5 border-b border-black/8`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 border-white`}>
            {emoji}
          </div>
          <div className="flex-1">
            <p className={`text-[11px] font-black uppercase tracking-widest ${accentText} mb-1`}>
              Study Notes
            </p>
            <h1 className="text-[22px] font-black text-primary leading-tight tracking-tight">
              {courseDisplayName}
            </h1>
            <p className="text-[13px] font-semibold text-secondary mt-0.5">
              {examType} · {initialNotes.length > 0 ? `${initialNotes.length} chapters` : 'Loading…'}
            </p>
          </div>
        </div>
      </div>

      {initialNotes.length > 0 && (
        <div className="px-5 py-3 flex gap-3 border-b border-black/5">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-tertiary">
            <Layers className="w-3.5 h-3.5" />
            {initialNotes.length} Chapters
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-tertiary">
            <Clock className="w-3.5 h-3.5" />
            {initialNotes.reduce((sum, n) => sum + calculateReadTime(n.content || ''), 0)} min total read
          </div>
        </div>
      )}

      <div className="flex-1 px-4 pt-4 space-y-3">
        {initialNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className={`w-20 h-20 ${accentBg} rounded-3xl flex items-center justify-center mb-5 text-4xl`}>
              {emoji}
            </div>
            <h3 className="text-xl font-black text-primary mb-2">No notes yet</h3>
            <p className="text-sm font-semibold text-tertiary max-w-[240px] leading-relaxed">
              We haven&apos;t uploaded summary notes for this subject yet. Check back soon!
            </p>
          </div>
        ) : (
          initialNotes.map((note, idx) => {
            const mins = calculateReadTime(note.content || '');
            return (
              <button
                key={note.id}
                onClick={() => { haptic.selection(); setSelectedNote(note); }}
                className="w-full bg-white rounded-2xl border border-black/5 hover:border-black/10 shadow-sm active:scale-[0.98] transition-all text-left group overflow-hidden animate-fade-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${accentBg} ${accentText} border-2 border-white shadow-sm`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-primary text-[15px] leading-snug line-clamp-2 tracking-tight">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${accentText} ${accentBg} px-2 py-0.5 rounded-md`}>
                        {note.department}
                      </span>
                      <span className="text-[12px] font-semibold text-tertiary flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {mins} min
                      </span>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 ${accentText} opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity`} />
                </div>
                <div className={`h-[3px] w-0 group-hover:w-full group-active:w-full transition-all duration-300 ${accentBar}`} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
