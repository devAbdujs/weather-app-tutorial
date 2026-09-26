'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, Sparkles, List, Pin, CheckCircle2, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { StudyNote } from '@/types';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getSubjectTheme } from '@/components/practice/PracticeHub';

const AITutorDrawer = dynamic(() => import('@/components/ai/AITutorDrawer').then(m => m.AITutorDrawer), { ssr: false });
const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer'), { ssr: false, loading: () => <div className="animate-pulse h-32 bg-black/5 dark:bg-white/5 rounded-xl" /> });

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
  'Software Engineering': '🖥️', 'Emerging Technology': '🚀', 'Aptitude': '🎯', 'Scholastic Aptitude (SAT)': '🎯', 'GAT (Graduate Admission Test)': '🎯',
};

const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = (e: any) => {
      const elem = e.target;
      const { scrollTop, scrollHeight, clientHeight } = elem;
      const totalHeight = scrollHeight - clientHeight;
      setProgress(totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0);
    };
    const elem = document.getElementById('main-scroll-area');
    if (elem) { elem.addEventListener('scroll', handleScroll); }
    return () => { if (elem) elem.removeEventListener('scroll', handleScroll); };
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/[0.04] dark:bg-white/[0.04]">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out rounded-full"
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
  const themeClass = getSubjectTheme(dept);
  const accentBar = 'bg-primary';
  const accentText = 'text-gray-900 dark:text-gray-100';
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-black text-sm shadow-2xl border-2 transition-all active:scale-[0.98] active:opacity-80 ${
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
        <header className="sticky top-0 bg-card/95 backdrop-blur-xl z-40 border-b border-black/[0.06] dark:border-white/[0.08] px-3 sm:px-4 pt-3 pb-0">
          <div className="flex items-center gap-2.5 pb-3">
            <button
              onClick={handleBackFromNote}
              aria-label="Back to chapters"
              className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 border border-black/[0.06] dark:border-white/[0.08] bg-card hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className={`w-9 h-9 rounded-[12px] flex items-center justify-center text-lg shrink-0 ${themeClass}`}>
              {emoji}
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] font-black text-gray-900 dark:text-gray-100 leading-snug line-clamp-1 tracking-tight">
                {selectedNote.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  {selectedNote.department}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-[11px]">·</span>
                <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{readMins} min read</span>
              </div>
            </div>
          </div>
          <ReadingProgress />
        </header>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex flex-col px-2.5 sm:px-4 pt-4 animate-fade-in"
        >
          <div id="note-content" className="w-full ruled-paper rounded-[20px] sm:rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm overflow-hidden pt-4 pb-12 mb-4">
            <MarkdownRenderer 
              content={selectedNote.content || ''} 
              accentBg={accentBg} 
              accentText={accentText} 
            />
          </div>

          <div className={`mt-10 mb-4 p-5 rounded-[20px] ${themeClass} text-center`}>
            <div className="text-3xl mb-2">🎓</div>
            <p className="font-bold text-[15px] text-gray-900 dark:text-gray-100">End of Chapter</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-1">
              Highlight any text to save it to your notebook
            </p>
          </div>
        </div>

        {/* Footer Action Bar */}
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-ground/90 backdrop-blur-xl border-t border-black/[0.06] dark:border-white/[0.08] p-3.5 z-30 flex gap-2.5 pb-safe">
          <button
            onClick={() => { haptic.impact('light'); setShowTutor(true); }}
            className="flex-1 h-13 rounded-[18px] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-black/[0.06] dark:border-white/[0.08] bg-card text-gray-900 dark:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Ask AI Tutor
          </button>
          <button
            onClick={handleBackFromNote}
            className="flex-1 h-13 bg-primary text-white rounded-[18px] font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ease-bespoke active:scale-[0.98] shadow-bespoke-sm"
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
    <div className="flex flex-col pt-3 px-3 sm:px-4 animate-fade-in bg-ground min-h-screen pb-12">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => {
            haptic.impact('light');
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/practice');
            }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[14px] text-[13px] font-bold text-gray-700 dark:text-gray-300 border border-black/[0.06] dark:border-white/[0.08] bg-card hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="bg-card px-5 pt-6 pb-5 rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm mb-3">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center text-3xl shadow-sm ${themeClass}`}>
            {emoji}
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Study Notes
            </p>
            <h1 className="text-[22px] font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
              {courseDisplayName}
            </h1>
            <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              {examType} · {initialNotes.length > 0 ? `${initialNotes.length} chapters` : 'Loading…'}
            </p>
          </div>
        </div>
      </div>

      {initialNotes.length > 0 && (
        <div className="px-5 py-2.5 flex gap-4 border-b border-black/[0.06] dark:border-white/[0.08] mb-3">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 dark:text-gray-400">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            {initialNotes.length} Chapters
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {initialNotes.reduce((sum, n) => sum + calculateReadTime(n.content || ''), 0)} min total read
          </div>
        </div>
      )}

      <div className="flex-1 space-y-2.5">
        {initialNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className={`w-20 h-20 ${themeClass} rounded-[24px] flex items-center justify-center mb-5 text-4xl`}>
              {emoji}
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">No notes yet</h3>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 max-w-[240px] leading-relaxed">
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
                className="w-full bg-card rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 shadow-sm active:scale-[0.98] transition-all text-left group overflow-hidden animate-fade-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-center gap-3.5 p-3.5">
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center font-black text-sm shrink-0 ${themeClass}`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[15px] leading-snug line-clamp-2 tracking-tight">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${themeClass}`}>
                        {note.department}
                      </span>
                      <span className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" /> {mins} min
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 shrink-0 text-gray-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
