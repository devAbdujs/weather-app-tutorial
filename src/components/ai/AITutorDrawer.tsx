'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Lightbulb, Globe, Loader2, Send, Bot } from 'lucide-react';
import { MathText } from '@/components/MathText';
import { Question } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';

interface AITutorDrawerProps {
  mode?: 'exam' | 'notes';
  noteText?: string;
  question?: Question;
  isOpen: boolean;
  onClose: () => void;
  studentAnswer?: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayText?: string;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({ mode = 'exam', noteText, question, isOpen, onClose, studentAnswer }) => {
  const { haptic } = useTelegram();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcoming message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: mode === 'exam' 
          ? "👋 **Hello! I'm Mr. Helper, your AI Tutor.** \n\nLet's tackle this question together! You can ask me for a hint, an Amharic translation, or simply ask whatever is on your mind."
          : "👋 **Hello! I'm Mr. Helper, your AI Tutor.** \n\nI have read this chapter. Ask me any custom question you have, and I will explain it to you!"
      }]);
    }
  }, [isOpen, mode, messages.length]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const sendMessage = async (type: 'hint' | 'amharic' | 'chat', customUserText?: string) => {
    haptic.impact('light');
    
    let userText = customUserText || '';
    let displayText = userText;

    if (type === 'hint') {
      userText = 'Please give me a small, guiding hint to help me understand this. Do not give me the full answer directly.';
      displayText = '💡 Give me a hint';
    }
    if (type === 'amharic') {
      userText = 'Please translate the main idea and explain it simply in Amharic.';
      displayText = '🇪🇹 በአማርኛ አስረዳኝ';
    }
    
    if (!userText.trim()) return;

    const newUserMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userText,
      displayText: displayText
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          noteText,
          questionText: question?.question,
          options: question ? [question.option_a, question.option_b, question.option_c, question.option_d] : undefined,
          correctAnswer: question?.answer,
          explanation: question?.explanation,
          promptType: type,
          studentAnswer,
          // Only send actual content to the AI, not the UI display text
          chatHistory: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) throw new Error('Failed to get AI response');

      const reader = res.body?.getReader();
      if (!reader) {
        const text = await res.text();
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: text } : m));
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        
        setMessages(prev => 
          prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulated } : m)
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: `⚠️ Failed to connect to Mr. Helper: ${msg}` } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage('chat', input);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 max-h-[90vh] h-[90vh] flex flex-col shadow-2xl">
        {/* Header - Brand Refresh */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-base flex items-center gap-1.5 tracking-tight">
                Mr. Helper
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI Tutor
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">Your personal study companion</p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.selection();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => sendMessage('hint')}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-[13px] px-3.5 py-2 rounded-xl font-bold border transition-all whitespace-nowrap bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 active:scale-95"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            {mode === 'exam' ? 'Give me a Hint' : 'Summarize This'}
          </button>

          <button
            onClick={() => sendMessage('amharic')}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-[13px] px-3.5 py-2 rounded-xl font-bold border transition-all whitespace-nowrap bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 active:scale-95"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            በአማርኛ አስረዳኝ
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto py-2 space-y-5 text-[15px] leading-relaxed text-slate-200 custom-scrollbar pr-1">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-[90%] whitespace-pre-line font-sans shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm font-medium' 
                  : 'bg-slate-800/80 border border-slate-700/60 rounded-tl-sm text-slate-200'
              }`}>
                {msg.role === 'assistant' ? (
                  msg.content ? <MathText content={msg.content} /> : <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  msg.displayText || msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-1" />
        </div>
        
        {/* Chat Input Box */}
        <form onSubmit={handleFormSubmit} className="pt-3 border-t border-slate-800 shrink-0 mt-2 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Mr. Helper a question..."
            disabled={isLoading}
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-14 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-colors shrink-0 shadow-sm active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
};
