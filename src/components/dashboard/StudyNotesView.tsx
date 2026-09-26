'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, Sparkles, List, ChevronRight, ChevronLeft, Layers, Highlighter, Undo2, Trash2, Copy, Check, RotateCcw, X, PenLine } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { StudyNote, NoteHighlight, HighlightColor } from '@/types';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getSubjectTheme } from '@/components/practice/PracticeHub';

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
  const [showHighlightsDrawer, setShowHighlightsDrawer] = useState(false);
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);

  // Pen Mode: continuous instant highlight on text drag/release
  const [penModeActive, setPenModeActive] = useState(false);
  const [activePenColor, setActivePenColor] = useState<HighlightColor>('yellow');

  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPointerDownRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dept = subject && subject !== 'All' ? subject : 'General';
  const themeClass = getSubjectTheme(dept);
  const accentBar = 'bg-primary';
  const accentText = 'text-gray-900 dark:text-gray-100';
  const accentBg = 'bg-primary/5';
  const emoji = SUBJECT_EMOJI[dept] ?? '📚';

  const showToast = useCallback((message: string, onUndo?: () => void) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, onUndo });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const getStorageKey = useCallback((chapTitle: string) => {
    return `temari_hl_${subject}_${chapTitle}`;
  }, [subject]);

  const handleBackFromNote = useCallback(() => {
    setSelectedNote(null);
    setShowTutor(false);
    setSelectedText('');
    setSelectionCoords(null);
    setSelectedHighlight(null);
    setShowHighlightsDrawer(false);
    setPenModeActive(false);
    haptic.impact('light');
  }, [haptic]);

  useEffect(() => {
    if (selectedNote) setBackButton(true, handleBackFromNote);
    else              setBackButton(true, () => router.push('/'));
  }, [selectedNote, setBackButton, router, handleBackFromNote]);

  // Load highlights for the selected note from localStorage and API
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

    // Sync with backend API
    fetch(`/api/highlights?subject=${encodeURIComponent(subject || 'General')}&chapter_title=${encodeURIComponent(selectedNote.title)}`)
      .then(r => r.json())
      .then(data => {
        if (data.highlights && Array.isArray(data.highlights)) {
          setHighlights(prev => {
            const map = new Map<string, NoteHighlight>();
            data.highlights.forEach((h: NoteHighlight) => map.set(h.id, h));
            prev.forEach(h => { if (!map.has(h.id)) map.set(h.id, h); });
            const merged = Array.from(map.values());
            try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      })
      .catch(err => console.warn('Highlights load error:', err));
  }, [selectedNote, subject, getStorageKey]);

  // Direct highlight application
  const applyHighlightDirect = useCallback((textToSave: string, color: HighlightColor) => {
    if (!textToSave || !selectedNote) return;
    const noteTitle = selectedNote.title;
    const key = getStorageKey(noteTitle);
    haptic.impact('light');

    const tempId = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newHighlight: NoteHighlight = {
      id: tempId,
      subject: subject || 'General',
      chapter_title: noteTitle,
      text: textToSave,
      color,
      created_at: new Date().toISOString(),
    };

    setHighlights(prev => {
      if (prev.some(h => h.text === textToSave && h.color === color)) return prev;
      const updated = [...prev, newHighlight];
      try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Clear selection
    setSelectedText('');
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();

    // Show undo toast
    showToast('Highlight saved', () => {
      removeHighlight(tempId, false);
    });

    // Save permanently to backend
    fetch('/api/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subject || 'General',
        chapter_title: noteTitle,
        text: textToSave,
        color,
      }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.highlight?.id) {
          setHighlights(curr => {
            const mapped = curr.map(h => h.id === tempId ? { ...h, id: res.highlight.id } : h);
            try { localStorage.setItem(key, JSON.stringify(mapped)); } catch {}
            return mapped;
          });
        }
      })
      .catch(e => console.warn('Failed to sync highlight to server:', e));
  }, [selectedNote, subject, getStorageKey, haptic, showToast]);

  // Remove a highlight
  const removeHighlight = (id: string, recordUndo: boolean = true) => {
    if (!selectedNote) return;
    haptic.impact('light');
    const noteTitle = selectedNote.title;
    const key = getStorageKey(noteTitle);

    const target = highlights.find(h => h.id === id);
    const updated = highlights.filter(h => h.id !== id);
    setHighlights(updated);
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}

    setSelectedHighlight(null);
    setHighlightModalCoords(null);

    if (recordUndo && target) {
      showToast('Highlight removed', () => {
        const restored = [...updated, target];
        setHighlights(restored);
        try { localStorage.setItem(key, JSON.stringify(restored)); } catch {}
      });
    }

    fetch(`/api/highlights?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      .catch(e => console.warn('Failed to delete highlight from server:', e));
  };

  // Decoupled, buttery-smooth selection handling (zero re-renders while dragging)
  useEffect(() => {
    if (!selectedNote) return;

    const processSelection = () => {
      // Don't calculate or render if pointer is still actively down
      if (isPointerDownRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectedText('');
        setSelectionCoords(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) {
        setSelectedText('');
        setSelectionCoords(null);
        return;
      }

      const container = document.getElementById('note-content');
      if (!container) return;

      try {
        const range = selection.getRangeAt(0);
        if (container.contains(range.commonAncestorContainer)) {
          const rect = range.getBoundingClientRect();
          // Smart vertical placement: flip below if near the top
          const top = rect.top < 130 ? rect.bottom + 12 : rect.top - 58;
          const left = rect.left + rect.width / 2;

          // If Pen Mode is active, auto-apply the highlight immediately!
          if (penModeActive) {
            applyHighlightDirect(text, activePenColor);
            return;
          }

          setSelectedText(text);
          setSelectionCoords({ top, left });
          setSelectedHighlight(null);
        } else {
          setSelectedText('');
          setSelectionCoords(null);
        }
      } catch {
        setSelectedText('');
        setSelectionCoords(null);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDownRef.current = true;
      const target = e.target as HTMLElement;
      if (!target.closest('.highlighter-toolbar') && !target.closest('.highlighter-popover')) {
        setSelectionCoords(null);
        setSelectedHighlight(null);
      }
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(processSelection, 70);
    };

    const handleSelectionChange = () => {
      // Never re-render during active touch/drag! Only update after pointer lifts or stays still
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (!isPointerDownRef.current) {
          processSelection();
        }
      }, 150);
    };

    const container = document.getElementById('note-content');
    if (container) {
      container.addEventListener('pointerdown', handlePointerDown);
      container.addEventListener('pointerup', handlePointerUp);
    }
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      if (container) {
        container.removeEventListener('pointerdown', handlePointerDown);
        container.removeEventListener('pointerup', handlePointerUp);
      }
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [selectedNote, penModeActive, activePenColor, applyHighlightDirect]);

  // Apply a highlight from floating toolbar
  const applyHighlight = (color: HighlightColor) => {
    applyHighlightDirect(selectedText, color);
  };

  // Update an existing highlight's color
  const updateHighlightColor = (id: string, newColor: HighlightColor) => {
    if (!selectedNote) return;
    haptic.selection();
    const noteTitle = selectedNote.title;
    const key = getStorageKey(noteTitle);

    const updated = highlights.map(h => h.id === id ? { ...h, color: newColor } : h);
    setHighlights(updated);
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}

    setSelectedHighlight(null);
    setHighlightModalCoords(null);
    showToast('Color updated');

    const hl = highlights.find(h => h.id === id);
    if (hl) {
      fetch('/api/highlights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, text: hl.text, color: newColor }),
      }).catch(e => console.warn('Failed to update color on server:', e));
    }
  };

  // Undo the last highlight
  const undoLastHighlight = () => {
    if (highlights.length === 0) return;
    const last = highlights[highlights.length - 1];
    removeHighlight(last.id, false);
    showToast('Undone last highlight');
  };

  // Clear all highlights in current chapter
  const clearAllHighlights = () => {
    if (!selectedNote || highlights.length === 0) return;
    haptic.notification('warning');
    const noteTitle = selectedNote.title;
    const key = getStorageKey(noteTitle);
    const previous = [...highlights];

    setHighlights([]);
    try { localStorage.setItem(key, JSON.stringify([])); } catch {}
    setShowHighlightsDrawer(false);

    showToast('All highlights cleared', () => {
      setHighlights(previous);
      try { localStorage.setItem(key, JSON.stringify(previous)); } catch {}
    });

    previous.forEach(h => {
      fetch(`/api/highlights?id=${encodeURIComponent(h.id)}`, { method: 'DELETE' }).catch(() => {});
    });
  };

  const copySelectedText = () => {
    if (!selectedText) return;
    haptic.impact('light');
    navigator.clipboard?.writeText(selectedText);
    showToast('Copied to clipboard');
    setSelectedText('');
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
  };

  // Handle clicking on an existing highlight tag in the note
  const handleHighlightClick = (h: NoteHighlight) => {
    haptic.impact('light');
    setSelectedHighlight(h);
    const el = document.querySelector(`[data-highlight-id="${h.id}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightModalCoords({ top: rect.top - 54, left: rect.left + rect.width / 2 });
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
            className="fixed z-50 -translate-x-1/2 animate-scale-bounce pointer-events-auto"
            style={{
              top: Math.max(72, selectionCoords.top),
              left: `clamp(140px, ${selectionCoords.left}px, calc(100vw - 140px))`,
            }}
          >
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-bespoke-lg">
              <div className="flex items-center gap-1 pl-2 pr-1 text-[11px] font-bold text-muted">
                <Highlighter className="w-3.5 h-3.5 text-primary" />
                <span className="hidden xs:inline">Highlight:</span>
              </div>
              {HIGHLIGHT_PALETTE.map(col => (
                <button
                  key={col.id}
                  onClick={() => applyHighlight(col.id)}
                  className={`w-7 h-7 rounded-full ${col.dot} ${col.border} border-2 hover:scale-110 active:scale-95 transition-all shadow-sm flex items-center justify-center`}
                  title={`Highlight in ${col.name}`}
                />
              ))}
              <div className="w-[1px] h-4 bg-border/80 mx-0.5" />
              <button
                onClick={copySelectedText}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all"
                title="Copy selected text"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Edit Popover for Existing Highlight */}
        {selectedHighlight && highlightModalCoords && (
          <div
            className="fixed z-50 -translate-x-1/2 animate-scale-bounce pointer-events-auto"
            style={{
              top: Math.max(72, highlightModalCoords.top),
              left: `clamp(140px, ${highlightModalCoords.left}px, calc(100vw - 140px))`,
            }}
          >
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-bespoke-lg">
              <span className="text-[11px] font-semibold text-muted pl-2">Color:</span>
              <div className="flex items-center gap-1">
                {HIGHLIGHT_PALETTE.map(col => (
                  <button
                    key={col.id}
                    onClick={() => updateHighlightColor(selectedHighlight.id, col.id)}
                    className={`w-6 h-6 rounded-full ${col.dot} ${col.border} border-2 hover:scale-110 active:scale-95 transition-all ${
                      selectedHighlight.color === col.id ? 'ring-2 ring-primary ring-offset-1' : ''
                    }`}
                    title={`Change color to ${col.name}`}
                  />
                ))}
              </div>
              <div className="w-[1px] h-4 bg-border/80 mx-0.5" />
              <button
                onClick={() => removeHighlight(selectedHighlight.id)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold text-error hover:bg-error/10 active:scale-95 transition-all flex items-center gap-1"
                title="Remove Highlight"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
              <button
                onClick={() => setSelectedHighlight(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-foreground active:scale-90"
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
            className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-scale-bounce pointer-events-auto"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card/95 backdrop-blur-xl border border-border shadow-bespoke-lg">
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
              <div className="w-[1px] h-4 bg-border/80 mx-1" />
              <button
                onClick={() => {
                  haptic.impact('light');
                  setPenModeActive(false);
                }}
                className="px-2 py-1 rounded-full text-xs font-semibold text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                title="Exit Pen Mode"
              >
                Exit
              </button>
            </div>
          </aside>
        )}

        {/* Floating Toast Notification with Undo */}
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-bespoke-md text-xs font-semibold text-foreground">
              <span>{toast.message}</span>
              {toast.onUndo && (
                <button
                  onClick={() => {
                    toast.onUndo?.();
                    setToast(null);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary text-white font-bold hover:bg-primary/95 transition-all active:scale-95"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              )}
            </div>
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

            {/* Pen Mode Toggle Button */}
            <button
              onClick={() => {
                haptic.selection();
                setPenModeActive(prev => !prev);
                setSelectionCoords(null);
                setSelectedText('');
              }}
              className={`h-9 px-2.5 rounded-[12px] flex items-center gap-1.5 text-xs font-bold border transition-all duration-200 ease-bespoke ${
                penModeActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-card text-muted border-border hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={penModeActive ? 'Pen Mode Active (Tap to disable)' : 'Enable Pen Mode (Instant highlight on select)'}
            >
              <PenLine className="w-4 h-4" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            {/* Highlighter Panel Button */}
            <button
              onClick={() => setShowHighlightsDrawer(prev => !prev)}
              className={`h-9 px-2.5 rounded-[12px] flex items-center gap-1.5 text-xs font-bold border transition-all duration-200 ease-bespoke ${
                highlights.length > 0
                  ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/30 hover:bg-accent-gold/20'
                  : 'bg-card text-muted border-border hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="View highlights in this chapter"
            >
              <Highlighter className="w-4 h-4" />
              <span className="tabular-nums">{highlights.length}</span>
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

        {/* Highlights Drawer / Review Modal */}
        {showHighlightsDrawer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-bespoke-lg border border-border animate-sheet-up flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Highlighter className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Chapter Highlights</h2>
                    <p className="text-xs text-muted font-medium">{highlights.length} saved passage{highlights.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHighlightsDrawer(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-ground border border-border text-muted hover:text-foreground active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action buttons: Undo Last & Clear All */}
              <div className="flex items-center gap-2 mb-4 shrink-0">
                <button
                  onClick={undoLastHighlight}
                  disabled={highlights.length === 0}
                  className="flex-1 py-2 px-3 rounded-xl border border-border bg-ground text-xs font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo Last</span>
                </button>
                <button
                  onClick={clearAllHighlights}
                  disabled={highlights.length === 0}
                  className="py-2 px-3 rounded-xl border border-error/20 bg-error/5 text-xs font-semibold text-error hover:bg-error/10 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Highlights List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                {highlights.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-xs font-semibold text-muted">No highlights yet</p>
                    <p className="text-[11px] text-muted/80 mt-1">Select any text while reading to highlight with your favorite color.</p>
                  </div>
                ) : (
                  highlights.map((h, i) => {
                    const pal = HIGHLIGHT_PALETTE.find(p => p.id === h.color) || HIGHLIGHT_PALETTE[0];
                    return (
                      <div
                        key={h.id || i}
                        className="p-3 rounded-xl border border-border/80 bg-ground/60 hover:bg-ground transition-all flex items-start gap-2.5"
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${pal.dot} shrink-0 mt-1`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground font-medium leading-relaxed italic line-clamp-3">
                            &quot;{h.text}&quot;
                          </p>
                        </div>
                        <button
                          onClick={() => removeHighlight(h.id)}
                          className="w-7 h-7 rounded-lg text-muted hover:text-error hover:bg-error/10 flex items-center justify-center shrink-0 transition-all active:scale-95"
                          title="Delete highlight"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

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
