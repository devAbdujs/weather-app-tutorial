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
      <h1 className="text-3xl font-black text-primary mb-6 tracking-tight">Upload Short Note</h1>
      <p className="text-tertiary mb-8 font-medium">Paste raw markdown generated from NotebookLM to insert directly into the database.</p>
      
      <div className="bg-card border-2 border-primary/10 rounded-3xl p-8 shadow-sm max-w-4xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-secondary">Exam Type</label>
              <select 
                value={examType} onChange={(e) => setExamType(e.target.value)}
                className="w-full p-4 border-2 border-primary/20 rounded-xl bg-ground font-bold focus:border-primary focus:outline-none transition-colors"
              >
                <option value="freshman">University Freshman</option>
                <option value="entrance">Grade 12 EUEE</option>
                <option value="exit">University Exit Exam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-secondary">Course / Department</label>
              <input 
                type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Applied Mathematics I"
                className="w-full p-4 border-2 border-primary/20 rounded-xl bg-ground font-bold focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-secondary">Chapter Title</label>
            <input 
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Limits and Continuity"
              className="w-full p-4 border-2 border-primary/20 rounded-xl bg-ground font-bold focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-secondary">NotebookLM Markdown</label>
            <textarea 
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw markdown here..."
              className="w-full p-4 border-2 border-primary/20 rounded-xl bg-ground h-96 font-mono text-sm focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <button 
            onClick={handleUpload} disabled={loading}
            className="w-full py-5 bg-primary text-white font-black rounded-xl border-b-4 border-black/20 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
          >
            {loading ? 'UPLOADING...' : 'SAVE TO DATABASE'}
          </button>

          {status && (
            <div className={`p-4 font-bold rounded-xl text-center ${status.includes('✅') ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-error/10 text-error'}`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
