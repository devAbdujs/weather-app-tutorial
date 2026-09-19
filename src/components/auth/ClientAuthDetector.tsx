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
      
      // Check for OIDC OAuth Redirect callback parameters in URL
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('code') && searchParams.get('state')) {
        // We're in an OAuth callback - show spinner while processing
        setIsAuthenticating(true);
        fetch('/api/auth/oidc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code: searchParams.get('code'),
            code_verifier: sessionStorage.getItem('tg_oidc_verifier'),
            redirect_uri: window.location.origin + '/auth/callback'
          })
        }).then(res => {
          if (res.ok) {
            sessionStorage.removeItem('tg_oidc_state');
            sessionStorage.removeItem('tg_oidc_verifier');
            window.location.replace('/');
          } else {
            setIsAuthenticating(false);
          }
        }).catch(() => setIsAuthenticating(false));
        return;
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
        window.location.replace('/'); 
      }
    }} />
  );
};
