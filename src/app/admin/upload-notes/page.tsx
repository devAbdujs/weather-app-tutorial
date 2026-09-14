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
    <div className="min-h-screen bg-ground p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-card border-2 border-primary rounded-3xl p-8 shadow-[8px_8px_0px_#1a1a1a]">
        <h1 className="text-3xl font-black text-primary mb-6 tracking-tight">Admin: Upload Short Note</h1>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Exam Type</label>
              <select 
                value={examType} onChange={(e) => setExamType(e.target.value)}
                className="w-full p-3 border-2 border-primary rounded-xl bg-ground font-bold"
              >
                <option value="freshman">University Freshman</option>
                <option value="entrance">Grade 12 EUEE</option>
                <option value="exit">University Exit Exam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Course / Department</label>
              <input 
                type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Applied Mathematics I"
                className="w-full p-3 border-2 border-primary rounded-xl bg-ground font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Chapter Title</label>
            <input 
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Limits and Continuity"
              className="w-full p-3 border-2 border-primary rounded-xl bg-ground font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">NotebookLM Markdown</label>
            <textarea 
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw markdown here..."
              className="w-full p-3 border-2 border-primary rounded-xl bg-ground h-64 font-mono text-sm"
            />
          </div>

          <button 
            onClick={handleUpload} disabled={loading}
            className="w-full py-4 bg-primary text-white font-black rounded-xl border-b-4 border-black active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
          >
            {loading ? 'UPLOADING...' : 'SAVE TO DATABASE'}
          </button>

          {status && (
            <div className={`p-4 font-bold rounded-xl ${status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
