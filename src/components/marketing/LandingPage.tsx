'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, Bot, BookOpen, Target, Sparkles } from 'lucide-react';

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
        
        if (res.ok) {
          window.location.replace('/dashboard'); 
        } else {
          setIsAuthenticating(false);
        }
      } catch {
        setIsAuthenticating(false);
      }
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
        `https://oauth.telegram.org/auth` +
        `?client_id=${BOT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=openid+profile+phone+telegram:bot_access` +
        `&state=${state}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`;

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
    <div className="min-h-screen bg-ground text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-x-hidden">
      {/* Hero Section */}
      <header className="px-6 pt-12 pb-16 flex flex-col items-center text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-[20px] bg-primary flex items-center justify-center shadow-xl mb-6 shadow-primary/20 animate-fade-in">
           <span className="text-white font-black text-3xl tracking-tighter">Te</span>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#229ED9]/10 text-[#229ED9] text-xs font-bold mb-6 animate-fade-up">
          <Sparkles className="w-3.5 h-3.5" /> 
          Ethiopian exam prep, powered by AI
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Master your national exams. <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Without the stress.</span>
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-10 max-w-[400px] animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Practice 31,000+ real EUEE and Freshman past papers with a personal AI tutor explaining every step.
        </p>

        <button
          onClick={handleTelegramOIDCLogin}
          className="w-full max-w-[320px] h-14 bg-[#229ED9] rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#229ED9]/20 hover:bg-[#1E8CC0] active:scale-[0.98] transition-all animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Send className="w-5 h-5 text-white" />
          <span className="text-[15px] font-bold text-white tracking-wide">
            Start Learning — Free
          </span>
        </button>

        {error && <p className="text-sm text-red-500 font-medium mt-4">{error}</p>}
      </header>

      {/* Screenshot/Mockup Section */}
      <section className="px-4 pb-20 w-full max-w-4xl mx-auto flex justify-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
        <div className="w-full max-w-[360px] aspect-[9/19] rounded-[32px] border-4 border-gray-900 shadow-2xl overflow-hidden bg-card relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-900/40 p-4">
     <div className="w-full h-8 bg-black/10 rounded-full mb-4" />
     <div className="w-full h-24 bg-card rounded-2xl mb-4 shadow-sm" />
     <div className="w-full h-24 bg-card rounded-2xl mb-4 shadow-sm" />
     <div className="w-full h-24 bg-card rounded-2xl shadow-sm" />
   </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6">
             <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><Bot className="w-4 h-4 text-white"/></div>
                   <p className="text-white font-bold text-sm">"The answer is C because of mitochondria..."</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 bg-card border-t border-black/5 dark:border-white/10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">Everything you need to score high</h2>
          
          <div className="grid gap-6">
            <div className="flex gap-4 items-start p-5 rounded-3xl bg-ground">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Real Past Papers</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">Practice by year, subject, or chapter. Over 31,000 real exam questions with solutions.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-5 rounded-3xl bg-ground">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">AI Tutor explaining anything</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">Stuck on a question? Mr. Helper AI breaks it down step-by-step so you actually understand.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-5 rounded-3xl bg-ground">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Offline Short Notes</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">Read beautifully formatted textbook summaries that look like real paper, even offline.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-20 flex flex-col items-center text-center bg-ground">
        <h2 className="text-3xl font-black mb-6">Ready to ace your exams?</h2>
        <button
          onClick={handleTelegramOIDCLogin}
          className="w-full max-w-[320px] h-14 bg-[#229ED9] rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#229ED9]/20 hover:bg-[#1E8CC0] active:scale-[0.98] transition-all"
        >
          <Send className="w-5 h-5 text-white" />
          <span className="text-[15px] font-bold text-white tracking-wide">
            Start Learning — Free
          </span>
        </button>
      </section>
    </div>
  );
};
