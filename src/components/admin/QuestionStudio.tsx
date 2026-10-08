'use client';

import React, { useState, useMemo } from 'react';
import { MathText } from '@/components/MathText';
import { saveQuestion, deleteQuestion, bulkImportQuestions } from '@/app/actions/admin';
import {
  Plus,
  Upload,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface QuestionItem {
  id: string;
  exam_type: string;
  subject: string;
  year_ec?: number | null;
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  answer: string;
  explanation?: string | null;
}

interface QuestionStudioProps {
  initialQuestions: QuestionItem[];
}

export function QuestionStudio({ initialQuestions }: QuestionStudioProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [search, setSearch] = useState('');
  const [filterExam, setFilterExam] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuestionItem> | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkFormat, setBulkFormat] = useState<'json' | 'csv'>('json');

  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync with prop updates
  React.useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const uniqueSubjects = useMemo(() => {
    const set = new Set(questions.map(q => q.subject).filter(Boolean));
    return Array.from(set).sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch =
        search === '' ||
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.id.toLowerCase().includes(search.toLowerCase()) ||
        q.subject.toLowerCase().includes(search.toLowerCase());

      const matchesExam = filterExam === 'all' || q.exam_type.toLowerCase() === filterExam.toLowerCase();
      const matchesSubject = filterSubject === 'all' || q.subject.toLowerCase() === filterSubject.toLowerCase();

      return matchesSearch && matchesExam && matchesSubject;
    });
  }, [questions, search, filterExam, filterSubject]);

  const handleOpenAdd = () => {
    setEditingQuestion({
      exam_type: 'entrance',
      subject: uniqueSubjects[0] || 'Mathematics',
      year_ec: 2016,
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      answer: 'A',
      explanation: '',
    });
    setPreviewMode(false);
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.question || !editingQuestion?.subject || !editingQuestion?.option_a || !editingQuestion?.option_b) {
      setFeedback({ type: 'error', message: 'Please provide question text, subject, and at least options A and B.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await saveQuestion({
        id: editingQuestion.id,
        exam_type: editingQuestion.exam_type || 'entrance',
        subject: editingQuestion.subject || 'General',
        year_ec: editingQuestion.year_ec,
        question: editingQuestion.question || '',
        option_a: editingQuestion.option_a || '',
        option_b: editingQuestion.option_b || '',
        option_c: editingQuestion.option_c || '',
        option_d: editingQuestion.option_d || '',
        answer: editingQuestion.answer || '',
        explanation: editingQuestion.explanation,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Question saved successfully!' });
        setEditingQuestion(null);
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to save question.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (question: QuestionItem) => {
    const confirmed = window.confirm(`Delete question ID: ${question.id}?\nThis action cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await deleteQuestion(question.id);
      if (res.success) {
        setQuestions(prev => prev.filter(q => q.id !== question.id));
        setFeedback({ type: 'success', message: 'Question deleted successfully.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete question.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkInput.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      let parsed: any[] = [];
      if (bulkFormat === 'json') {
        parsed = JSON.parse(bulkInput);
      } else {
        // Parse CSV format
        const lines = bulkInput.trim().split('\n');
        if (lines.length <= 1) throw new Error('CSV must contain a header line and at least 1 data row.');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        parsed = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = values[i] || '';
          });
          return obj;
        });
      }

      if (!Array.isArray(parsed)) throw new Error('Input must evaluate to an array of question records.');

      const res = await bulkImportQuestions(parsed);
      if (res.success) {
        setFeedback({ type: 'success', message: `Imported ${res.count} questions successfully!` });
        setIsBulkOpen(false);
        setBulkInput('');
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Import failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Invalid format.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border border-border/80 p-4 rounded-2xl shadow-tactile-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search question, subject, ID..."
              className="w-full pl-9 pr-3.5 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs focus:border-primary/60 outline-none"
            />
          </div>

          <select
            value={filterExam}
            onChange={e => setFilterExam(e.target.value)}
            className="px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none cursor-pointer"
          >
            <option value="all">All Exam Tracks</option>
            <option value="entrance">Grade 12 Entrance</option>
            <option value="freshman">University Freshman</option>
            <option value="exit">Exit Exam</option>
          </select>

          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none cursor-pointer"
          >
            <option value="all">All Subjects ({uniqueSubjects.length})</option>
            {uniqueSubjects.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="px-3 py-2 bg-ground hover:bg-black/5 dark:hover:bg-white/5 border border-border text-foreground font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-muted" />
            <span>Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-tactile-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-card border border-border/80 rounded-3xl shadow-tactile-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-ground/50 border-b border-border/80">
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs w-[50%]">Question</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Subject</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Track</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs text-center">Answer</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q: QuestionItem) => (
                <tr
                  key={q.id}
                  className="border-b border-border/40 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4">
                    <p className="font-bold text-foreground text-sm line-clamp-2">
                      <MathText content={q.question} />
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted font-mono">{q.id.slice(0, 8)}...</span>
                      {q.year_ec && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-muted">
                          {q.year_ec} E.C.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-foreground/80 text-xs">{q.subject}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-accent-gold/15 text-accent-gold border border-accent-gold/30 uppercase tracking-wide">
                      {q.exam_type}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {q.answer ? (
                      <span className="inline-block px-2 py-1 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {q.answer}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium text-muted-foreground bg-ground border border-border">
                        None
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestion(q);
                          setPreviewMode(false);
                        }}
                        aria-label={`Edit question ${q.id}`}
                        className="p-1.5 rounded-xl border border-border bg-ground hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 transition-all"
                        title="Edit question"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q)}
                        aria-label={`Delete question ${q.id}`}
                        className="p-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredQuestions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted font-bold text-sm">
                    No questions found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold text-foreground">
                {editingQuestion.id ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                aria-label="Close modal"
                className="p-1 rounded-lg text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                    Exam Track
                  </label>
                  <select
                    value={editingQuestion.exam_type || 'entrance'}
                    onChange={e => setEditingQuestion({ ...editingQuestion, exam_type: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                  >
                    <option value="entrance">Grade 12 Entrance</option>
                    <option value="freshman">University Freshman</option>
                    <option value="exit">Exit Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Subject</label>
                  <input
                    type="text"
                    value={editingQuestion.subject || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, subject: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Year (E.C.)</label>
                  <input
                    type="number"
                    value={editingQuestion.year_ec || ''}
                    onChange={e =>
                      setEditingQuestion({
                        ...editingQuestion,
                        year_ec: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g. 2016"
                    className="w-full px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Question Text (supports LaTeX $...$)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{previewMode ? 'Edit Mode' : 'KaTeX Live Preview'}</span>
                  </button>
                </div>

                {previewMode ? (
                  <div className="p-3 border border-border rounded-xl bg-ground min-h-[90px] text-sm text-foreground">
                    <MathText content={editingQuestion.question || 'Nothing to preview'} />
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    value={editingQuestion.question || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                    placeholder="e.g. What is the value of $\int_0^1 x^2 dx$?"
                    className="w-full p-3 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                    Option A
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.option_a || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, option_a: e.target.value })}
                    placeholder="Option A"
                    className="w-full px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                    Option B
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.option_b || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, option_b: e.target.value })}
                    placeholder="Option B"
                    className="w-full px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                    Option C
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.option_c || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, option_c: e.target.value })}
                    placeholder="Option C"
                    className="w-full px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                    Option D
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.option_d || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, option_d: e.target.value })}
                    placeholder="Option D"
                    className="w-full px-3 py-2 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                  Correct Answer Key
                </label>
                <div className="flex items-center gap-2">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, answer: opt })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        editingQuestion.answer === opt
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                          : 'bg-ground text-muted hover:bg-black/5 dark:hover:bg-white/5 border-border'
                      }`}
                    >
                      Option {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                  Explanation (optional)
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="Detailed rationale for the correct answer..."
                  className="w-full p-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-tactile-sm disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold text-foreground">Bulk Import Questions</h3>
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                aria-label="Close modal"
                className="p-1 rounded-lg text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <button
                type="button"
                onClick={() => setBulkFormat('json')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  bulkFormat === 'json'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                JSON Array
              </button>
              <button
                type="button"
                onClick={() => setBulkFormat('csv')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  bulkFormat === 'csv'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                CSV Format
              </button>
            </div>

            <div>
              <p className="text-xs text-muted mb-2">
                {bulkFormat === 'json'
                  ? 'Paste a JSON array of objects with keys: exam_type, subject, year_ec, question, option_a, option_b, option_c, option_d, answer, explanation.'
                  : 'Paste comma-separated rows with header: exam_type,subject,year_ec,question,option_a,option_b,option_c,option_d,answer,explanation.'}
              </p>
              <textarea
                rows={8}
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value)}
                placeholder={
                  bulkFormat === 'json'
                    ? `[\n  {\n    "exam_type": "entrance",\n    "subject": "Physics",\n    "year_ec": 2016,\n    "question": "What is the SI unit of force?",\n    "option_a": "Joule",\n    "option_b": "Newton",\n    "option_c": "Pascal",\n    "option_d": "Watt",\n    "answer": "B"\n  }\n]`
                    : `exam_type,subject,year_ec,question,option_a,option_b,option_c,option_d,answer,explanation\nentrance,Physics,2016,What is the SI unit of force?,Joule,Newton,Pascal,Watt,B,Newton is kg*m/s^2`
                }
                className="w-full p-3 font-mono text-xs border border-border rounded-xl bg-ground text-foreground outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={loading || !bulkInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-tactile-sm disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? 'Importing...' : 'Parse & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
