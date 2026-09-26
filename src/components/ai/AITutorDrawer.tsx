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
          let customMsg = '🔒 **AI Tutor Limit Reached**\n\nUpgrade your account to unlock 150 Temari AI questions/week, full past exam archives, and chapter notes.\n\n👉 Head to your **Profile → Upgrade** to unlock premium for just **199 ETB/term**.';
          try {
            const errData = await res.json();
            if (errData?.message) {
              customMsg = `🔒 **Weekly AI Quota Reached**\n\n${errData.message}\n\n👉 Head to **Profile → Upgrade** to unlock **150 questions/week** for just **199 ETB/term**!`;
            }
          } catch (e) {}
          setMessages(prev => prev.map(m => m.id === assistantMsgId ? { 
            ...m, 
            content: customMsg
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in transition-all duration-300">
      <div className="w-full max-w-lg bg-card border-t border-black/[0.06] dark:border-white/[0.08] rounded-t-[28px] p-5 max-h-[90vh] h-[90vh] flex flex-col shadow-2xl animate-drawer-up">
        {/* Premium Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-[12px] bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <User className="w-5 h-5" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[hsl(145,42%,42%)] rounded-full border-2 border-card" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[16px] flex items-center gap-1.5 tracking-tight">
                Temari AI
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-primary" /> Study Companion
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.selection();
              onClose();
            }}
            className="w-8.5 h-8.5 flex items-center justify-center rounded-[10px] bg-ground border border-black/[0.06] dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 active:scale-95 transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Floating Quick Action Chips */}
        <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar shrink-0 -mx-5 px-5">
          <button
            onClick={() => sendMessage(studentAnswer ? 'explain' : 'hint')}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-[12px] font-bold border transition-all whitespace-nowrap bg-ground border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:border-black/20 dark:hover:border-white/20 active:scale-[0.98] shadow-sm"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            {mode === 'exam' 
              ? (studentAnswer ? 'Explain Solution' : 'Guiding Hint') 
              : 'Summarize Chapter'}
          </button>

          <button
            onClick={() => sendMessage('amharic')}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-[12px] font-bold border transition-all whitespace-nowrap bg-ground border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:border-black/20 dark:hover:border-white/20 active:scale-[0.98] shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-[hsl(199,55%,42%)]" />
            በአማርኛ አስረዳኝ
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4 text-sm leading-relaxed text-gray-800 dark:text-gray-200 custom-scrollbar pr-1">
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50 animate-fade-up">
              <User className="w-10 h-10 text-gray-400" />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ask any question or tap a suggestion above</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full animate-fade-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-[8px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mr-2 shrink-0 self-end mb-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`p-3.5 rounded-[18px] max-w-[85%] font-sans shadow-bespoke-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-[4px] font-medium whitespace-pre-line' 
                  : 'bg-ground border border-black/[0.06] dark:border-white/[0.08] rounded-bl-[4px] text-gray-900 dark:text-gray-100'
              }`}>
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-li:text-gray-900 dark:prose-li:text-gray-100 prose-a:text-primary font-medium tracking-tight">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span className="text-xs font-medium text-primary">Thinking...</span>
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
        <form onSubmit={handleFormSubmit} className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] shrink-0 flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Temari AI..."
            disabled={isLoading}
            className="flex-1 bg-ground border border-black/[0.06] dark:border-white/[0.08] rounded-[16px] px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-primary hover:bg-primary/90 disabled:bg-black/5 dark:disabled:bg-white/5 disabled:text-gray-400 text-white transition-all duration-200 ease-bespoke shrink-0 shadow-bespoke-sm disabled:shadow-none active:scale-[0.98]"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
