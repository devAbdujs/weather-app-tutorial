'use client';
import { toast } from 'sonner';

import React, { useState, useRef, useEffect } from 'react';
import { X, Lightbulb, Globe, Loader2, Send, User, Sparkles, GraduationCap, Camera, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { MathText } from '@/components/MathText';
import { Question } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';
import { TemariMascot } from '@/components/mascot/TemariMascot';
import { sounds } from '@/lib/sounds';

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
      <div className="w-full max-w-lg bg-card border-t border-black/[0.06] dark:border-white/[0.08] rounded-t-modal p-5 max-h-[90vh] h-[90vh] flex flex-col shadow-2xl animate-drawer-up">
        {/* Premium Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-1 rounded-2xl bg-tint-cream border border-tint-cream-border shadow-xs">
              <TemariMascot mood="happy" size={36} animate={false} />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent-emerald rounded-full border-2 border-card" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-base flex items-center gap-1.5 tracking-tight">
                Temari AI <span className="text-primary">Tutor</span>
              </h3>
              <p className="text-caption text-gray-700 dark:text-gray-300 font-bold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-primary" /> Ethiopian Exam Companion
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              haptic.selection();
              onClose();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border-2 border-black/[0.08] dark:border-white/[0.08] text-gray-800 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white active:scale-95 shadow-2xs"
            title="Close Tutor"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Floating Quick Action Chips (Inspiration Pastel Tints) */}
        <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar shrink-0 -mx-5 px-5">
          <button
            onClick={() => { sounds.playTap(); sendMessage(studentAnswer ? 'explain' : 'hint'); }}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-black border-2 border-b-[3px] transition-all whitespace-nowrap bg-tint-peach text-tint-peach-fg border-tint-peach-border hover:brightness-105 active:scale-95 shadow-tactile-xs"
          >
            <Lightbulb className="w-4 h-4 fill-current stroke-[2.5]" />
            {mode === 'exam' 
              ? (studentAnswer ? 'Explain Solution' : 'Guiding Hint') 
              : 'Summarize Chapter'}
          </button>

          <button
            onClick={() => { sounds.playTap(); sendMessage('amharic'); }}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-black border-2 border-b-[3px] transition-all whitespace-nowrap bg-tint-sky text-tint-sky-fg border-tint-sky-border hover:brightness-105 active:scale-95 shadow-tactile-xs"
          >
            <Globe className="w-4 h-4 stroke-[2.5]" />
            🇪🇹 በአማርኛ አስረዳኝ
          </button>

          {mode === 'exam' && !studentAnswer && (
            <button
              onClick={() => { sounds.playTap(); sendMessage('explain'); }}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-black border-2 border-b-[3px] transition-all whitespace-nowrap bg-tint-purple text-tint-purple-fg border-tint-purple-border hover:brightness-105 active:scale-95 shadow-tactile-xs"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              Detailed Breakdown
            </button>
          )}
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4 text-sm leading-relaxed text-gray-900 dark:text-gray-100 custom-scrollbar pr-1">
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 animate-fade-up">
              <TemariMascot mood="studying" size={64} />
              <p className="text-xs font-black text-gray-800 dark:text-gray-200">Ask any question or tap a prompt above!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full animate-fade-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-tint-cream border border-tint-cream-border flex items-center justify-center mr-2 shrink-0 self-end mb-1 shadow-2xs">
                  <TemariMascot mood="happy" size={24} animate={false} />
                </div>
              )}
              <div className={`p-4 rounded-3xl max-w-[85%] font-sans shadow-tactile-xs ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-xs font-semibold whitespace-pre-line shadow-md shadow-orange-500/20' 
                  : 'bg-white dark:bg-[#1A222D] border border-black/[0.06] dark:border-white/[0.08] rounded-bl-xs text-gray-900 dark:text-gray-100'
              }`}>
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-li:text-gray-900 dark:prose-li:text-gray-100 prose-a:text-primary font-medium tracking-tight">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-primary py-1">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-accent-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs font-black text-primary ml-1">Teme is thinking...</span>
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
        
        {/* Floating Input Box with Camera & Mic Icons (ui_inspiration2.png) */}
        <form onSubmit={handleFormSubmit} className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08] shrink-0 flex items-center gap-2 relative">
          <div className="flex-1 flex items-center bg-white dark:bg-[#1A222D] border-2 border-black/[0.08] dark:border-white/[0.08] rounded-full px-3 py-1 focus-within:border-primary shadow-tactile-xs transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Teme anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none font-medium"
            />
            <div className="flex items-center gap-1 shrink-0 pr-1">
              <button
                type="button"
                onClick={() => { sounds.playTap(); toast.info("Photo scan: Upload question image for Gemini analysis"); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
                title="Scan question with Camera"
              >
                <Camera className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={() => { sounds.playTap(); toast.info("Voice query: Speak your question to Teme"); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
                title="Ask with voice"
              >
                <Mic className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            onClick={() => sounds.playTap()}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-primary hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-primary text-white transition-all shrink-0 shadow-md shadow-orange-500/30 active:scale-95 border-2 border-b-[4px] border-orange-700"
            title="Send query"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
