'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, Sparkles, List, ChevronRight, ChevronLeft, Layers, Trash2, X, PenLine, Zap } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { StudyNote, NoteHighlight, HighlightColor } from '@/types';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getSubjectTheme } from '@/components/practice/PracticeHub';
import { sounds } from '@/lib/sounds';
import { useGamificationStore } from '@/store/useGamificationStore';
import { MascotBubble } from '@/components/mascot/TemariMascot';

const HIGHLIGHT_PALETTE: {
  id: HighlightColor;
  name: string;
  dot: string;
  border: string;
  badge: string;
}[] = [
  { id: 'yellow', name: 'Amber',  dot: 'bg-amber-400',   border: 'border-amber-500',   badge: 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' },
  { id: 'green',  name: 'Mint',   dot: 'bg-emerald-400', border: 'border-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200' },
  { id: 'blue',   name: 'Sky',    dot: 'bg-sky-400',     border: 'border-sky-500',     badge: 'bg-sky-100 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200' },
  { id: 'purple', name: 'Purple', dot: 'bg-purple-400',  border: 'border-purple-500',  badge: 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200' },
  { id: 'orange', name: 'Coral',  dot: 'bg-orange-400',  border: 'border-orange-500',  badge: 'bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200' },
];

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

  // Highlighter state
  const [highlights, setHighlights] = useState<NoteHighlight[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ top: number; left: number } | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<NoteHighlight | null>(null);
  const [highlightModalCoords, setHighlightModalCoords] = useState<{ top: number; left: number } | null>(null);

  // Pen Mode: continuous instant highlight on text drag/release
  const [penModeActive, setPenModeActive] = useState(false);
  const [activePenColor, setActivePenColor] = useState<HighlightColor>('yellow');

  const scrollRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);
  const selectedTextRef = useRef('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dept = subject && subject !== 'All' ? subject : 'General';
  const themeClass = getSubjectTheme(dept);
  const accentBar = 'bg-primary';
  const accentText = 'text-gray-900 dark:text-gray-100';
  const accentBg = 'bg-primary/5';
  const emoji = SUBJECT_EMOJI[dept] ?? '📚';

  const getStorageKey = useCallback((chapTitle: string) => {
    return `temari_hl_${subject}_${chapTitle}`;
  }, [subject]);

  const handleBackFromNote = useCallback(() => {
    setSelectedNote(null);
    setShowTutor(false);
    selectedTextRef.current = '';
    setSelectedText('');
    setSelectionCoords(null);
    setSelectedHighlight(null);
    setPenModeActive(false);
    haptic.impact('light');
  }, [haptic]);

  useEffect(() => {
    if (selectedNote) setBackButton(true, handleBackFromNote);
    else              setBackButton(true, () => router.push('/'));
  }, [selectedNote, setBackButton, router, handleBackFromNote]);

  // Load highlights for the selected note from localStorage
  useEffect(() => {
    if (!selectedNote) {
      setHighlights([]);
      return;
    }

    const key = getStorageKey(selectedNote.title);
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        setHighlights(JSON.parse(cached));
      } else {
        setHighlights([]);
      }
    } catch {
      setHighlights([]);
    }
  }, [selectedNote, subject, getStorageKey]);

  // Direct highlight application
  const applyHighlightDirect = useCallback((textToSave: string, color: HighlightColor) => {
    if (!textToSave || !selectedNote) return;
    const cleanText = textToSave.replace(/\s+/g, ' ').trim();
    if (cleanText.length < 2) return;

    const noteTitle = selectedNote.title;
    const key = getStorageKey(noteTitle);
    haptic.impact('light');

    const tempId = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newHighlight: NoteHighlight = {
      id: tempId,
      subject: subject || 'General',
      chapter_title: noteTitle,
      text: cleanText,
      color,
      created_at: new Date().toISOString(),
    };

    setHighlights(prev => {
      if (prev.some(h => h.text === cleanText && h.color === color)) return prev;
      const updated = [...prev, newHighlight];
      try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Clear selection cleanly
    selectedTextRef.current = '';
    setSelectedText('');
    setSelectionCoords(null);
    try {
      window.getSelection()?.removeAllRanges();
    } catch {}
  }, [selectedNote, subject, getStorageKey, haptic]);

  // Remove a highlight
  const removeHighlight = (id: string) => {
    if (!selectedNote) return;
    haptic.impact('light');
    const noteTitle = selectedNote.title;
    const key = getStorageKey(noteTitle);

    setHighlights(prev => {
      const updated = prev.filter(h => h.id !== id);
      try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
      return updated;
    });

    setSelectedHighlight(null);
    setHighlightModalCoords(null);
  };

  // Update an existing highlight's color
  const updateHighlightColor = (id: string, newColor: HighlightColor) => {
    if (!selectedNote) return;
    haptic.selection();
    const noteTitle = selectedNote.title;
    const key = getStorageKey(noteTitle);

    setHighlights(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, color: newColor } : h);
      try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
      return updated;
    });

    setSelectedHighlight(null);
    setHighlightModalCoords(null);
  };

  // Buttery-smooth text selection handling (zero interference with browser drag)
  useEffect(() => {
    if (!selectedNote) return;

    const processSelection = () => {
      // Don't calculate or render if pointer is still actively down!
      if (isPointerDownRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const raw = selection.toString();
      const text = raw.replace(/\s+/g, ' ').trim();
      if (text.length < 2) return;

      const container = document.getElementById('note-content');
      if (!container) return;

      try {
        const range = selection.getRangeAt(0);
        if (
          container.contains(range.commonAncestorContainer) ||
          (container.contains(range.startContainer) && container.contains(range.endContainer))
        ) {
          selectedTextRef.current = text;

          // If Pen Mode is active, auto-highlight instantly on release!
          if (penModeActive) {
            applyHighlightDirect(text, activePenColor);
            return;
          }

          const rect = range.getBoundingClientRect();
          const top = rect.top < 130 ? rect.bottom + 10 : rect.top - 54;
          const left = rect.left + rect.width / 2;

          setSelectedText(text);
          setSelectionCoords({ top, left });
          setSelectedHighlight(null);
        }
      } catch {}
    };

    const handlePointerDown = (e: any) => {
      isPointerDownRef.current = true;
      const target = e.target as HTMLElement;
      // If user tapped outside the active toolbars, dismiss them
      if (!target?.closest?.('.highlighter-toolbar') && !target?.closest?.('.highlighter-popover')) {
        setSelectedText('');
        setSelectionCoords(null);
        setSelectedHighlight(null);
      }
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(processSelection, 50);
    };

    const handleSelectionChange = () => {
      // NEVER process during active dragging/gesturing!
      if (isPointerDownRef.current) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (isPointerDownRef.current) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          const activeEl = document.activeElement;
          if (!activeEl?.closest('.highlighter-toolbar') && !activeEl?.closest('.highlighter-popover')) {
            setSelectedText('');
            setSelectionCoords(null);
          }
        } else {
          processSelection();
        }
      }, 150);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchend', handlePointerUp, { passive: true });
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchend', handlePointerUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [selectedNote, penModeActive, activePenColor, applyHighlightDirect]);

  // Apply a highlight from floating toolbar
  const applyHighlight = (color: HighlightColor) => {
    const textToApply = selectedTextRef.current || selectedText;
    if (textToApply) {
      applyHighlightDirect(textToApply, color);
    }
  };

  // Handle clicking on an existing highlight tag in the note
  const handleHighlightClick = (h: NoteHighlight) => {
    haptic.impact('light');
    setSelectedHighlight(h);
    const el = document.querySelector(`[data-highlight-id="${h.id}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const top = rect.top < 130 ? rect.bottom + 8 : rect.top - 54;
      setHighlightModalCoords({ top, left: rect.left + rect.width / 2 });
    } else {
      setHighlightModalCoords({ top: 120, left: window.innerWidth / 2 });
    }
  };

  const calculateReadTime = (text: string) =>
    Math.max(1, Math.ceil(text.split(/\s+/).length / 200));

  const courseDisplayName = subject === 'All' ? 'All Subjects' : subject;

  // ─── NOTE READER VIEW ───────────────────────────────────────────────────────
  if (selectedNote) {
    const readMins = calculateReadTime(selectedNote.content || '');
    return (
      <div className="min-h-screen bg-ground flex flex-col font-sans animate-fade-in relative pb-28">

        {/* Floating Selection Highlighter Bar */}
        {!penModeActive && selectionCoords && selectedText && (
          <div
            className="highlighter-toolbar fixed z-50 -translate-x-1/2 animate-scale-bounce pointer-events-auto select-none"
            style={{
              top: Math.max(72, selectionCoords.top),
              left: `clamp(110px, ${selectionCoords.left}px, calc(100vw - 110px))`,
            }}
          >
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-bespoke-lg">
              <div className="flex items-center pl-1.5 pr-1 text-slate-400">
                <PenLine className="w-3.5 h-3.5" />
              </div>
              {HIGHLIGHT_PALETTE.map(col => (
                <button
                  key={col.id}
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={() => applyHighlight(col.id)}
                  className={`w-7 h-7 rounded-full ${col.dot} ${col.border} border-2 hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center`}
                  title={`Highlight in ${col.name}`}
                />
              ))}
              <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-0.5" />
              <button
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={() => {
                  selectedTextRef.current = '';
                  setSelectedText('');
                  setSelectionCoords(null);
                  try { window.getSelection()?.removeAllRanges(); } catch {}
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-foreground active:scale-90 transition-all"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Edit Popover for Existing Highlight */}
        {selectedHighlight && highlightModalCoords && (
          <div
            className="highlighter-popover fixed z-50 -translate-x-1/2 animate-scale-bounce pointer-events-auto select-none"
            style={{
              top: Math.max(72, highlightModalCoords.top),
              left: `clamp(120px, ${highlightModalCoords.left}px, calc(100vw - 120px))`,
            }}
          >
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-bespoke-lg">
              <div className="flex items-center gap-1 pl-1">
                {HIGHLIGHT_PALETTE.map(col => (
                  <button
                    key={col.id}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={() => updateHighlightColor(selectedHighlight.id, col.id)}
                    className={`w-6 h-6 rounded-full ${col.dot} ${col.border} border-2 hover:scale-110 active:scale-95 transition-all ${
                      selectedHighlight.color === col.id ? 'ring-2 ring-primary ring-offset-1' : ''
                    }`}
                    title={`Change color to ${col.name}`}
                  />
                ))}
              </div>
              <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-0.5" />
              <button
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={() => removeHighlight(selectedHighlight.id)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all flex items-center gap-1"
                title="Remove Highlight"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={() => setSelectedHighlight(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-foreground active:scale-90"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Active Pen Dock when Pen Mode is active */}
        {penModeActive && (
          <aside
            aria-label="Active Highlighter Pen Toolbar"
            className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-scale-bounce pointer-events-auto select-none"
          >
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-bespoke-lg">
              <div className="flex items-center gap-1.5 pl-1 pr-1 text-xs font-bold text-foreground">
                <PenLine className="w-4 h-4 text-primary animate-pulse" />
                <span className="hidden sm:inline">Pen Mode:</span>
              </div>
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Pen highlighter color">
                {HIGHLIGHT_PALETTE.map(col => (
                  <button
                    key={col.id}
                    role="radio"
                    aria-checked={activePenColor === col.id}
                    aria-label={`Use ${col.name} highlighter`}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={() => {
                      haptic.selection();
                      setActivePenColor(col.id);
                    }}
                    className={`w-7 h-7 rounded-full ${col.dot} ${col.border} border-2 transition-all ${
                      activePenColor === col.id
                        ? 'ring-2 ring-primary ring-offset-2 scale-110'
                        : 'opacity-70 hover:opacity-100 hover:scale-105 active:scale-95'
                    }`}
                    title={`Use ${col.name} highlighter`}
                  />
                ))}
              </div>
              <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1" />
              <button
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={() => {
                  haptic.impact('light');
                  setPenModeActive(false);
                }}
                className="px-2 py-1 rounded-full text-xs font-semibold text-slate-500 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                title="Exit Pen Mode"
              >
                Exit
              </button>
            </div>
          </aside>
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

            {/* Pen Mode Toggle Button */}
            <button
              onClick={() => {
                haptic.selection();
                setPenModeActive(prev => !prev);
                setSelectionCoords(null);
                setSelectedText('');
              }}
              className={`h-9 px-3 rounded-[12px] flex items-center gap-1.5 text-xs font-bold border transition-all duration-200 ease-bespoke ${
                penModeActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-card text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={penModeActive ? 'Pen Mode Active (Tap to disable)' : 'Enable Pen Mode (Instant highlight on select)'}
            >
              <PenLine className="w-4 h-4" />
              <span>Pen</span>
              {penModeActive && (
                <span className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_PALETTE.find(p => p.id === activePenColor)?.dot || 'bg-amber-400'}`} />
              )}
            </button>
          </div>
          <ReadingProgress />
        </header>

        {/* Content Area */}
        <div
          ref={scrollRef}
          className="flex flex-col px-2.5 sm:px-4 pt-4 animate-fade-in"
        >
          <div id="note-content" className="w-full ruled-paper rounded-[20px] sm:rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm overflow-hidden pt-4 pb-12 mb-4 note-reading-canvas select-text">
            <MarkdownRenderer 
              content={selectedNote.content || ''} 
              accentBg={accentBg} 
              accentText={accentText}
              highlights={highlights}
              onHighlightClick={handleHighlightClick}
            />
          </div>
        </div>

        {/* Footer Action Bar */}
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-ground/90 backdrop-blur-xl border-t border-black/[0.06] dark:border-white/[0.08] p-3.5 z-30 flex gap-2.5 pb-safe">
          <button
            onClick={() => { haptic.impact('light'); setShowTutor(true); }}
            className="flex-1 h-13 rounded-[18px] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-black/[0.06] dark:border-white/[0.08] bg-card text-gray-900 dark:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-accent-gold" />
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

      {/* Mascot Encouragement Banner */}
      <div className="mb-3">
        <MascotBubble
          mood="studying"
          mascotSize={54}
          message="Master these key concepts! Every chapter read earns +15 XP towards your Scholar Level."
        />
      </div>

      {initialNotes.length > 0 && (
        <div className="px-5 py-2.5 flex gap-4 border-b border-black/[0.06] dark:border-white/[0.08] mb-3">
          <div className="flex items-center gap-1.5 text-[12px] font-black text-slate-600 dark:text-slate-400">
            <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            {initialNotes.length} Chapters
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-black text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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
                onClick={() => {
                  sounds.playTap();
                  haptic.selection();
                  useGamificationStore.getState().addXp(15, 'Read Study Note');
                  setSelectedNote(note);
                }}
                className="w-full bg-card rounded-[22px] border border-black/[0.08] dark:border-white/[0.08] border-b-[3px] border-b-black/[0.14] dark:border-b-white/[0.14] hover:border-primary/40 active:translate-y-[1px] shadow-sm transition-all text-left group overflow-hidden animate-fade-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-center gap-3.5 p-3.5">
                  <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-sm shrink-0 ${themeClass} shadow-xs`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 dark:text-gray-100 text-[14px] leading-snug line-clamp-2 tracking-tight">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${themeClass}`}>
                        {note.department}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {mins} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      +15 XP
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
