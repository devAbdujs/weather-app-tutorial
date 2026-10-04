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
import { normalizeMarkdownLaTeX } from '@/lib/latex';
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
  isSimulator?: boolean;
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
  studentAnswer,
  isSimulator = false,
}) => {
  const { haptic } = useTelegram();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPromptsMenu, setShowPromptsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track active context (question ID or note ID) to reset history across question transitions
  const activeContextKey = mode === 'exam' ? (question?.id || 'exam-unknown') : (noteId || 'notes-unknown');
  const prevContextKeyRef = useRef<string>(activeContextKey);

  useEffect(() => {
    if (prevContextKeyRef.current !== activeContextKey) {
      prevContextKeyRef.current = activeContextKey;
      setMessages([]);
    }
  }, [activeContextKey]);

  // Initialize with a welcoming message
  useEffect(() => {
    if (isOpen) {
      if (selectedExcerpt) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "👋 **Hello! I'm Temari AI, your study companion.**\n\nI've loaded your selected excerpt below. Pick a suggested prompt or ask me anything!"
        }]);
      } else if (messages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: mode === 'exam' 
            ? "👋 **Hello! I'm Temari AI, your exam study companion.**\n\nI've loaded the question you're working on below. Pick a suggested prompt or ask me anything!"
            : "👋 **Hello! I'm Temari AI, your textbook study companion.**\n\nI'm ready to help you master this chapter! Pick a suggested prompt below or ask me anything:"
        }]);
      }
    }
  }, [isOpen, mode, selectedExcerpt, activeContextKey, messages.length]);

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
          noteText: updatedMessages.filter(m => m.id !== 'welcome').length <= 1 ? noteText : undefined,
          selectedExcerpt: selectedExcerpt || undefined,
          questionId: (!selectedExcerpt && noteId) ? `note:${noteId}` : question?.id,
          subject: question?.subject,
          questionText: question?.question,
          options: question ? [question.option_a, question.option_b, question.option_c, question.option_d] : undefined,
          correctAnswer: question?.answer,
          explanation: question?.explanation,
          imageUrl: question?.image_url || undefined,
          studentAnswer: studentAnswer || undefined,
          isSimulator,
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
            if (errData?.isPremium) {
              customMsg = `🔒 **Weekly Pro Limit Reached**\n\n${errData.message || 'You have used your 150 inquiries for this week.'}\n\n✨ Your quota automatically resets next week. In the meantime, you still have unlimited access to all past papers and study notes!`;
            } else if (errData?.message) {
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
      let lastUpdate = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        
        const now = Date.now();
        if (now - lastUpdate > 75) {
          lastUpdate = now;
          setMessages(prev => 
            prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulated } : m)
          );
        }
      }

      // Final update to guarantee all tokens are rendered
      setMessages(prev => 
        prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulated } : m)
      );
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

  // ── MINIMAL INLINE PROMPT SUGGESTIONS ──────────────────────────
  const examPrompts = [
    {
      id: 'explain',
      icon: CheckCircle2,
      label: 'Step-by-Step Solution',
      action: () => sendMessage('explain', 'Please explain the correct answer in detail with clear step-by-step reasoning.', '📖 Step-by-Step Solution'),
    },
    {
      id: 'concept',
      icon: Brain,
      label: 'Core Concept & Traps',
      action: () => sendMessage('eli5', 'What core formula, scientific principle, or common exam trap does this question test? Explain clearly.', '🧠 Core Concept & Traps'),
    },
    {
      id: 'amharic',
      icon: Globe,
      label: 'በአማርኛ አስረዳኝ',
      action: () => sendMessage('amharic', 'Please translate the core problem and explain the solution in clear, natural Amharic (አማርኛ).', '🇪🇹 በአማርኛ አስረዳኝ'),
    },
  ];

  const notePrompts = [
    ...(selectedExcerpt ? [{
      id: 'excerpt',
      icon: Sparkles,
      label: 'Explain Highlighted Text',
      action: () => sendMessage('chat', `Please explain this highlighted excerpt in simple terms with clear intuition and examples: "${selectedExcerpt}"`, '✨ Explain Highlighted Text'),
    }] : []),
    {
      id: 'summary',
      icon: BookOpen,
      label: 'Key Takeaways',
      action: () => sendMessage('summary', 'Please summarize the 3 most crucial takeaways and exam-focused points from this chapter note.', '📝 Chapter Key Takeaways'),
    },
    {
      id: 'quiz',
      icon: Target,
      label: 'Practice Quiz',
      action: () => sendMessage('chat', 'Generate a realistic multiple-choice exam question based strictly on this chapter note with 4 options (A, B, C, D). Wait for me to answer before revealing the solution.', '🎯 Generate Practice Quiz'),
    },
    {
      id: 'analogy',
      icon: Sparkles,
      label: 'Simplify Concept',
      action: () => sendMessage('eli5', 'Take the most difficult or complex concept in this chapter note and explain it using a simple, intuitive real-world analogy.', '💡 Explain tough concept simply'),
    },
    {
      id: 'amharic',
      icon: Globe,
      label: 'በአማርኛ አጠቃልልኝ',
      action: () => sendMessage('amharic', 'የዚህን ምዕራፍ ዋና ዋና ጽንሰ-ሀሳቦች እና ፈተና ላይ ሊወጡ የሚችሉ ነጥቦችን በአማርኛ አጠቃልለህ አስረዳኝ።', '🇪🇹 ዋና ዋና ነጥቦች በአማርኛ'),
    },
  ];

  const activePrompts = mode === 'exam' ? examPrompts : notePrompts;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in transition-all duration-300">
      <div className="w-full max-w-lg bg-card border-t border-black/[0.06] dark:border-white/[0.08] rounded-t-modal p-4 sm:p-5 max-h-[90dvh] h-[90dvh] flex flex-col shadow-2xl animate-drawer-up">
        {/* Premium Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative p-1 rounded-2xl bg-tint-cream border border-tint-cream-border shadow-xs">
              <TemariMascot mood="happy" size={36} animate={false} />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent-emerald rounded-full border-2 border-card" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-base flex items-center gap-1.5 tracking-tight">
                Temari AI <span className="text-primary">Tutor</span>
              </h3>
              <p className="text-caption text-muted-foreground font-bold flex items-center gap-1">
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
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card border-2 border-black/[0.08] dark:border-white/[0.08] text-foreground hover:text-foreground active:scale-95 shadow-2xs"
            title="Close Tutor"
            aria-label="Close Tutor"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3.5 text-sm leading-relaxed text-foreground custom-scrollbar pr-1 mt-1">
          {messages.map((msg) => (
            <React.Fragment key={msg.id}>
              <div className={`flex w-full animate-fade-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-tint-cream border border-tint-cream-border flex items-center justify-center mr-2 shrink-0 self-end mb-1 shadow-2xs">
                    <TemariMascot mood="happy" size={24} animate={false} />
                  </div>
                )}
                <div className={`p-4 rounded-3xl max-w-[85%] font-sans shadow-tactile-xs ${
                  msg.role === 'user' 
                    ? 'bg-gray-950 text-white dark:bg-panel dark:text-foreground border border-black/10 dark:border-white/10 rounded-br-xs font-semibold whitespace-pre-line shadow-tactile-xs' 
                    : 'bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-bl-xs text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    msg.content ? (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-li:text-gray-900 dark:prose-li:text-gray-100 prose-a:text-primary font-medium tracking-tight">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, errorColor: 'inherit' }]]}
                          components={{
                            table: ({ children }) => (
                              <div className="my-3 w-full overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
                                <table className="w-full text-left text-xs border-collapse">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 font-semibold">{children}</thead>
                            ),
                            tbody: ({ children }) => <tbody className="divide-y divide-black/5 dark:divide-white/5">{children}</tbody>,
                            th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
                            td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
                          }}
                        >
                          {normalizeMarkdownLaTeX(msg.content)}
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
                    <MathText content={msg.displayText || msg.content} />
                  )}
                </div>
              </div>

              {/* ── QUESTION CARD (Rendered directly BELOW Welcome Message) ── */}
              {msg.id === 'welcome' && mode === 'exam' && question && (
                <div className="w-full my-2 animate-fade-up">
                  <div className="bg-card border-2 border-b-[4px] border-primary/25 dark:border-primary/40 rounded-2xl p-4 shadow-tactile-xs space-y-3">
                    {/* Subject & Choice Metadata */}
                    <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="text-micro font-black uppercase tracking-wider text-primary truncate">
                          {question.subject || 'Active Question'}
                        </span>
                        {question.year_ec && (
                          <span className="text-caption font-bold text-muted-foreground shrink-0">
                            • {question.year_ec} E.C.
                          </span>
                        )}
                      </div>
                      {studentAnswer && (
                        <span className="text-micro font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                          Choice: {studentAnswer}
                        </span>
                      )}
                    </div>

                    {/* Question Text with KaTeX */}
                    <div className="text-sm font-bold text-foreground leading-relaxed whitespace-pre-wrap">
                      <MathText content={question.question} />
                    </div>

                    {/* Diagram (if present) */}
                    {question.image_url && (
                      <div className="my-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 p-2 max-w-xs mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={question.image_url} 
                          alt="Question Diagram" 
                          className="w-full h-auto object-contain max-h-48 rounded-lg" 
                        />
                      </div>
                    )}

                    {/* Options Preview */}
                    {(question.option_a || question.option_b) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs font-semibold">
                        {[
                          { key: 'A', text: question.option_a },
                          { key: 'B', text: question.option_b },
                          { key: 'C', text: question.option_c },
                          { key: 'D', text: question.option_d },
                        ].filter((o): o is { key: string; text: string } => Boolean(o.text)).map(opt => (
                          <div 
                            key={opt.key}
                            className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 transition-colors ${
                              studentAnswer === opt.key 
                                ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-2xs'
                                : 'bg-panel border-black/[0.06] dark:border-white/[0.06] text-foreground/80'
                            }`}
                          >
                            <span className={`font-mono font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              studentAnswer === opt.key 
                                ? 'bg-primary text-white' 
                                : 'bg-black/5 dark:bg-white/10 text-foreground'
                            }`}>
                              {opt.key}
                            </span>
                            <span className="truncate flex-1">
                              <MathText content={opt.text} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── EXCERPT CARD (Rendered directly BELOW Welcome Message for Notes) ── */}
              {msg.id === 'welcome' && mode === 'notes' && selectedExcerpt && (
                <div className="w-full my-2 animate-fade-up">
                  <div className="bg-card border-2 border-b-[4px] border-emerald-500/25 dark:border-emerald-500/35 rounded-2xl p-4 shadow-tactile-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-micro font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Selected Chapter Excerpt</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground/90 italic pl-2.5 border-l-2 border-emerald-500/50 leading-relaxed">
                      <MathText content={`"${selectedExcerpt}"`} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUGGESTED PROMPT CHIPS (Directly below Question / Excerpt) ── */}
              {msg.id === 'welcome' && (
                <div className="w-full pt-1 pb-3 space-y-2 animate-fade-up">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block pl-1">
                    Suggested Questions &amp; Prompts
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activePrompts.map((p) => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.id}
                          onClick={() => { sounds.playTap(); p.action(); }}
                          disabled={isLoading}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card hover:bg-primary/10 hover:border-primary/40 hover:text-primary active:scale-95 border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] text-xs font-bold text-foreground transition-all shadow-2xs group"
                        >
                          <Icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Mid-chat Collapsible Toggle for Quick Prompts */}
        {messages.length > 1 && (
          <div className="pt-2 px-1 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <button
                type="button"
                onClick={() => { sounds.playTap(); setShowPromptsMenu(!showPromptsMenu); }}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors py-0.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{showPromptsMenu ? 'Hide follow-up suggestions' : 'Quick follow-up prompts'}</span>
                {showPromptsMenu ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            {showPromptsMenu && (
              <div className="flex flex-wrap gap-1.5 pb-2 animate-fade-in">
                {activePrompts.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { sounds.playTap(); p.action(); }}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-panel hover:bg-primary/10 hover:border-primary/40 hover:text-primary active:scale-95 border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-foreground transition-all shadow-2xs group"
                    >
                      <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Floating Input Box */}
        <form onSubmit={handleFormSubmit} className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08] shrink-0 flex items-center gap-2 relative">
          <div className="flex-1 flex items-center bg-card border-2 border-black/[0.08] dark:border-white/[0.08] rounded-full px-4 py-1 focus-within:border-primary shadow-tactile-xs transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Teme anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            onClick={() => sounds.playTap()}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-950 hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 text-white disabled:opacity-30 transition-all shrink-0 shadow-tactile-xs active:scale-95 border-2 border-b-[4px] border-black dark:border-white"
            title="Send query"
            aria-label="Send query"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
