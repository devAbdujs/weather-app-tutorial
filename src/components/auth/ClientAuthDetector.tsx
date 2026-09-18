'use client';

import React, { useEffect, useState } from 'react';
import { LandingPage } from '@/components/marketing/LandingPage';

export const ClientAuthDetector: React.FC = () => {
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    let attempts = 0;

    const authenticateWithTelegram = async (initData: string) => {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        });
        
        if (res.ok) {
          // Hard reload is massively faster and more reliable than router.refresh() 
          // on Edge/Serverless cold starts.
          window.location.reload(); 
        } else {
          setIsWeb(true);
        }
      } catch {
        setIsWeb(true);
      }
    };

    const checkTelegram = () => {
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

      if (tg && tg.initData) {
        authenticateWithTelegram(tg.initData);
      } else if (attempts < 10) {
        attempts++;
        setTimeout(checkTelegram, 50); // Poll every 50ms to prevent race conditions
      } else {
        setIsWeb(true); // Confirmed web browser or failed to initialize
      }
    };

    checkTelegram();
  }, []);

  if (!isWeb) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center animate-fade-in">
        <div className="w-16 h-16 rounded-[20px] bg-primary flex items-center justify-center shadow-xl mb-6 shadow-primary/20">
           <span className="text-white font-black text-3xl tracking-tighter">Te</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-black/5 border-t-primary animate-spin" />
          <p className="text-[10px] font-black text-tertiary tracking-[0.2em] uppercase">Authenticating</p>
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
        window.location.reload(); 
      }
    }} />
  );
};
