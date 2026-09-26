import React from 'react';
import { getQuestions } from '@/app/actions/admin';
import { BookOpen } from 'lucide-react';

export default async function AdminQuestionsPage() {
  const questions = await getQuestions(100);

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Question Bank</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Showing the latest 100 questions from the database.</p>
        </div>
        <div className="bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] border border-[hsl(145,42%,38%)]/20 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span className="tabular-nums">{questions.length} Questions</span>
        </div>
      </header>

      <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-bespoke-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ground/50 border-b border-black/[0.06] dark:border-white/[0.08]">
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs w-1/2">Question</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Subject</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Exam</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-right">Year</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q: any) => (
                <tr key={q.id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2">{q.question}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1 text-ellipsis overflow-hidden">ID: {q.id}</p>
                  </td>
                  <td className="p-4 font-bold text-gray-600 dark:text-gray-400 text-sm">
                    {q.subject}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-primary/5 text-gray-900 dark:text-gray-100 rounded-lg text-xs font-bold border border-primary/10 uppercase tracking-wider">
                      {q.exam_type}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-gray-900 dark:text-gray-100 tabular-nums">
                    {q.year_ec || '—'}
                  </td>
                </tr>
              ))}
              
              {questions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400 font-bold">
                    No questions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
