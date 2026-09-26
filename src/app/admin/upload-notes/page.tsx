"use client";
import React, { useState } from 'react';

export default function AdminUploadNotes() {
  const [examType, setExamType] = useState('freshman');
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!department || !title || !content) {
      setStatus('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setStatus('Formatting and uploading...');

    try {
      // Basic NotebookLM artifact cleanup (stripping numbers at end of lines like "12.")
      let cleanContent = content.replace(/\b\d+(more_horiz)?\.\n/g, '\n');
      cleanContent = cleanContent.replace(/\[\d+\]/g, ''); // strip [1], [2] citations if any
      cleanContent = cleanContent.trim();

      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType, department, title, content: cleanContent }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('✅ Successfully uploaded to Supabase!');
        setTitle('');
        setContent(''); // Keep department same for bulk uploads
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (e: unknown) {
      setStatus(`❌ Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Upload Short Note</h1>
        <p className="text-sm text-muted font-medium mt-1">Paste raw markdown generated from NotebookLM to insert directly into the database.</p>
      </div>
      
      <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-bespoke-sm max-w-4xl">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Exam Type</label>
              <select 
                value={examType} onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none cursor-pointer"
              >
                <option value="freshman">University Freshman</option>
                <option value="entrance">Grade 12 EUEE</option>
                <option value="exit">University Exit Exam</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Course / Department</label>
              <input 
                type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Applied Mathematics I"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Chapter Title</label>
            <input 
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Limits and Continuity"
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">NotebookLM Markdown</label>
            <textarea 
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw markdown here..."
              className="w-full p-4 border border-border rounded-xl bg-ground h-96 font-mono text-xs sm:text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none leading-relaxed"
            />
          </div>

          <button 
            onClick={handleUpload} disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/95 shadow-bespoke-sm active:scale-[0.99] transition-all duration-200 ease-bespoke disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Save to Database'}
          </button>

          {status && (
            <div className={`p-3 text-xs font-semibold rounded-xl text-center border ${status.includes('✅') ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
