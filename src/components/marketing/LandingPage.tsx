'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Brain, BookOpen, PenLine, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onLogin: (user: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Define global callback for Telegram Widget
    (window as any).onTelegramAuth = async (user: any) => {
      setIsLoading(true);
      try {
        // Securely verify with backend
        const res = await fetch('/api/auth/telegram/web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        
        if (res.ok) {
          onLogin(user); // Triggers parent to save to localStorage and show app
        } else {
          const errData = await res.json();
          setError(errData.error || 'Authentication failed');
        }
      } catch (err) {
        setError('Network error during login');
      } finally {
        setIsLoading(false);
      }
    };

    // 2. Inject the Telegram Login Widget script securely
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_BOT_USERNAME || 'EthioScholarBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    
    const container = document.getElementById('telegram-login-container');
    if (container && !container.hasChildNodes()) {
      container.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [onLogin]);

  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center font-sans animate-fade-in relative overflow-hidden">
      
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-accent-amber/20 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent-blue/20 rounded-full blur-3xl z-0" />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        
        <div className="w-16 h-16 bg-primary rounded-[20px] flex items-center justify-center shadow-brutal-sm mb-6 rotate-[-3deg]">
          <BookOpen className="w-8 h-8 text-card" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black text-primary tracking-tight leading-tight mb-4">
          Master Your <br/>
          <span className="text-accent-blue">National Exams</span>
        </h1>
        
        <p className="text-base font-bold text-tertiary mb-10 max-w-[280px]">
          Join thousands of Ethiopian students studying smarter with AI-powered notes, flashcards, and real practice papers.
        </p>

        {/* Telegram Web Login Widget Container */}
        <div className="bg-card w-full p-6 rounded-[24px] border-2 border-black/10 shadow-sm flex flex-col items-center">
          <h2 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Continue with Telegram</h2>
          
          {isLoading ? (
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div id="telegram-login-container" className="min-h-[40px] flex items-center justify-center"></div>
              {process.env.NODE_ENV === 'development' && (
                <button 
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const res = await fetch('/api/auth/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ devMode: true })
                      });
                      if (res.ok) window.location.reload();
                    } catch (e) {
                      console.error(e);
                      setIsLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-yellow-400 border-2 border-black font-bold text-xs rounded-xl shadow-brutal-sm"
                >
                  ⚡ DEV BYPASS LOGIN
                </button>
              )}
            </div>
          )}

          {error && <p className="text-red-500 font-bold text-xs mt-3">{error}</p>}
          
          <p className="text-[10px] font-bold text-tertiary mt-4 max-w-[200px] leading-relaxed">
            By logging in, you can sync your progress across the Web and Telegram Mini App.
          </p>
        </div>

      </div>
    </div>
  );
};
