'use client';

import React, { useState, useEffect } from 'react';
import { Send, Bot, BookOpen, Target, Sparkles, GraduationCap, ShieldCheck, Building2, UserCircle2 } from 'lucide-react';

export const LandingPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isWebApp, setIsWebApp] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const authenticateWithTelegram = async (initData: string) => {
      setIsAuthenticating(true);
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        });
        if (res.ok) { window.location.replace('/dashboard'); } 
        else { setIsAuthenticating(false); }
      } catch { setIsAuthenticating(false); }
    };

    const checkTelegram = () => {
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
      if (tg && tg.initData) {
        setIsWebApp(true);
        authenticateWithTelegram(tg.initData);
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('code') && searchParams.get('state')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (attempts < 10) {
        attempts++;
        setTimeout(checkTelegram, 50);
      }
    };
    checkTelegram();
  }, []);

  const handleTelegramOIDCLogin = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const { generateRandomString, generateCodeChallenge } = await import('@/lib/pkce');
      const codeVerifier = generateRandomString(64);
      const state = generateRandomString(32);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      sessionStorage.setItem('tg_oidc_verifier', codeVerifier);
      sessionStorage.setItem('tg_oidc_state', state);

      const BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID || '8400954528';
      const baseOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';
      const redirectUri = `${baseOrigin}/auth/callback`;

      const authUrl =
        `https://oauth.telegram.org/auth?client_id=${BOT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid+profile+phone+telegram:bot_access&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

      window.location.href = authUrl;
    } catch {
      setError('Failed to initialize login. Please try again.');
      setIsAuthenticating(false);
    }
  };

  if (isWebApp || isAuthenticating) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center animate-fade-in">
        <div className="w-16 h-16 rounded-[20px] bg-primary flex items-center justify-center shadow-xl mb-6 shadow-primary/20">
           <span className="text-white font-black text-3xl tracking-tighter">Te</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-black/5 dark:border-white/10 border-t-primary animate-spin" />
          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 tracking-[0.2em] uppercase">Authenticating</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-x-hidden selection:bg-primary/20">
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-ground/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
               <span className="text-white font-black text-sm tracking-tighter">Te</span>
             </div>
             <span className="font-bold text-lg tracking-tight">Temari</span>
          </div>
          <button onClick={handleTelegramOIDCLogin} className="text-sm font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2 rounded-full transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      {/* 2. Hero Section with Floating Pills */}
      <header className="relative px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 flex flex-col items-center text-center max-w-3xl mx-auto w-full mt-4 sm:mt-8">
        
        {/* Floating Background Elements (Hidden on small mobile) */}
        <div className="hidden sm:flex absolute top-10 left-0 animate-fade-in stagger-1">
           <div className="bg-[hsl(36,50%,92%)] dark:bg-[hsl(36,30%,20%)] text-[hsl(36,58%,38%)] dark:text-[hsl(36,45%,65%)] px-4 py-1.5 rounded-full text-xs font-black tracking-wide border border-[hsl(36,35%,80%)] dark:border-[hsl(36,30%,30%)]">📐 Physics</div>
        </div>
        <div className="hidden sm:flex absolute top-40 -right-4 animate-fade-in stagger-2">
           <div className="bg-[hsl(145,28%,92%)] dark:bg-[hsl(145,20%,18%)] text-[hsl(145,42%,35%)] dark:text-[hsl(145,35%,62%)] px-4 py-1.5 rounded-full text-xs font-black tracking-wide border border-[hsl(145,25%,78%)] dark:border-[hsl(145,20%,28%)]">🧬 Biology</div>
        </div>
        <div className="hidden sm:flex absolute bottom-10 -left-10 animate-fade-in stagger-3">
           <div className="bg-[hsl(268,22%,92%)] dark:bg-[hsl(268,18%,18%)] text-[hsl(268,42%,44%)] dark:text-[hsl(268,36%,68%)] px-4 py-1.5 rounded-full text-xs font-black tracking-wide border border-[hsl(268,20%,78%)] dark:border-[hsl(268,18%,28%)]">🧪 Chemistry</div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#229ED9]/10 text-[#229ED9] text-xs font-bold mb-6 animate-fade-up">
          <Sparkles className="w-3.5 h-3.5" /> 
          Ethiopian exam prep, powered by AI
        </div>

        <h1 className="text-[40px] sm:text-6xl font-black tracking-tight leading-tight sm:leading-[1.1] mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Master your national exams. <br className="hidden sm:block" />
          <span className="text-primary">Without the stress.</span>
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-10 max-w-lg mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Practice 31,000+ real EUEE and Freshman past papers with a personal AI tutor explaining every step.
        </p>

        <button
          onClick={handleTelegramOIDCLogin}
          className="w-full max-w-[300px] h-14 bg-[#229ED9] rounded-2xl flex items-center justify-center gap-2.5 shadow-bespoke-md hover:bg-[#1E8CC0] active:scale-[0.98] transition-all duration-200 ease-bespoke animate-fade-up z-10"
          style={{ animationDelay: '0.3s' }}
        >
          <Send className="w-5 h-5 text-white" />
          <span className="text-[15px] font-bold text-white tracking-wide">Start Learning — Free</span>
        </button>

        {error && <p className="text-sm text-error font-medium mt-4">{error}</p>}

        {/* 3. Social Proof */}
        <div className="mt-8 flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex -space-x-3">
             <div className="w-8 h-8 rounded-full border-2 border-ground bg-blue-100 flex items-center justify-center text-blue-600"><UserCircle2 className="w-5 h-5"/></div>
             <div className="w-8 h-8 rounded-full border-2 border-ground bg-emerald-100 flex items-center justify-center text-emerald-600"><UserCircle2 className="w-5 h-5"/></div>
             <div className="w-8 h-8 rounded-full border-2 border-ground bg-amber-100 flex items-center justify-center text-amber-600"><UserCircle2 className="w-5 h-5"/></div>
             <div className="w-8 h-8 rounded-full border-2 border-ground bg-purple-100 flex items-center justify-center text-purple-600"><UserCircle2 className="w-5 h-5"/></div>
          </div>
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
             <div className="flex gap-0.5 text-amber-400">
               <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
             </div>
             Join 5,000+ Ethiopian students
          </div>
        </div>
      </header>

      {/* 4. Mockup Section */}
      <section className="px-4 pb-24 w-full max-w-5xl mx-auto flex justify-center animate-fade-up relative z-10" style={{ animationDelay: '0.5s' }}>
        <div className="w-full max-w-[340px] sm:max-w-[800px] h-[500px] sm:h-auto sm:aspect-video rounded-[32px] sm:rounded-[40px] border-[6px] border-gray-900 shadow-2xl overflow-hidden bg-card relative">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-900/40 p-6 flex flex-col">
              {/* Fake UI Header */}
              <div className="w-full flex justify-between items-center mb-6">
                 <div className="w-32 h-6 bg-black/10 dark:bg-white/10 rounded-full" />
                 <div className="w-10 h-10 bg-black/10 dark:bg-white/10 rounded-full" />
              </div>
              {/* Fake UI Cards */}
              <div className="flex flex-col sm:flex-row gap-4 w-full h-full">
                 <div className="flex-1 bg-card rounded-[24px] shadow-sm p-4 flex flex-col justify-end">
                    <div className="w-full h-4 bg-black/5 dark:bg-white/5 rounded-full mb-3" />
                    <div className="w-3/4 h-4 bg-black/5 dark:bg-white/5 rounded-full" />
                 </div>
                 <div className="flex-1 bg-primary/90 rounded-[24px] shadow-sm p-4 hidden sm:flex flex-col justify-end">
                    <div className="w-full h-4 bg-white/20 rounded-full mb-3" />
                    <div className="w-1/2 h-4 bg-white/20 rounded-full" />
                 </div>
              </div>
           </div>
           
           {/* Floating AI Chat Mockup */}
           <div className="absolute bottom-4 right-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[320px] bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1"><Bot className="w-4 h-4 text-white"/></div>
                 <p className="text-gray-900 dark:text-white font-bold text-sm leading-relaxed">
                   "The correct answer is C. Mitochondria generates ATP through cellular respiration. Want me to break down the formula?"
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section className="px-6 py-16 sm:py-24 bg-card border-t border-black/5 dark:border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Everything you need to score high</h2>
            <p className="text-gray-500 font-medium">Built specifically for the Ethiopian curriculum.</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-ground border border-black/5 dark:border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Target className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2 tracking-tight">Real Past Papers</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">Practice by year, subject, or chapter. Over 31,000 real EUEE questions with detailed solutions.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-ground border border-black/5 dark:border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Bot className="w-7 h-7 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2 tracking-tight">AI Tutor</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">Stuck on a hard physics question? Your personal AI breaks it down step-by-step so you actually understand.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-ground border border-black/5 dark:border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2 tracking-tight">Offline Short Notes</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">Read beautifully formatted textbook summaries that look like real paper, even when you have no data.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Partnered / Trust Section */}
      <section className="px-6 py-16 sm:py-20 border-t border-black/5 dark:border-white/10 bg-ground">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
           <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-10">
             Aligned with National Standards
           </h3>
           <div className="flex flex-wrap justify-center gap-8 sm:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-10 h-10 text-emerald-600" />
                 <div className="text-left flex flex-col">
                    <span className="font-black text-lg leading-none text-gray-900 dark:text-white">MoE</span>
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Curriculum Aligned</span>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <Building2 className="w-10 h-10 text-blue-600" />
                 <div className="text-left flex flex-col">
                    <span className="font-black text-lg leading-none text-gray-900 dark:text-white">EUEE</span>
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Exam Standards</span>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <GraduationCap className="w-10 h-10 text-purple-600" />
                 <div className="text-left flex flex-col">
                    <span className="font-black text-lg leading-none text-gray-900 dark:text-white">Freshman</span>
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">University Prep</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="px-6 py-16 sm:py-24 flex flex-col items-center text-center bg-card border-t border-black/5 dark:border-white/10">
        <h2 className="text-3xl font-black mb-2 tracking-tight">Ready to ace your exams?</h2>
        <p className="text-gray-500 font-medium mb-8">Join thousands of students learning smarter today.</p>
        <button
          onClick={handleTelegramOIDCLogin}
          className="w-full max-w-[320px] h-14 bg-[#229ED9] rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-[#229ED9]/20 hover:bg-[#1E8CC0] active:scale-[0.98] transition-all"
        >
          <Send className="w-5 h-5 text-white" />
          <span className="text-[15px] font-bold text-white tracking-wide">Start Learning — Free</span>
        </button>
      </section>

      {/* 8. Footer */}
      <footer className="w-full bg-ground border-t border-black/5 dark:border-white/5 py-8 sm:py-12 px-6">
         <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded bg-primary flex items-center justify-center"><span className="text-white font-black text-[10px]">Te</span></div>
               <span className="font-bold text-sm text-gray-900 dark:text-white">Temari App</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
               <a href="#" className="transition-colors">Terms</a>
               <a href="#" className="transition-colors">Privacy</a>
               <a href="#" className="transition-colors">Contact</a>
            </div>
            <p className="text-xs font-medium text-gray-400">© {new Date().getFullYear()} Temari. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
};
