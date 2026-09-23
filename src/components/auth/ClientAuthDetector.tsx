'use client';

import React, { useEffect, useState } from 'react';
import { LandingPage } from '@/components/marketing/LandingPage';

export const ClientAuthDetector: React.FC = () => {
  // Default to showing the LandingPage immediately.
  // We only switch to the spinner if we detect an active Telegram context.
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
          window.location.replace('/'); 
        } else {
          setIsAuthenticating(false); // Failed — show LandingPage
        }
      } catch {
        setIsAuthenticating(false);
      }
    };

    const checkTelegram = () => {
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

      if (tg && tg.initData) {
        // We're definitively inside the Telegram app — authenticate immediately
        authenticateWithTelegram(tg.initData);
        return;
      }

      // If there are stale OAuth query params in the URL (leftover from a failed
      // or incomplete OIDC flow), clean them up so the user sees the Landing Page
      // rather than getting stuck. Full OIDC support is tracked in Phase 3 (PWA).
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('code') && searchParams.get('state')) {
        // Strip the stale params and let the user log in normally
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (attempts < 10) {
        attempts++;
        setTimeout(checkTelegram, 50); // Poll for Telegram context
        // During polling we DON'T show the spinner — LandingPage stays visible
      }
      // After 10 attempts with no Telegram context found, we just stay on LandingPage
    };

    checkTelegram();
  }, []);

  if (isAuthenticating) {
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

  // Render the marketing Landing Page for unauthenticated Web users
  return (
    <LandingPage onLogin={async (webData) => {
      const res = await fetch('/api/auth/session', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webData }) 
      });
      if (res.ok) {
        window.location.replace('/'); 
      }
    }} />
  );
};
