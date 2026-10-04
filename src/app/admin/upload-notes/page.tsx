"use client";

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, 
  Trash2, Eye, Sparkles, RefreshCw, Layers, ArrowRight, X 
} from 'lucide-react';

const MarkdownRenderer = dynamic(() => import('@/components/dashboard/MarkdownRenderer'), { 
  ssr: false, 
  loading: () => <div className="animate-pulse h-40 bg-black/5 dark:bg-white/5 rounded-2xl" /> 
});

const COURSE_SUGGESTIONS: Record<string, string[]> = {
  freshman: [
    'Applied Mathematics I',
    'Mathematics for Natural Sciences',
    'Economics',
    'General Physics',
    'Emerging Technology',
    'Logic & Critical Thinking',
    'Communicative English',
    'General Psychology',
    'Geography of Ethiopia',
    'History of Ethiopia',
    'Moral & Civics',
    'Global Trends',
    'Inclusiveness',
    'Entrepreneurship',
    'Social Anthropology',
  ],
  entrance: [
    'Mathematics (Natural)',
    'Mathematics (Social)',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Scholastic Aptitude (SAT)',
    'History',
    'Geography',
    'Economics',
    'Civics & Ethical Education',
  ],
  exit: [
    'Computer Science',
    'Software Engineering',
    'Information Technology',
    'Electrical & Computer Engineering',
    'Civil Engineering',
    'Mechanical Engineering',
    'Law',
    'Medicine & Health Sciences',
    'Nursing',
    'Accounting & Finance',
    'Management',
    'Economics',
  ],
};

interface ChapterQueueItem {
  id: string;
  file: File;
  inferredTitle: string;
  status: 'pending' | 'transforming' | 'ready' | 'publishing' | 'published' | 'error';
  content?: string;
  error?: string;
}

export default function AdminUploadNotes() {
  const [activeTab, setActiveTab] = useState<'batch' | 'manual'>('batch');
  const [examType, setExamType] = useState('freshman');
  const [department, setDepartment] = useState('Applied Mathematics I');
  
  // Batch Queue State
  const [queue, setQueue] = useState<ChapterQueueItem[]>([]);
  const [previewItem, setPreviewItem] = useState<ChapterQueueItem | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Tab State
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualStatus, setManualStatus] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMode, setManualMode] = useState<'write' | 'preview'>('write');

  // ── Drag & Drop / File Selection Handlers ────────────────────────────────────
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: ChapterQueueItem[] = Array.from(files).map(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.'));
      let base = file.name.replace(ext, '').replace(/[-_]/g, ' ');

      // Try to clean up titles like "Applied Mathematics I ch1" -> "Chapter 1"
      const chMatch = base.match(/(?:chapter|ch)\s*(\d+)/i);
      if (chMatch) {
        base = `Chapter ${chMatch[1]}`;
      }

      return {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        inferredTitle: base,
        status: 'pending',
      };
    });

    // Natural sort by chapter number
    setQueue(prev => [...prev, ...newItems].sort((a, b) => {
      const getNum = (str: string) => {
        const m = str.match(/chapter\s*(\d+)/i);
        return m ? parseInt(m[1], 10) : 999;
      };
      const diff = getNum(a.inferredTitle) - getNum(b.inferredTitle);
      if (diff !== 0) return diff;
      return a.file.name.localeCompare(b.file.name, undefined, { numeric: true });
    }));
  };

  // ── Transform Individual Item ───────────────────────────────────────────────
  const transformItem = async (itemId: string) => {
    const item = queue.find(q => q.id === itemId);
    if (!item) return;

    setQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'transforming', error: undefined } : q));

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('examType', examType);
      formData.append('department', department);
      formData.append('chapterTitle', item.inferredTitle);

      const res = await fetch('/api/admin/notes/transform', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to transform document');
      }

      setQueue(prev => prev.map(q => q.id === itemId ? {
        ...q,
        status: 'ready',
        inferredTitle: data.title || q.inferredTitle,
        content: data.content,
      } : q));

    } catch (err: any) {
      setQueue(prev => prev.map(q => q.id === itemId ? {
        ...q,
        status: 'error',
        error: err.message,
      } : q));
    }
  };

  // ── Transform All Items Sequentially ────────────────────────────────────────
  const handleTransformAll = async () => {
    setIsProcessingAll(true);
    for (const item of queue) {
      if (item.status === 'pending' || item.status === 'error') {
        await transformItem(item.id);
        // Small 2-second pause to prevent rate limit
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setIsProcessingAll(false);
  };

  // ── Publish Item to Database ────────────────────────────────────────────────
  const publishItem = async (itemId: string) => {
    const item = queue.find(q => q.id === itemId);
    if (!item || !item.content) return;

    setQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'publishing' } : q));

    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          department,
          title: item.inferredTitle,
          content: item.content,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Publish failed');

      setQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'published' } : q));
    } catch (err: any) {
      setQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'error', error: err.message } : q));
    }
  };

  // ── Publish All Transformed Items ───────────────────────────────────────────
  const handlePublishAll = async () => {
    const readyItems = queue.filter(q => q.status === 'ready' && q.content);
    if (readyItems.length === 0) return;

    for (const item of readyItems) {
      await publishItem(item.id);
    }
  };

  // ── Manual Paste Upload ─────────────────────────────────────────────────────
  const handleManualUpload = async () => {
    if (!department || !manualTitle || !manualContent) {
      setManualStatus('Please fill in all fields.');
      return;
    }

    setManualLoading(true);
    setManualStatus('Formatting and saving...');

    try {
      let cleanContent = manualContent.replace(/\b\d+(more_horiz)?\.\n/g, '\n');
      cleanContent = cleanContent.replace(/\[\d+\]/g, '').trim();

      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          department,
          title: manualTitle,
          content: cleanContent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setManualStatus('✅ Successfully saved to Supabase!');
        setManualTitle('');
        setManualContent('');
      } else {
        setManualStatus(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setManualStatus(`❌ Error: ${e.message}`);
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-primary" />
          Study Notes Ingestion Studio
        </h1>
        <p className="text-sm font-semibold text-muted mt-1">
          Transform prepared chapter documents (PDF, Word, PPTX, Text) into student-ready notes with LaTeX & diagrams.
        </p>
      </div>

      {/* Course & Target Config */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> Target Course Coordinates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Exam Target</label>
            <select
              value={examType}
              onChange={(e) => {
                const nextType = e.target.value;
                setExamType(nextType);
                const nextSuggestions = COURSE_SUGGESTIONS[nextType] || [];
                if (nextSuggestions.length > 0) {
                  setDepartment(nextSuggestions[0]);
                }
              }}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-bold text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
            >
              <option value="freshman">University Freshman</option>
              <option value="entrance">Grade 12 EUEE Entrance</option>
              <option value="exit">University Exit Exam</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Course / Department / Subject</label>
            <div className="relative">
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Applied Mathematics I or Physics"
                list="course-suggestions"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-bold text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <datalist id="course-suggestions">
                {(COURSE_SUGGESTIONS[examType] || []).map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-muted self-center mr-1">Quick Picks:</span>
          {(COURSE_SUGGESTIONS[examType] || []).slice(0, 8).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setDepartment(c)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                department === c
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-ground text-foreground border-border hover:border-primary/50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-5 py-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'batch'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Upload className="w-4 h-4" />
          Batch Chapter Ingestion (PDF, Word, PPTX, Text)
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-5 py-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'manual'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          Direct Markdown Paste
        </button>
      </div>

      {/* ── TAB 1: BATCH INGESTION ───────────────────────────────────────────── */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilesAdded(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/60 rounded-3xl p-8 text-center bg-card hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all cursor-pointer shadow-sm group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-black text-foreground">
              Drop chapter files here, or <span className="text-primary underline">browse</span>
            </h3>
            <p className="text-xs font-semibold text-muted mt-1 max-w-sm mx-auto">
              Supports prepared <b>PDF, Word (.docx, .doc), PowerPoint (.pptx, .ppt)</b>, and plain text. Drop multiple chapters at once!
            </p>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    Chapter Processing Queue ({queue.length} files)
                  </h3>
                  <p className="text-xs font-semibold text-muted">
                    Course: <span className="font-bold text-foreground">{department}</span> · Level: <span className="font-bold text-foreground">{examType}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleTransformAll}
                    disabled={isProcessingAll || queue.every(q => q.status === 'ready' || q.status === 'published')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-primary text-white font-black text-xs rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {isProcessingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Transform All
                  </button>

                  <button
                    onClick={handlePublishAll}
                    disabled={!queue.some(q => q.status === 'ready')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-black text-xs rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Publish All Ready
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border/80 bg-ground/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center font-black text-xs shrink-0 text-muted">
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={item.inferredTitle}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, inferredTitle: val } : q));
                          }}
                          placeholder="Chapter Title..."
                          className="font-black text-sm text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none w-full"
                        />
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted font-medium">
                          <span className="truncate max-w-[200px]">{item.file.name}</span>
                          <span>•</span>
                          <span>{(item.file.size / 1024).toFixed(0)} KB</span>
                          {item.content && (
                            <>
                              <span>•</span>
                              <span className="text-primary font-bold">
                                ~{Math.max(1, Math.ceil((item.content.trim().match(/\S+/g) || []).length / 180))} min read
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                      {item.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted/20 text-muted">
                          Pending
                        </span>
                      )}
                      {item.status === 'transforming' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" /> Converting...
                        </span>
                      )}
                      {item.status === 'ready' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                      {item.status === 'publishing' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 flex items-center gap-1 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                      )}
                      {item.status === 'published' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 flex items-center gap-1" title={item.error}>
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {item.status !== 'ready' && item.status !== 'published' && (
                          <button
                            onClick={() => transformItem(item.id)}
                            disabled={item.status === 'transforming'}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted hover:text-foreground transition-all"
                            title="Transform this file"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}

                        {item.content && (
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted hover:text-foreground transition-all"
                            title="Preview transformed note"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {item.status === 'ready' && (
                          <button
                            onClick={() => publishItem(item.id)}
                            className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1"
                          >
                            Publish <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-all"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: MANUAL DIRECT PASTE ───────────────────────────────────────── */}
      {activeTab === 'manual' && (() => {
        const manualWordCount = (manualContent.trim().match(/\S+/g) || []).length;
        const manualReadTime = Math.max(1, Math.ceil(manualWordCount / 180));
        return (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Chapter Title</label>
                <input 
                  type="text" 
                  value={manualTitle} 
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Chapter 1: Introduction to Economics"
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="sm:self-end">
                <button
                  type="button"
                  onClick={() => {
                    setManualTitle('');
                    setManualContent('');
                    setManualStatus('');
                  }}
                  disabled={!manualTitle && !manualContent}
                  className="px-3.5 py-2.5 rounded-xl border border-border text-xs font-bold text-muted hover:text-red-500 hover:border-red-500/30 transition-all disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-muted uppercase tracking-wider">
                  Note Content (Markdown &amp; LaTeX)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-ground border border-border p-0.5 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setManualMode('write')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        manualMode === 'write' ? 'bg-card text-foreground shadow-xs font-black' : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualMode('preview')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        manualMode === 'preview' ? 'bg-card text-foreground shadow-xs font-black' : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>
                  {manualContent && (
                    <span className="text-[11px] font-semibold text-muted bg-ground px-2 py-1 rounded-md border border-border hidden sm:inline">
                      {manualWordCount} words · ~{manualReadTime} min read
                    </span>
                  )}
                </div>
              </div>

              {manualMode === 'write' ? (
                <textarea 
                  value={manualContent} 
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste raw markdown here (e.g. from NotebookLM, Lecture notes, or textbook summaries)..."
                  className="w-full p-4 border border-border rounded-xl bg-ground h-80 font-mono text-xs sm:text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none leading-relaxed"
                />
              ) : (
                <div className="w-full p-5 border border-border rounded-xl bg-ground min-h-[320px] max-h-[500px] overflow-y-auto leading-relaxed">
                  {manualContent.trim() ? (
                    <MarkdownRenderer content={manualContent} />
                  ) : (
                    <p className="text-xs text-muted italic">Type or paste markdown to see live preview with LaTeX formatting...</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={handleManualUpload} 
                disabled={manualLoading || !manualTitle.trim() || !manualContent.trim()}
                className="w-full py-3.5 bg-gray-950 hover:bg-black text-white dark:bg-white dark:text-gray-950 font-black text-sm rounded-2xl shadow-sm active:translate-y-0.5 border-2 border-b-[4px] border-black dark:border-white transition-all disabled:opacity-40"
              >
                {manualLoading ? 'Saving...' : `Save Directly to ${department} (${examType})`}
              </button>
            </div>

            {manualStatus && (
              <div className={`p-3 text-xs font-semibold rounded-xl text-center border ${manualStatus.includes('✅') ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                {manualStatus}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── LIVE PREVIEW MODAL ──────────────────────────────────────────────── */}
      {previewItem && previewItem.content && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-border flex items-center justify-between bg-ground/50">
              <div>
                <h3 className="font-black text-base text-foreground">
                  {previewItem.inferredTitle}
                </h3>
                <p className="text-xs font-semibold text-muted flex items-center gap-2 mt-0.5">
                  <span>{department} · {examType}</span>
                  <span>•</span>
                  <span className="font-bold text-primary">
                    ~{Math.max(1, Math.ceil((previewItem.content.trim().match(/\S+/g) || []).length / 180))} min read
                  </span>
                  <span>•</span>
                  <span>{(previewItem.content.trim().match(/\S+/g) || []).length} words</span>
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-muted transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 leading-relaxed">
              <MarkdownRenderer content={previewItem.content} />
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 bg-ground/50">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 border border-border rounded-xl font-bold text-xs text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Close Preview
              </button>
              {previewItem.status !== 'published' && (
                <button
                  onClick={() => {
                    publishItem(previewItem.id);
                    setPreviewItem(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Publish Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
