'use client';

import React, { useEffect, useState } from 'react';
import { LandingPage } from '@/components/marketing/LandingPage';

export const ClientAuthDetector: React.FC = () => {
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
          window.location.replace('/dashboard'); 
        } else {
          setIsAuthenticating(false);
        }
      } catch {
        setIsAuthenticating(false);
      }
    };

    const checkTelegram = () => {
      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;

      if (tg && tg.initData) {
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

  return (
    <LandingPage />
  );
};
