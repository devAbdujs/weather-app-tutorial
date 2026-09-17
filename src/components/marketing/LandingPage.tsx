'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LandingPageProps {
  onLogin: (user: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as any).onTelegramAuth = async (user: any) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webData: user }),
        });
        if (res.ok) {
          window.location.reload();
        } else {
          const data = await res.json();
          setError(data.error || 'Authentication failed.');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_BOT_USERNAME || 'toptemari_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-radius', '10');
      script.async = true;
      widgetRef.current.appendChild(script);
    }

    return () => { delete (window as any).onTelegramAuth; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ground px-6">

      {/* App Icon — real Temari logo */}
      <div className="w-24 h-24 rounded-[28px] overflow-hidden mb-6 shadow-lg">
        <img
          src="/assets/temari logo.png"
          alt="Temari"
          className="w-full h-full object-cover"
        />
      </div>

      {/* App name */}
      <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight mb-1">
        Temari
      </h1>

      {/* Tagline */}
      <p className="text-[15px] text-[#8E8E93] text-center mb-8 max-w-[220px] leading-snug">
        Ethiopian exam prep, powered by AI
      </p>

      {/* White card */}
      <div className="w-full max-w-[340px] bg-white rounded-2xl shadow-sm px-6 py-7 flex flex-col items-center gap-4">

        <p className="text-[13px] text-[#8E8E93] text-center leading-relaxed">
          Log in with your Telegram account to sync your progress across devices.
        </p>

        {/* Telegram Widget */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <div className="w-5 h-5 rounded-full border-2 border-[#2AABEE]/30 border-t-[#2AABEE] animate-spin" />
            <span className="text-sm text-[#8E8E93]">Logging you in…</span>
          </div>
        ) : (
          <div ref={widgetRef} className="flex items-center justify-center min-h-[48px]" />
        )}

        {error && (
          <p className="text-[13px] text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* Fine print */}
      <p className="text-[11px] text-[#C7C7CC] text-center mt-6 max-w-[260px] leading-relaxed">
        By continuing, you agree to our Terms of Service. Your Telegram data is only used to identify your account.
      </p>

      {/* Dev bypass — localhost only */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={async () => {
            setIsLoading(true);
            const res = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ devMode: true }),
            });
            if (res.ok) window.location.reload();
            else setIsLoading(false);
          }}
          className="mt-6 px-5 py-2 bg-yellow-400 border-2 border-black font-bold text-xs rounded-xl"
        >
          ⚡ DEV BYPASS
        </button>
      )}
    </div>
  );
};
