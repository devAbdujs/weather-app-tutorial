import React from 'react';
import { getQuestions } from '@/app/actions/admin';
import { BookOpen } from 'lucide-react';
import { QuestionStudio } from '@/components/admin/QuestionStudio';

export default async function AdminQuestionsPage() {
  const questions = await getQuestions(100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Question Bank & Editor Studio</h1>
          <p className="text-muted font-medium mt-1">Manage, edit, live preview KaTeX math, and bulk import exam questions.</p>
        </div>
        <div className="bg-tint-green text-tint-green-fg border-2 border-b-[3px] border-tint-green-border px-4 py-2 rounded-2xl font-black flex items-center gap-2 shadow-2xs shrink-0">
          <BookOpen className="w-5 h-5" />
          <span className="tabular-nums">{questions.length} Loaded</span>
        </div>
      </header>

      <QuestionStudio initialQuestions={questions} />
    </div>
  );
}
