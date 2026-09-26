'use client';
import { toast } from 'sonner';

import React, { useState, useRef, useEffect } from 'react';
import { X, Lightbulb, Globe, Loader2, Send, User, Sparkles, GraduationCap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
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
          ? "👋 **Hello! I'm Temari AI, your study companion.** \n\nLet's tackle this question together! You can ask me for a hint, an Amharic translation, or simply ask whatever is on your mind."
          : "👋 **Hello! I'm Temari AI, your study companion.** \n\nI have read this chapter. Ask me any custom question you have, and I will explain it to you!"
      }]);
    }
  }, [isOpen, mode, messages.length]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const sendMessage = async (type: 'hint' | 'explain' | 'amharic' | 'chat', customUserText?: string) => {
    haptic.impact('light');
    
    let userText = customUserText || '';
    let displayText = userText;

    if (type === 'hint') {
      userText = 'Please give me a small, guiding hint to help me understand this. Do not give me the full answer directly.';
      displayText = '💡 Give me a hint';
    }
    if (type === 'explain') {
      userText = 'Please explain the correct answer to me in detail.';
      displayText = '💡 Explain the answer';
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

      if (!res.ok) {
        // Special handling for free users hitting the paywall
        if (res.status === 403) {
          setMessages(prev => prev.map(m => m.id === assistantMsgId ? { 
            ...m, 
            content: '🔒 **AI Tutor is a Premium Feature**\n\nUpgrade your account to unlock unlimited access to Temari AI, AI-generated quizzes, and Amharic explanations.\n\n👉 Go to your **Profile → Upgrade** to unlock premium for just **199 ETB/term**.'
          } : m));
          setIsLoading(false);
          return;
        }
        let errMessage = 'Failed to get AI response';
        try {
          const errData = await res.json();
          if (errData?.error) errMessage = errData.error;
        } catch (e) {}
        throw new Error(errMessage);
      }

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
      toast.error('AI Tutor is unavailable right now. Please try again in a moment.');
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: `⚠️ Connection lost. ${msg}` } : m));
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in transition-all duration-500">
      <div className="w-full max-w-lg bg-[#F8F9FA] dark:bg-ground border-t border-black/5 dark:border-white/10 rounded-t-3xl p-5 max-h-[90vh] h-[90vh] flex flex-col shadow-2xl animate-drawer-up">
        {/* Premium Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-indigo-600 border border-indigo-500/20 shadow-sm">
              <User className="w-6 h-6" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#F8F9FA]" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-[17px] flex items-center gap-2 tracking-tight">
                Temari AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-indigo-500" /> Your study partner
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.selection();
              onClose();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Quick Action Chips */}
        <div className="flex gap-2.5 py-4 overflow-x-auto no-scrollbar shrink-0 -mx-5 px-5">
          <button
            onClick={() => sendMessage(studentAnswer ? 'explain' : 'hint')}
            disabled={isLoading}
            className="flex items-center gap-2 text-[13px] px-4 py-2.5 rounded-full font-bold border transition-all whitespace-nowrap bg-white dark:bg-card border-black/5 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] active:opacity-80 shadow-sm"
          >
            <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            {mode === 'exam' 
              ? (studentAnswer ? 'Explain the Answer' : 'Give me a Hint') 
              : 'Summarize This'}
          </button>

          <button
            onClick={() => sendMessage('amharic')}
            disabled={isLoading}
            className="flex items-center gap-2 text-[13px] px-4 py-2.5 rounded-full font-bold border transition-all whitespace-nowrap bg-white dark:bg-card border-black/5 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] active:opacity-80 shadow-sm"
          >
            <Globe className="w-4 h-4 text-blue-500" />
            በአማርኛ አስረዳኝ
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto py-2 space-y-6 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 custom-scrollbar pr-2">
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60 animate-fade-up">
              <User className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Don't know the answer?<br/>Just ask!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full animate-fade-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 mr-2.5 shrink-0 self-end mb-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className={`p-4 rounded-2xl max-w-[85%] font-sans shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm font-medium whitespace-pre-line' 
                  : 'bg-white dark:bg-card border border-slate-200/80 dark:border-white/10 rounded-bl-sm text-slate-900 dark:text-slate-100'
              }`}>
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-slate-900 dark:prose-p:text-slate-100 dark:text-slate-100 prose-headings:text-slate-900 dark:prose-headings:text-slate-100 dark:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 dark:text-slate-100 prose-li:text-slate-900 dark:prose-li:text-slate-100 dark:text-slate-100 prose-a:text-blue-600 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:text-slate-900 dark:prose-pre:text-slate-100 dark:text-slate-100 font-medium tracking-tight">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500 py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span className="text-sm font-medium animate-pulse text-indigo-400">Thinking...</span>
                    </div>
                  )
                ) : (
                  msg.displayText || msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-1" />
        </div>
        
        {/* Floating Input Box */}
        <form onSubmit={handleFormSubmit} className="pt-4 border-t border-black/5 dark:border-white/10 shrink-0 mt-2 flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Temari AI..."
            disabled={isLoading}
            className="flex-1 bg-white dark:bg-card border border-black/10 dark:border-white/20 rounded-full px-6 py-4 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 hover:opacity-90 disabled:from-black/5 disabled:to-black/5 dark:disabled:from-white/10 dark:disabled:to-white/10 disabled:text-slate-400 dark:text-slate-500 text-white transition-all shrink-0 shadow-md disabled:shadow-none active:scale-[0.98] active:opacity-80"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>

      </div>
    </div>
  );
};
