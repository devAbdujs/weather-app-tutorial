'use client';
import { toast } from 'sonner';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Loader2, 
  Send, 
  Sparkles, 
  GraduationCap, 
  Camera, 
  Mic,
  ChevronRight,
  BookOpen,
  Target,
  CheckCircle2,
  Brain,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
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
  noteId?: string;
  noteText?: string;
  selectedExcerpt?: string;
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

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({ 
  mode = 'exam', 
  noteId,
  noteText, 
  selectedExcerpt,
  question, 
  isOpen, 
  onClose, 
  studentAnswer 
}) => {
  const { haptic } = useTelegram();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPromptsMenu, setShowPromptsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcoming message
  useEffect(() => {
    if (isOpen) {
      if (selectedExcerpt) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `👋 **Hello! I'm Temari AI, your study companion.**\n\nI have loaded this excerpt from your note:\n> *"**${selectedExcerpt.slice(0, 160)}${selectedExcerpt.length > 160 ? '...' : ''}**"*\n\nTap **"Explain Highlighted Text"** below or ask me any question about it!`
        }]);
      } else if (messages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: mode === 'exam' 
            ? "👋 **Hello! I'm Temari AI, your exam study companion.** \n\nI have this question loaded. Pick a guidance action below or type your custom question!"
            : "👋 **Hello! I'm Temari AI, your textbook study companion.** \n\nI have read this chapter note. Pick an action below or ask me anything you want clarified!"
        }]);
      }
    }
  }, [isOpen, mode, selectedExcerpt]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const sendMessage = async (
    type: 'explain' | 'eli5' | 'amharic' | 'summary' | 'chat', 
    customUserText?: string,
    customDisplayText?: string
  ) => {
    haptic.impact('light');
    setShowPromptsMenu(false);
    
    let userText = customUserText || '';
    let displayText = customDisplayText || userText;

    if (type === 'explain' && !customUserText) {
      userText = 'Please explain the correct answer to me in detail and show me the step-by-step reasoning.';
      displayText = '📖 Explain the solution';
    }
    if (type === 'summary' && !customUserText) {
      userText = 'Please summarize the 3 most crucial takeaways and exam-focused points from this chapter note.';
      displayText = '📝 Chapter Key Takeaways';
    }
    if (type === 'amharic' && !customUserText) {
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
          selectedExcerpt: selectedExcerpt || undefined,
          questionId: (!selectedExcerpt && noteId) ? `note:${noteId}` : question?.id,
          subject: question?.subject,
          questionText: question?.question,
          options: question ? [question.option_a, question.option_b, question.option_c, question.option_d] : undefined,
          correctAnswer: question?.answer,
          explanation: question?.explanation,
          promptType: type,
          // Only send actual user/assistant conversational turns to the AI, excluding welcome banner
          chatHistory: updatedMessages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content }))
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

  // ── VERTICALLY STACKED QUICK PROMPT ACTIONS ──────────────────────────
  const examPrompts = [
    {
      id: 'explain',
      icon: CheckCircle2,
      title: 'Full Step-by-Step Solution',
      desc: 'Detailed breakdown of why the correct choice is right',
      tint: 'bg-tint-green text-tint-green-fg border-tint-green-border',
      iconBg: 'text-emerald-600 bg-white/90 dark:bg-black/40',
      action: () => sendMessage('explain', 'Please explain the correct answer in detail with clear step-by-step reasoning.', '📖 Explain the solution'),
    },
    {
      id: 'amharic',
      icon: Globe,
      title: 'በአማርኛ ማብራሪያ',
      desc: 'ጥያቄውን እና የትክክለኛውን መልስ ማብራሪያ በአማርኛ አስረዳኝ',
      tint: 'bg-tint-sky text-tint-sky-fg border-tint-sky-border',
      iconBg: 'text-sky-600 bg-white/90 dark:bg-black/40',
      action: () => sendMessage('amharic', 'Please translate the core problem and explain the solution in clear, natural Amharic (አማርኛ).', '🇪🇹 በአማርኛ አስረዳኝ'),
    },
    {
      id: 'concept',
      icon: Brain,
      title: 'Core Concept & Exam Traps',
      desc: 'Key formulas, principles, or common mistakes in this question',
      tint: 'bg-tint-purple text-tint-purple-fg border-tint-purple-border',
      iconBg: 'text-purple-600 bg-white/90 dark:bg-black/40',
      action: () => sendMessage('eli5', 'What core formula, scientific principle, or common exam trap does this question test? Explain clearly.', '🧠 Core concept & exam traps'),
    },
  ];

  const notePrompts = [
    ...(selectedExcerpt ? [{
      id: 'excerpt',
      icon: Sparkles,
      title: 'Explain Highlighted Text',
      desc: 'Unpack the meaning, formulas, and intuition of your selection',
      tint: 'bg-tint-purple text-tint-purple-fg border-tint-purple-border',
      iconBg: 'text-purple-600 bg-white/90 dark:bg-black/40',
      action: () => sendMessage('chat', `Please explain this highlighted excerpt in simple terms with clear intuition and examples: "${selectedExcerpt}"`, '✨ Explain Highlighted Text'),
    }] : []),
    {
      id: 'summary',
      icon: BookOpen,
      title: 'Chapter Key Takeaways',
      desc: '3 most crucial exam-focused takeaways from this note',
      tint: 'bg-tint-peach text-tint-peach-fg border-tint-peach-border',
      iconBg: 'text-amber-600 bg-white/90 dark:bg-black/40',
      action: () => sendMessage('summary', 'Please summarize the 3 most crucial takeaways and exam-focused points from this chapter note.', '📝 Chapter Key Takeaways'),
    },
    {
      id: 'quiz',
      icon: Target,
      title: 'Generate Practice Question',
      desc: 'Quiz me with an exam-style multiple-choice question on this note',
      tint: 'bg-tint-green text-tint-green-fg border-tint-green-border',
      iconBg: 'text-emerald-600 bg-white/90 dark:bg-black/40',
      action: () => sendMessage('chat', 'Generate a realistic multiple-choice exam question based strictly on this chapter note with 4 options (A, B, C, D). Wait for me to answer before revealing the solution.', '🎯 Generate Practice Quiz'),
    },
    {
      id: 'amharic',
      icon: Globe,
      title: 'ዋና ዋና ነጥቦች በአማርኛ',
      desc: 'የዚህን ምዕራፍ ዋና ዋና ጽንሰ-ሀሳቦች በአማርኛ አጠቃልልልኝ',
      tint: 'bg-tint-sky text-tint-sky-fg border-tint-sky-border',
      iconBg: 'text-sky-600 bg-white/90 dark:bg-black/40',
      action: () => sendMessage('amharic', 'የዚህን ምዕራፍ ዋና ዋና ጽንሰ-ሀሳቦች እና ፈተና ላይ ሊወጡ የሚችሉ ነጥቦችን በአማርኛ አጠቃልለህ አስረዳኝ።', '🇪🇹 ዋና ዋና ነጥቦች በአማርኛ'),
    },
    {
      id: 'analogy',
      icon: Sparkles,
      title: 'Simplify Tough Concept',
      desc: 'Break down the most complex idea here with a simple analogy',
      tint: 'bg-tint-purple text-tint-purple-fg border-tint-purple-border',
      iconBg: 'text-purple-600 bg-white/90 dark:bg-black/40',
      action: () => sendMessage('eli5', 'Take the most difficult or complex concept in this chapter note and explain it using a simple, intuitive real-world analogy.', '💡 Explain tough concept simply'),
    },
  ];

  const activePrompts = mode === 'exam' ? examPrompts : notePrompts;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in transition-all duration-300">
      <div className="w-full max-w-lg bg-card border-t border-black/[0.06] dark:border-white/[0.08] rounded-t-modal p-4 sm:p-5 max-h-[92vh] h-[92vh] flex flex-col shadow-2xl animate-drawer-up">
        {/* Premium Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
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
                <GraduationCap className="w-3.5 h-3.5 text-primary" /> {mode === 'exam' ? 'Exam Problem Solver' : 'Chapter Note Companion'}
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

        {/* ── CONTEXT PILL CARD (Question or Note snippet) ── */}
        <div className="pt-2 shrink-0">
          {mode === 'exam' && question && (
            <div className="p-2.5 bg-ground border border-black/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-black uppercase text-micro shrink-0">
                  {question.subject || 'Question'}
                </span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {question.question.replace(/\n/g, ' ')}
                </span>
              </div>
              {studentAnswer ? (
                <span className="px-2 py-0.5 rounded-md bg-accent-gold/20 text-accent-gold font-mono font-black text-micro shrink-0 ml-2">
                  Choice: {studentAnswer}
                </span>
              ) : (
                <span className="text-micro font-bold text-slate-400 shrink-0 ml-2">
                  Unanswered
                </span>
              )}
            </div>
          )}

          {mode === 'notes' && (
            <div className="p-2.5 bg-ground border border-black/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-lg bg-accent-purple/15 text-accent-purple font-black uppercase text-micro shrink-0">
                  Chapter Guide
                </span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                  Active study note loaded for analysis
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mid-chat Collapsible Toggle for Quick Prompts */}
        {messages.length > 1 && (
          <div className="pt-2 shrink-0">
            <button
              onClick={() => { sounds.playTap(); setShowPromptsMenu(!showPromptsMenu); }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-card border border-black/[0.08] dark:border-white/[0.08] text-xs font-black text-gray-700 dark:text-gray-300 hover:text-primary transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{mode === 'exam' ? 'Question Actions' : 'Chapter Actions'}</span>
              </span>
              {showPromptsMenu ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* ── VERTICALLY STACKED PROMPT CARDS (Collapsible in chat, default when fresh) ── */}
        {(messages.length <= 1 || showPromptsMenu) && (
          <div className="pt-2 pb-1 space-y-2 shrink-0 animate-fade-in">
            {activePrompts.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => { sounds.playTap(); p.action(); }}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border-2 border-b-[3px] text-left transition-all active:translate-y-[1px] shadow-tactile-xs hover:brightness-105 ${p.tint}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border border-current/10 ${p.iconBg}`}>
                      <Icon className="w-5 h-5 stroke-[2.4]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black leading-tight truncate">
                        {p.title}
                      </h4>
                      <p className="text-micro font-medium opacity-85 mt-0.5 truncate">
                        {p.desc}
                      </p>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-gray-950 text-white dark:bg-white dark:text-gray-950 flex items-center justify-center shrink-0 shadow-2xs">
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.8]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3.5 text-sm leading-relaxed text-gray-900 dark:text-gray-100 custom-scrollbar pr-1 mt-1">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full animate-fade-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-tint-cream border border-tint-cream-border flex items-center justify-center mr-2 shrink-0 self-end mb-1 shadow-2xs">
                  <TemariMascot mood="happy" size={24} animate={false} />
                </div>
              )}
              <div className={`p-4 rounded-3xl max-w-[85%] font-sans shadow-tactile-xs ${
                msg.role === 'user' 
                  ? 'bg-gray-950 text-white dark:bg-[#202938] dark:text-white border border-black/10 dark:border-white/10 rounded-br-xs font-semibold whitespace-pre-line shadow-tactile-xs' 
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
            className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-950 hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 text-white disabled:opacity-30 transition-all shrink-0 shadow-tactile-xs active:scale-95 border-2 border-b-[4px] border-black dark:border-white"
            title="Send query"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
