'use client';

import React, { useState } from 'react';
import { Sparkles, X, Lightbulb, Baby, Globe, Loader2 } from 'lucide-react';
import { MathText } from '@/components/MathText';
import { Question } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';

interface AITutorDrawerProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({ question, isOpen, onClose }) => {
  const { haptic } = useTelegram();
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activePrompt, setActivePrompt] = useState<string>('');

  if (!isOpen) return null;

  const handlePrompt = async (type: 'hint' | 'eli5' | 'amharic') => {
    haptic.impact('light');
    setActivePrompt(type);
    setIsLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.question,
          options: [question.option_a, question.option_b, question.option_c, question.option_d],
          correctAnswer: question.answer,
          explanation: question.explanation,
          promptType: type
        })
      });

      if (!res.ok) throw new Error('Failed to get AI response');

      const reader = res.body?.getReader();
      if (!reader) {
        const text = await res.text();
        setResponse(text);
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setResponse(accumulated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setResponse(`⚠️ Failed to connect to AI Tutor: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                AI Master Tutor
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-medium px-1.5 py-0.5 rounded">
                  Gemini 2.5
                </span>
              </h3>
              <p className="text-xs text-slate-400">Instant explanations & conceptual hints</p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.selection();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar border-b border-slate-800/60">
          <button
            onClick={() => handlePrompt('hint')}
            disabled={isLoading}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium border transition-all whitespace-nowrap ${
              activePrompt === 'hint'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Give me a Hint
          </button>

          <button
            onClick={() => handlePrompt('eli5')}
            disabled={isLoading}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium border transition-all whitespace-nowrap ${
              activePrompt === 'eli5'
                ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Baby className="w-3.5 h-3.5 text-emerald-400" />
            Explain Like I&apos;m 5
          </button>

          <button
            onClick={() => handlePrompt('amharic')}
            disabled={isLoading}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium border transition-all whitespace-nowrap ${
              activePrompt === 'amharic'
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            በአማርኛ አስረዳኝ
          </button>
        </div>

        {/* Response Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 text-sm leading-relaxed text-slate-200">
          {!response && !isLoading && (
            <div className="text-center py-8 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>Select an option above to get immediate AI guidance for this question.</p>
            </div>
          )}

          {isLoading && !response && (
            <div className="flex items-center justify-center py-8 text-blue-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Tutor is analyzing curriculum and formula concepts...</span>
            </div>
          )}

          {response && (
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 whitespace-pre-line font-sans">
              <MathText content={response} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
