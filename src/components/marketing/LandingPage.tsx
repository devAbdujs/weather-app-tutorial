'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

interface LandingPageProps {
  onLogin: (user: unknown) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin: _onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const dateStr = format(new Date(), 'MMM d').toUpperCase();

  const handleTelegramOIDCLogin = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ground dark:bg-ground px-4 sm:px-6 py-8">

      {/* Center Card */}
      <div className="w-full max-w-[420px] bg-card dark:bg-card rounded-[24px] shadow-sm border border-black/5 dark:border-white/8 px-6 py-8 flex flex-col">

        {/* Header Row */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
            {greeting}
          </span>
          <div className="bg-ground dark:bg-surface-2 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/8 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100 tracking-wider uppercase">
              {dateStr}
            </span>
          </div>
        </div>

        {/* Logo Block */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-5 shadow-sm border border-black/5 dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/temari logo.png"
              alt="Temari"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-[28px] font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
            Temari
          </h1>
          <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 text-center leading-relaxed max-w-[260px]">
            AI-powered exam prep for Ethiopian students. 31,000+ past questions.
          </p>
        </div>

        {/* Telegram Login Button */}
        {isLoading ? (
          <div className="w-full h-14 rounded-2xl bg-[#229ED9]/10 flex items-center justify-center gap-2.5 border border-[#229ED9]/20">
            <div className="w-4 h-4 rounded-full border-2 border-[#229ED9]/30 border-t-[#229ED9] animate-spin" />
            <span className="text-sm font-bold text-[#229ED9]">Connecting…</span>
          </div>
        ) : (
          <button
            onClick={handleTelegramOIDCLogin}
            className="
              w-full h-14 bg-[#229ED9] rounded-2xl
              flex items-center justify-center gap-2.5
              shadow-sm hover:bg-[#1E8CC0]
              active:scale-[0.98] transition-all
            "
          >
            <Send className="w-5 h-5 text-white" />
            <span className="text-[15px] font-bold text-white tracking-wide">
              Continue with Telegram
            </span>
          </button>
        )}

        {error && (
          <p className="text-[13px] text-red-500 font-medium mt-4 text-center">{error}</p>
        )}

        {/* Footer */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium text-center mt-6 leading-relaxed">
          By continuing, you agree to our{' '}
          <a href="#" className="underline hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-300">
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-300">
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {/* Dev bypass — development only */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={async () => {
            const res = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ devMode: true }),
            });
            if (res.ok) window.location.reload();
          }}
          className="mt-6 px-4 py-1.5 bg-yellow-400 border border-yellow-500 text-yellow-900 font-bold text-[10px] tracking-wider rounded-lg"
        >
          DEV BYPASS
        </button>
      )}
    </div>
  );
};
