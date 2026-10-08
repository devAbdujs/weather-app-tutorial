import React from 'react';
import { getQuestions } from '@/app/actions/admin';
import { QuestionStudio } from '@/components/admin/QuestionStudio';

export default async function AdminQuestionsPage() {
  const questions = await getQuestions(100);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Questions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Exam question bank and KaTeX math editor.</p>
        </div>
        <span className="text-xs font-mono font-medium text-muted-foreground px-2.5 py-1 rounded-lg bg-ground border border-border">
          {questions.length} loaded
        </span>
      </header>

      <QuestionStudio initialQuestions={questions} />
    </div>
  );
}
