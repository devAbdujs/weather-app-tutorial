'use client';

import React, { useRef, useState } from 'react';
import { BookOpen, Send, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onLogin: (user: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'get-code' | 'enter-code'>('get-code');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'toptemari_bot';

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only keep last char
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center font-sans animate-fade-in relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-yellow/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 flex flex-col items-center">

        {/* Logo */}
        <div className="w-16 h-16 bg-primary rounded-2xl shadow-brutal-sm flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-6">
          <BookOpen className="w-8 h-8 text-card" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-primary tracking-tight leading-tight mb-4">
          Master Your <br/>
          <span className="text-accent-blue">National Exams</span>
        </h1>

        <p className="text-base font-bold text-tertiary mb-10 max-w-[280px]">
          AI-powered notes, flashcards, and real practice papers for Ethiopian students.
        </p>

        {/* Auth Card */}
        <div className="bg-card w-full p-6 rounded-[24px] border-2 border-primary shadow-brutal-sm flex flex-col items-center gap-4">

          {step === 'get-code' ? (
            <>
              <div className="w-full text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 bg-primary text-card rounded-full text-xs font-black flex items-center justify-center">1</span>
                  <span className="text-sm font-black text-primary uppercase tracking-wider">Open our Telegram bot</span>
                </div>
                <p className="text-xs font-bold text-tertiary ml-8">Tap Start — the bot will send you a login code instantly.</p>
              </div>

              <a
                href={`https://t.me/${BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-accent-blue text-white font-black text-sm rounded-xl border-2 border-primary shadow-brutal-sm active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <Send className="w-4 h-4" />
                Open @{BOT_USERNAME}
                <ArrowRight className="w-4 h-4 ml-auto" />
              </a>

              <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-px bg-primary/10" />
                <span className="text-xs font-bold text-tertiary">then</span>
                <div className="flex-1 h-px bg-primary/10" />
              </div>

              <div className="w-full text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 bg-primary text-card rounded-full text-xs font-black flex items-center justify-center">2</span>
                  <span className="text-sm font-black text-primary uppercase tracking-wider">Got your code?</span>
                </div>
                <p className="text-xs font-bold text-tertiary ml-8">Enter the 6-digit code the bot sends you.</p>
              </div>

              <button
                onClick={() => setStep('enter-code')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-card text-primary font-black text-sm rounded-xl border-2 border-primary shadow-brutal-sm active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                I have my code →
              </button>
            </>
          ) : (
            <>
              <div className="w-full text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 bg-primary text-card rounded-full text-xs font-black flex items-center justify-center">2</span>
                  <span className="text-sm font-black text-primary uppercase tracking-wider">Enter your 6-digit code</span>
                </div>
                <p className="text-xs font-bold text-tertiary ml-8">Check your Telegram DM from @{BOT_USERNAME}.</p>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex gap-2 justify-center w-full">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    onFocus={e => e.target.select()}
                    className="w-11 h-14 text-center text-2xl font-black border-2 border-primary rounded-xl bg-ground text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-all shadow-brutal-sm"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 font-bold text-xs">{error}</p>
              )}

              <button
                onClick={handleVerify}
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-primary text-card font-black text-sm rounded-xl border-2 border-primary shadow-brutal-sm active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Log In →'}
              </button>

              <button
                onClick={() => { setStep('get-code'); setOtp(['','','','','','']); setError(null); }}
                className="text-xs font-bold text-tertiary underline"
              >
                ← Go back
              </button>
            </>
          )}

          {/* Dev bypass */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={async () => {
                setIsLoading(true);
                const res = await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ devMode: true }) });
                if (res.ok) window.location.reload();
                else setIsLoading(false);
              }}
              className="w-full py-2 bg-yellow-400 border-2 border-black font-bold text-xs rounded-xl"
            >
              ⚡ DEV BYPASS LOGIN
            </button>
          )}
        </div>

        <p className="text-[10px] font-bold text-tertiary mt-6 max-w-[250px] leading-relaxed">
          By logging in, you agree to sync your progress across the Web and Telegram Mini App.
        </p>
      </div>
    </div>
  );
};
