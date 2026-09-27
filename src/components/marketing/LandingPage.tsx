'use client';

import React, { useState, useEffect } from 'react';
import { Send, Bot, BookOpen, Target, Sparkles, GraduationCap, ShieldCheck, Building2, UserCircle2, Zap } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { TemariMascot, MascotBubble } from '@/components/mascot/TemariMascot';

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
    sounds.playTap();
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
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center animate-fade-in p-6">
        <TemariMascot mood="studying" size={100} className="mb-4" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-black/5 dark:border-white/10 border-t-primary animate-spin" />
          <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 tracking-[0.2em] uppercase">Authenticating Scholar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-x-hidden selection:bg-primary/20">
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-ground/85 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
             <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-bespoke-sm">
               <span className="text-white font-black text-base tracking-tighter">Te</span>
             </div>
             <span className="font-black text-lg tracking-tight">Temari</span>
          </div>
          <button 
            onClick={handleTelegramOIDCLogin} 
            className="btn-3d-card text-xs font-black px-4 py-2 rounded-xl text-gray-800 dark:text-gray-200"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* 2. Hero Section with Teme the Mascot */}
      <header className="relative px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 flex flex-col items-center text-center max-w-3xl mx-auto w-full mt-2 sm:mt-4">
        
        {/* Teme the Mascot Intro */}
        <div className="flex flex-col items-center mb-6 animate-fade-up">
          <TemariMascot mood="happy" size={120} className="drop-shadow-sm mb-3" />
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> 
            Meet Teme, Your Ethiopian Study Buddy
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-[1.1] mb-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Master your national exams. <br className="hidden sm:block" />
          <span className="text-primary">Without the stress.</span>
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 font-semibold text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Practice 31,000+ real EUEE, Freshman, and Exit exam questions. Earn XP, build your daily streak, and let AI explain tricky concepts step by step.
        </p>

        <button
          onClick={handleTelegramOIDCLogin}
          className="btn-3d-primary w-full max-w-[320px] py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-bespoke-md text-sm font-black tracking-wide animate-fade-up z-10"
          style={{ animationDelay: '0.3s' }}
        >
          <Send className="w-4.5 h-4.5 text-white" />
          <span>Start Learning — Free</span>
        </button>

        {error && <p className="text-sm text-error font-bold mt-4">{error}</p>}

        {/* 3. Social Proof */}
        <div className="mt-8 flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex -space-x-3">
             <div className="w-8 h-8 rounded-full border-2 border-ground bg-accent-blue/15 flex items-center justify-center text-accent-blue"><UserCircle2 className="w-5 h-5"/></div>
             <div className="w-8 h-8 rounded-full border-2 border-ground bg-accent-emerald/15 flex items-center justify-center text-accent-emerald"><UserCircle2 className="w-5 h-5"/></div>
             <div className="w-8 h-8 rounded-full border-2 border-ground bg-accent-gold/15 flex items-center justify-center text-accent-gold"><UserCircle2 className="w-5 h-5"/></div>
             <div className="w-8 h-8 rounded-full border-2 border-ground bg-accent-purple/15 flex items-center justify-center text-accent-purple"><UserCircle2 className="w-5 h-5"/></div>
          </div>
          <div className="text-xs font-black text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
             <div className="flex gap-0.5 text-accent-gold">
               <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
             </div>
             Join 5,000+ Ethiopian scholars
          </div>
        </div>
      </header>

      {/* 4. Gamified Pillars Section */}
      <section className="px-6 py-12 bg-card border-t-2 border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Designed for Daily Momentum</h2>
            <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">Warm, habit-forming study tools built for Ethiopian students.</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="flex flex-col justify-between p-6 rounded-[26px] bg-ground border-2 border-b-[5px] border-black/[0.08] dark:border-white/[0.08] shadow-bespoke-sm">
              <div className="w-12 h-12 rounded-[16px] bg-accent-blue/15 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <h3 className="font-black text-lg mb-1 tracking-tight">31,000+ Past Papers</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold leading-relaxed">Practice real Grade 12 EUEE, Freshman University, and Exit exams with official answer keys.</p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-6 rounded-[26px] bg-ground border-2 border-b-[5px] border-black/[0.08] dark:border-white/[0.08] shadow-bespoke-sm">
              <div className="w-12 h-12 rounded-[16px] bg-accent-purple/15 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-accent-purple" />
              </div>
              <div>
                <h3 className="font-black text-lg mb-1 tracking-tight">Step-by-Step AI Tutor</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold leading-relaxed">Stuck on a tricky calculation? Teme breaks down the exact formula and reason step-by-step.</p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-6 rounded-[26px] bg-ground border-2 border-b-[5px] border-black/[0.08] dark:border-white/[0.08] shadow-bespoke-sm">
              <div className="w-12 h-12 rounded-[16px] bg-accent-gold/15 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent-gold" />
              </div>
              <div>
                <h3 className="font-black text-lg mb-1 tracking-tight">Streaks &amp; Levels</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold leading-relaxed">Earn XP for every question solved, level up to National Champ, and celebrate every study win.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Curriculum Trust Section */}
      <section className="px-6 py-12 border-t-2 border-black/[0.06] dark:border-white/[0.08] bg-ground">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
           <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-8">
             Aligned with Ethiopian Academic Standards
           </h3>
           <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
              
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-8 h-8 text-accent-emerald" />
                 <div className="text-left flex flex-col">
                    <span className="font-black text-base leading-none text-gray-900 dark:text-white">MoE</span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Curriculum Aligned</span>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <Building2 className="w-8 h-8 text-accent-blue" />
                 <div className="text-left flex flex-col">
                    <span className="font-black text-base leading-none text-gray-900 dark:text-white">EUEE</span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">National Standards</span>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <GraduationCap className="w-8 h-8 text-accent-purple" />
                 <div className="text-left flex flex-col">
                    <span className="font-black text-base leading-none text-gray-900 dark:text-white">Freshman</span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">University Track</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 6. Bottom CTA */}
      <section className="px-6 py-16 flex flex-col items-center text-center bg-card border-t-2 border-black/[0.06] dark:border-white/[0.08]">
        <TemariMascot mood="celebrating" size={80} className="mb-3" />
        <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">Ready to ace your exams?</h2>
        <p className="text-xs sm:text-sm font-bold text-gray-500 mb-6">Join thousands of Ethiopian students learning smarter today.</p>
        <button
          onClick={handleTelegramOIDCLogin}
          className="btn-3d-primary w-full max-w-[320px] py-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-black"
        >
          <Send className="w-4.5 h-4.5 text-white" />
          <span>Start Learning — Free</span>
        </button>
      </section>

      {/* 7. Footer */}
      <footer className="w-full bg-ground border-t border-black/[0.06] dark:border-white/[0.06] py-8 px-6">
         <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center"><span className="text-white font-black text-[10px]">Te</span></div>
               <span className="font-black text-sm text-gray-900 dark:text-white">Temari</span>
            </div>
            <p className="text-xs font-semibold text-gray-400">© {new Date().getFullYear()} Temari. Built for Ethiopian scholars.</p>
         </div>
      </footer>
    </div>
  );
};
