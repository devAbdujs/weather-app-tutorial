'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Send, Bot, Target, Sparkles, GraduationCap, ShieldCheck, Building2, Zap, ArrowRight } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { safeSessionStorage } from '@/lib/safeStorage';
import { TemariMascot } from '@/components/mascot/TemariMascot';
import { SubdomainType, SUBDOMAIN_CONFIGS, getSubdomainUrl, getExamPortalPath } from '@/lib/subdomains';
import { MobileDeviceMockup } from '@/components/marketing/MobileDeviceMockup';
import { ExamStoryboard } from '@/components/marketing/ExamStoryboard';

interface LandingPageProps {
  initialPortal?: SubdomainType;
}

export const LandingPage: React.FC<LandingPageProps> = ({ initialPortal = 'root' }) => {
  const [activePortal] = useState<SubdomainType>(initialPortal);
  const portalConfig = SUBDOMAIN_CONFIGS[activePortal] || SUBDOMAIN_CONFIGS.root;
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isWebApp, setIsWebApp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const authenticateWithTelegram = async (initData: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(activePortal !== 'root' ? { 'x-temari-target-exam': activePortal } : {})
        },
        body: JSON.stringify({ 
          initData,
          targetExam: activePortal !== 'root' ? activePortal : undefined
        })
      });
      if (res.ok) { 
        window.location.replace('/dashboard'); 
      } else { 
        const errJson = await res.json().catch(() => ({}));
        setAuthError(errJson.error || 'Authentication error. Please retry.');
        setIsAuthenticating(false); 
      }
    } catch { 
      setAuthError('Connection lost during authentication. Tap retry below.');
      setIsAuthenticating(false); 
    }
  };

  useEffect(() => {
    let attempts = 0;

    const checkTelegram = () => {
      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
      if (tg && tg.initData) {
        if (safeSessionStorage.getItem('temari_manual_logout') === 'true') {
          return;
        }
        setIsWebApp(true);
        try { tg.ready?.(); tg.expand?.(); } catch (e) {}
        authenticateWithTelegram(tg.initData);
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('code') && searchParams.get('state')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (attempts < 35) {
        attempts++;
        setTimeout(checkTelegram, 100);
      }
    };
    checkTelegram();
  }, []);

  const handlePrimaryAuth = (targetPortal?: SubdomainType) => {
    sounds.playTap();
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg?.initData) {
      safeSessionStorage.removeItem('temari_manual_logout');
      authenticateWithTelegram(tg.initData);
    } else {
      handleTelegramOIDCLogin(targetPortal || (activePortal !== 'root' ? activePortal : undefined));
    }
  };

  const handleTelegramOIDCLogin = async (targetPortal?: SubdomainType) => {
    sounds.playTap();
    setIsAuthenticating(true);
    setError(null);
    try {
      const selected = targetPortal || activePortal;
      if (selected !== 'root') {
        safeSessionStorage.setItem('temari_target_exam', selected);
      } else {
        safeSessionStorage.removeItem('temari_target_exam');
      }

      const { generateRandomString, generateCodeChallenge } = await import('@/lib/pkce');
      const codeVerifier = generateRandomString(64);
      const state = generateRandomString(32);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      safeSessionStorage.setItem('tg_oidc_verifier', codeVerifier);
      safeSessionStorage.setItem('tg_oidc_state', state);

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

  if (authError) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center animate-fade-in p-6 text-center">
        <TemariMascot mood="worried" size={100} className="mb-4" />
        <h2 className="text-xl font-black text-foreground tracking-tight mb-2">Connection Issue</h2>
        <p className="text-sm font-semibold text-muted-foreground max-w-xs mb-6">{authError}</p>
        <button
          onClick={() => {
            const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
            if (tg?.initData) {
              authenticateWithTelegram(tg.initData);
            } else {
              window.location.reload();
            }
          }}
          className="btn-3d-primary px-8 py-3.5 rounded-2xl font-black text-sm active:translate-y-0.5 shadow-tactile-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isWebApp || isAuthenticating) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center animate-fade-in p-6">
        <TemariMascot mood="studying" size={100} className="mb-4" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-bevel border-black/5 dark:border-white/10 border-t-primary animate-spin" />
          <p className="text-caption font-black text-muted-foreground tracking-[0.2em] uppercase">Authenticating Scholar</p>
        </div>
      </div>
    );
  }

  const pillarQuestionTitle = 
    activePortal === 'entrance' ? '15,000+ EUEE Questions' :
    activePortal === 'freshman' ? '8,000+ Campus Exams' :
    activePortal === 'exit'     ? '8,000+ Exit Drills' :
    '31,000+ Past Papers';

  const pillarQuestionDesc =
    activePortal === 'entrance' ? 'Real Grade 12 matric past papers (2010–2018 E.C.) with full solutions.' :
    activePortal === 'freshman' ? 'University midterms & finals for common courses with step-by-step notes.' :
    activePortal === 'exit'     ? 'Official MoE qualification past papers across major degree faculties.' :
    'Real Grade 12 EUEE, Freshman, and Exit exam questions with official answer keys.';

  return (
    <div className="min-h-screen bg-ground text-foreground flex flex-col font-sans overflow-x-hidden selection:bg-primary/20">
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-ground/85 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={getSubdomainUrl('root')} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
             <div className="w-9 h-9 rounded-2xl bg-primary/10 border-2 border-b-[3px] border-primary/25 dark:border-primary/40 flex items-center justify-center p-1 shadow-tactile-sm overflow-hidden">
               <Image 
                 src="/assets/temari_icon.png" 
                 alt="Temari Logo" 
                 width={36} 
                 height={36} 
                 className="w-full h-full object-contain" 
                 priority 
               />
             </div>
             <span className="font-black text-lg tracking-tight">Temari</span>
          </Link>
          <div className="flex items-center gap-2">
            {typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData) && (
              <button 
                onClick={() => {
                  try { (window as any).Telegram.WebApp.close(); } catch {}
                }} 
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
              >
                Exit App
              </button>
            )}
            <button 
              onClick={() => handlePrimaryAuth(activePortal !== 'root' ? activePortal : undefined)} 
              className="btn-3d-card text-xs font-black px-4 py-2 rounded-xl text-foreground"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="relative px-6 pt-24 sm:pt-30 pb-6 sm:pb-10 flex flex-col items-center text-center max-w-3xl mx-auto w-full mt-2 sm:mt-4">
        
        {/* Mascot & Track Badge */}
        <div className="flex flex-col items-center mb-5 animate-fade-up">
          <TemariMascot mood="happy" size={105} className="drop-shadow-sm mb-3" />
          {activePortal !== 'root' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black tracking-wide shadow-2xs">
              <span className="text-sm">{portalConfig.emoji}</span>
              <span>{portalConfig.tagline}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> 
              Ethiopian National Exam Prep
            </div>
          )}
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-[1.1] mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {portalConfig.headline} <br className="hidden sm:block" />
          <span className="text-primary">{portalConfig.highlightedText}</span>
        </h1>
        
        <p className="text-muted-foreground font-semibold text-sm sm:text-base mb-6 max-w-lg mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {portalConfig.description}
        </p>

        <button
          onClick={() => {
            if (activePortal === 'root') {
              sounds.playTap();
              const el = document.getElementById('exam-portals');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            } else {
              handlePrimaryAuth(activePortal);
            }
          }}
          className="btn-3d-primary w-full max-w-[320px] py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-tactile-md text-sm font-black tracking-wide animate-fade-up z-10"
          style={{ animationDelay: '0.3s' }}
        >
          {activePortal === 'root' ? (
            <>
              <span>Select Your Exam Track</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-white" />
              <span>{`Start ${portalConfig.shortLabel} — Free`}</span>
            </>
          )}
        </button>

        {error && <p className="text-sm text-error font-bold mt-3">{error}</p>}

        {/* 3. Social Proof */}
        <div className="mt-5 flex items-center gap-2 text-xs font-black text-muted-foreground animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex gap-0.5 text-accent-gold">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
          <span>5,000+ Ethiopian scholars practicing</span>
        </div>

        {/* Interactive In-App Mobile Frame Preview */}
        <div className="mt-6 mb-2 w-full flex flex-col items-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="text-center mb-2.5">
            <span className="text-micro font-black tracking-widest uppercase text-muted-foreground bg-black/5 dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-black/10 dark:border-white/10">
              Interactive In-App Preview
            </span>
            <p className="text-[11px] font-semibold text-muted-foreground mt-1">
              Tap an option below to test instant grading &amp; AI explanation
            </p>
          </div>
          <MobileDeviceMockup portal={activePortal} />
        </div>
      </header>

      {/* ── 3 EXAM PORTALS SELECTOR (ONLY SHOWN ON ROOT temari.top HUB) ── */}
      {activePortal === 'root' && (
        <section id="exam-portals" className="w-full max-w-4xl mx-auto px-6 py-6">
          <div className="text-center mb-5">
            <span className="text-micro font-black tracking-widest uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              Choose Your Exam Track
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-foreground">
              Specialized Question Banks for Every Milestone
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5">
            {/* Track 1: Grade 12 EUEE */}
            <Link 
              href={getExamPortalPath('entrance')}
              onClick={() => {
                sounds.playTap();
                safeSessionStorage.removeItem('temari_manual_logout');
              }}
              className="p-4.5 rounded-2xl border bg-card border-black/[0.08] dark:border-white/[0.08] hover:border-primary/40 shadow-tactile-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🎓</span>
                  <span className="text-micro font-black px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                    15,000+ Qs
                  </span>
                </div>
                <h3 className="font-black text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  Grade 12 Entrance (EUEE)
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mb-3 leading-relaxed">
                  National past papers (2010–2018 E.C.) for Natural &amp; Social Science streams.
                </p>
              </div>
              <div className="w-full py-2 rounded-xl font-black text-xs text-center flex items-center justify-center gap-1.5 bg-accent-blue/10 group-hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/30 transition-all">
                <span>Explore Grade 12</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Track 2: Freshman */}
            <Link 
              href={getExamPortalPath('freshman')}
              onClick={() => {
                sounds.playTap();
                safeSessionStorage.removeItem('temari_manual_logout');
              }}
              className="p-4.5 rounded-2xl border bg-card border-black/[0.08] dark:border-white/[0.08] hover:border-primary/40 shadow-tactile-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🏛️</span>
                  <span className="text-micro font-black px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple border border-accent-purple/30">
                    8,000+ Qs
                  </span>
                </div>
                <h3 className="font-black text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  University Freshman
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mb-3 leading-relaxed">
                  Common courses &amp; remedial exams for AAU, ASTU, and regional universities.
                </p>
              </div>
              <div className="w-full py-2 rounded-xl font-black text-xs text-center flex items-center justify-center gap-1.5 bg-accent-purple/10 group-hover:bg-accent-purple/20 text-accent-purple border border-accent-purple/30 transition-all">
                <span>Explore Freshman</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Track 3: Exit */}
            <Link 
              href={getExamPortalPath('exit')}
              onClick={() => {
                sounds.playTap();
                safeSessionStorage.removeItem('temari_manual_logout');
              }}
              className="p-4.5 rounded-2xl border bg-card border-black/[0.08] dark:border-white/[0.08] hover:border-primary/40 shadow-tactile-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🏆</span>
                  <span className="text-micro font-black px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30">
                    8,000+ Qs
                  </span>
                </div>
                <h3 className="font-black text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  University Exit Exam
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mb-3 leading-relaxed">
                  National qualification exams across Engineering, Medicine, Law, and Business.
                </p>
              </div>
              <div className="w-full py-2 rounded-xl font-black text-xs text-center flex items-center justify-center gap-1.5 bg-accent-gold/10 group-hover:bg-accent-gold/20 text-accent-gold border border-accent-gold/30 transition-all">
                <span>Explore Exit Exam</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── HISTORICAL EXAM STATISTICS & DEDICATED STORYBOARD ── */}
      <ExamStoryboard portal={activePortal} />

      {/* 4. Gamified Pillars Section */}
      <section className="px-6 py-10 bg-card border-t border-black/[0.08] dark:border-white/[0.08]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">Designed for Daily Momentum</h2>
            <p className="text-xs font-semibold text-muted-foreground">Habit-forming study tools built for Ethiopian students.</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col justify-between p-5 rounded-card-lg bg-ground border border-black/[0.08] dark:border-white/[0.08] shadow-tactile-xs">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/15 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <h3 className="font-black text-sm mb-1 tracking-tight">{pillarQuestionTitle}</h3>
                <p className="text-muted-foreground text-xs font-semibold leading-relaxed">{pillarQuestionDesc}</p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-5 rounded-card-lg bg-ground border border-black/[0.08] dark:border-white/[0.08] shadow-tactile-xs">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/15 flex items-center justify-center mb-3">
                <Bot className="w-5 h-5 text-accent-purple" />
              </div>
              <div>
                <h3 className="font-black text-sm mb-1 tracking-tight">Step-by-Step AI Tutor</h3>
                <p className="text-muted-foreground text-xs font-semibold leading-relaxed">Stuck on a problem? Teme breaks down formulas and explanations step-by-step.</p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-5 rounded-card-lg bg-ground border border-black/[0.08] dark:border-white/[0.08] shadow-tactile-xs">
              <div className="w-10 h-10 rounded-xl bg-accent-gold/15 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-accent-gold" />
              </div>
              <div>
                <h3 className="font-black text-sm mb-1 tracking-tight">Streaks &amp; Levels</h3>
                <p className="text-muted-foreground text-xs font-semibold leading-relaxed">Earn XP, level up your rank, and build a consistent daily study habit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Curriculum Trust Section */}
      <section className="px-6 py-8 border-t border-black/[0.08] dark:border-white/[0.08] bg-ground">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-6">
            Aligned with Ethiopian Academic Standards
          </h3>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-12">
             <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-accent-emerald" />
                <div className="text-left flex flex-col">
                   <span className="font-black text-sm leading-none text-foreground">MoE</span>
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Curriculum Aligned</span>
                </div>
             </div>

             <div className="flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-accent-blue" />
                <div className="text-left flex flex-col">
                   <span className="font-black text-sm leading-none text-foreground">EUEE</span>
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">National Standards</span>
                </div>
             </div>

             <div className="flex items-center gap-2.5">
                <GraduationCap className="w-6 h-6 text-accent-purple" />
                <div className="text-left flex flex-col">
                   <span className="font-black text-sm leading-none text-foreground">University</span>
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Freshman &amp; Exit Tracks</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom CTA */}
      <section className="px-6 py-12 flex flex-col items-center text-center bg-card border-t border-black/[0.08] dark:border-white/[0.08]">
        <TemariMascot mood="celebrating" size={72} className="mb-2" />
        <h2 className="text-xl sm:text-2xl font-black mb-1 tracking-tight">
          {activePortal === 'root' ? 'Ready to ace your exams?' : `Ready to ace ${portalConfig.shortLabel}?`}
        </h2>
        <p className="text-xs font-semibold text-muted-foreground mb-5">
          Join thousands of Ethiopian students studying smarter today.
        </p>
        <button
          onClick={() => handlePrimaryAuth(activePortal !== 'root' ? activePortal : undefined)}
          className="btn-3d-primary w-full max-w-[300px] py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-black shadow-tactile-sm"
        >
          <Send className="w-4 h-4 text-white" />
          <span>Start Practicing — Free</span>
        </button>
      </section>

      {/* 7. Footer */}
      <footer className="w-full bg-ground border-t border-black/[0.06] dark:border-white/[0.06] py-6 px-6">
         <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/25 overflow-hidden flex items-center justify-center p-0.5">
                 <Image src="/assets/temari_icon.png" alt="Temari" width={24} height={24} className="w-full h-full object-contain" />
               </div>
               <span className="font-black text-sm text-foreground">Temari</span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">© {new Date().getFullYear()} Temari. Built for Ethiopian scholars.</p>
         </div>
      </footer>
    </div>
  );
};
