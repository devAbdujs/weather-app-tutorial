'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface LandingPageProps {
  onLogin: (user: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'create'>('signin');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const widgetRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate greeting and date
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const dateStr = format(new Date(), 'MMM d').toUpperCase();

  // Removed legacy invisible widget logic

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 3) pinRefs.current[index + 1]?.focus();
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePhoneAuth = async () => {
    if (!phone || pin.join('').length !== 4) return;
    
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin: pin.join(''), action: activeTab }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        setError(data.error || 'Authentication failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Network error occurred.');
      setIsLoading(false);
    }
  };

  const isFormValid = phone.length >= 9 && pin.join('').length === 4 && !isLoading;

  const handleTelegramOIDCLogin = async () => {
    
    setIsLoading(true);
    try {
      const { generateRandomString, generateCodeChallenge } = await import('@/lib/pkce');
      
      const codeVerifier = generateRandomString(64);
      const state = generateRandomString(32);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      sessionStorage.setItem('tg_oidc_verifier', codeVerifier);
      sessionStorage.setItem('tg_oidc_state', state);

      const BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID || '8400954528'; 
      const currentOrigin = window.location.origin;
      const redirectUri = `${currentOrigin}/auth/callback`;
      
      const authUrl = `https://oauth.telegram.org/auth?client_id=${BOT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid+profile+phone+telegram:bot_access&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initialize login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ground px-4 sm:px-6 py-8">
      
      {/* Center Card */}
      <div className="w-full max-w-[420px] bg-card rounded-[24px] shadow-sm px-6 py-8 flex flex-col">
        
        {/* 1. Header Row */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-[11px] font-bold text-tertiary tracking-widest uppercase">
            {greeting}
          </span>
          <div className="bg-ground px-2.5 py-1 rounded-full border border-black/5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
              {dateStr}
            </span>
          </div>
        </div>

        {/* 2. Logo Block */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-sm border border-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/temari logo.png" alt="Temari" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight mb-1">
            Temari App
          </h1>
          <p className="text-[14px] font-medium text-tertiary text-center">
            AI-powered Exam Preparation and Study Partner for Ethiopian Students.
          </p>
        </div>

        {/* 3. Tab Switcher */}
        <div className="bg-ground p-1 rounded-xl flex items-center mb-8 border border-black/5">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${
              activeTab === 'signin' ? 'bg-white text-primary shadow-sm' : 'text-tertiary hover:text-secondary'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${
              activeTab === 'create' ? 'bg-white text-primary shadow-sm' : 'text-tertiary hover:text-secondary'
            }`}
          >
            Create account
          </button>
        </div>

        {/* 4. Primary Telegram Button (Direct Redirect Flow) */}
        <div className="flex flex-col items-center w-full mb-6">
          {isLoading ? (
            <div className="w-full h-12 rounded-xl bg-[#229ED9]/10 flex items-center justify-center gap-2 border border-[#229ED9]/20">
              <div className="w-4 h-4 rounded-full border-2 border-[#229ED9]/30 border-t-[#229ED9] animate-spin" />
              <span className="text-sm font-bold text-[#229ED9]">Connecting...</span>
            </div>
          ) : (
            <button 
              onClick={handleTelegramOIDCLogin}
              className="w-full h-[48px] bg-[#229ED9] rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-[#1E8CC0] active:scale-[0.98] transition-all"
            >
              <Send className="w-5 h-5 text-white" />
              <span className="text-[15px] font-bold text-white tracking-wide">Continue with Telegram</span>
            </button>
          )}
          {error && <p className="text-[13px] text-red-500 font-medium mt-3 text-center">{error}</p>}
        </div>

        {/* 5. Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-black/5" />
          <span className="text-[11px] font-bold text-tertiary tracking-widest">OR</span>
          <div className="flex-1 h-px bg-black/5" />
        </div>

        {/* 6. Phone + PIN Fallback */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="w-4 h-4 text-tertiary" />
            </div>
            <input
              type="tel"
              placeholder="0912 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-[48px] pl-11 pr-4 bg-ground border border-black/5 rounded-xl text-[15px] font-medium text-primary placeholder:text-tertiary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { pinRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(index, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(index, e)}
                  onFocus={e => e.target.select()}
                  className="w-full aspect-square text-center text-xl font-bold bg-ground border border-black/5 rounded-xl text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                />
              ))}
            </div>
            <button className="text-[12px] font-semibold text-accent-blue self-end hover:underline">
              Send me a code
            </button>
          </div>
        </div>

        {/* 7. Submit Button */}
        <button
          onClick={handlePhoneAuth}
          disabled={!isFormValid}
          className={`w-full h-[48px] rounded-xl text-[15px] font-bold flex justify-center items-center gap-2 transition-all ${
            isFormValid 
              ? 'bg-primary text-white shadow-sm active:scale-[0.98]' 
              : 'bg-ground text-tertiary cursor-not-allowed border border-black/5'
          }`}
        >
          {isLoading ? <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : (activeTab === 'signin' ? 'Sign In' : 'Create Account')}
        </button>
      </div>

      {/* 8. Footer */}
      <p className="text-[11px] text-tertiary font-medium text-center mt-6 max-w-[280px] leading-relaxed">
        By continuing, you agree to our <a href="#" className="underline hover:text-primary">Terms of Service</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
      </p>

      {/* Dev bypass */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={async () => {
            
            const res = await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ devMode: true }) });
            if (res.ok) window.location.reload();
            else setIsLoading(false);
          }}
          className="mt-6 px-4 py-1.5 bg-yellow-400 border border-yellow-500 text-yellow-900 font-bold text-[10px] tracking-wider rounded-lg"
        >
          DEV BYPASS
        </button>
      )}
    </div>
  );
};
