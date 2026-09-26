'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { 
  ShieldCheck, 
  Upload, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Zap, 
  ArrowRight,
  BookOpen,
  Award,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import confetti from 'canvas-confetti';

type FlowPhase = 'form' | 'verifying' | 'approved' | 'rejected';

export default function UpgradePage() {
  const router = useRouter();
  const { setBackButton, haptic } = useTelegram();
  const [file, setFile] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<FlowPhase>('form');
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('Scholar');
  const [error, setError] = useState('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // 5-minute countdown (300 seconds)
  const [secondsLeft, setSecondsLeft] = useState(300);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBackButton(true, () => router.back());
    return () => setBackButton(false);
  }, [setBackButton, router]);

  // Check on initial load if the user is already premium or has an active pending payment
  useEffect(() => {
    let isMounted = true;
    async function checkCurrentStatus() {
      try {
        const res = await fetch('/api/payments/status');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.studentName) {
          setStudentName(data.studentName);
        }

        if (data.isApproved || data.subscriptionStatus === 'premium') {
          setPhase('approved');
        } else if (data.receiptStatus === 'pending') {
          // Resume verification countdown if already submitted
          setPhase('verifying');
        }
      } catch (e) {
        // Silently continue to form
      }
    }
    checkCurrentStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown timer logic when in 'verifying' phase
  useEffect(() => {
    if (phase === 'verifying') {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase]);

  // Real-time polling logic to detect admin approval
  useEffect(() => {
    if (phase === 'verifying') {
      const pollStatus = async () => {
        try {
          const url = receiptId 
            ? `/api/payments/status?receiptId=${encodeURIComponent(receiptId)}`
            : '/api/payments/status';
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();

          if (data.studentName) {
            setStudentName(data.studentName);
          }

          if (data.isApproved || data.subscriptionStatus === 'premium' || data.receiptStatus === 'approved') {
            setPhase('approved');
            haptic.notification('success');
            triggerConfetti();
          } else if (data.receiptStatus === 'rejected') {
            setPhase('rejected');
            haptic.notification('error');
          }
        } catch (e) {
          // Network hiccup — keep polling
        }
      };

      // Poll every 3.5 seconds
      pollingRef.current = setInterval(pollStatus, 3500);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [phase, receiptId, haptic]);

  // Trigger high-energy confetti burst
  const triggerConfetti = () => {
    try {
      const count = 200;
      const defaults = { origin: { y: 0.6 } };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch (e) {
      console.warn('Confetti animation error:', e);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(type);
    haptic.selection();
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      haptic.selection();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a screenshot of your receipt.');
      haptic.notification('error');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('transactionId', transactionId);

      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payment.');

      if (data.receiptId) {
        setReceiptId(data.receiptId);
      }

      haptic.notification('success');
      setSecondsLeft(300); // 5 min timer starts
      setPhase('verifying');
    } catch (err: any) {
      setError(err.message);
      haptic.notification('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────
  // 1. APPROVED / CELEBRATION SCREEN
  // ─────────────────────────────────────────────────────────────
  if (phase === 'approved') {
    return (
      <div className="min-h-screen bg-ground pb-24 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        {/* Glow Ring */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 via-emerald-400 to-primary rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-bounce">
            <Award className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -inset-2 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
        </div>

        {/* Heartwarming Congratulations */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Premium Activated
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          Welcome to the Family, {studentName}! 🎉
        </h1>

        <p className="text-gray-600 dark:text-gray-300 font-medium mb-8 max-w-sm leading-relaxed text-sm">
          Your payment has been officially confirmed! You just unlocked unlimited access to 
          <span className="font-bold text-gray-900 dark:text-white"> 31,000+ past questions</span>, 
          instant <span className="font-bold text-primary">AI Tutoring</span>, and full analytics. 
          We believe in you — let's make your academic dream happen! 🌟
        </p>

        {/* Feature Highlights Card */}
        <div className="w-full max-w-sm bg-card border border-emerald-500/20 rounded-2xl p-4 mb-8 text-left space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Infinite AI Tutor Explanations</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Ask any question at any time</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">All Past Exam Archives</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Entrance, Freshman, & Exit exams</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Mastery & Streaks Tracking</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Track your Scholar Tree growth</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xs space-y-3">
          <button 
            onClick={() => {
              haptic.impact('heavy');
              router.push('/practice');
            }}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-primary text-white font-black shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            Start Practicing Now 🚀
            <ArrowRight className="w-5 h-5" />
          </button>

          <button 
            onClick={() => router.push('/')}
            className="w-full h-12 rounded-2xl bg-card border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold active:scale-[0.98] transition-transform text-sm"
          >
            Go to Home Hub
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. INTERACTIVE VERIFYING / COUNTDOWN SCREEN
  // ─────────────────────────────────────────────────────────────
  if (phase === 'verifying') {
    return (
      <div className="min-h-screen bg-ground pb-24 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <TopHeader />

        <div className="max-w-sm w-full mx-auto pt-6 flex flex-col items-center">
          {/* Animated Verification Pulse */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-ground animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
            Verifying Your Payment
          </h1>

          <p className="text-gray-600 dark:text-gray-400 font-medium text-sm mb-6 max-w-xs">
            Our AI & verification admin are reviewing your receipt. Most approvals complete in under 5 minutes!
          </p>

          {/* Large Countdown Badge */}
          <div className="bg-card border-2 border-primary/20 rounded-3xl p-6 mb-6 shadow-sm w-full relative overflow-hidden">
            <div className="text-xs font-black uppercase tracking-widest text-primary mb-1">
              Estimated Approval In
            </div>

            <div className="text-5xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 mb-2">
              {formatTimer(secondsLeft)}
            </div>

            {/* Live Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-white/10 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-primary h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${Math.max(5, ((300 - secondsLeft) / 300) * 100)}%` }}
              />
            </div>

            {/* Real-time Status Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Listening for approval live...
            </div>
          </div>

          {/* 3 Step Interactive Progress */}
          <div className="w-full bg-card border border-black/5 dark:border-white/10 rounded-2xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">1. Receipt Uploaded</p>
                <p className="text-[11px] text-gray-500">Image submitted to database</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black animate-spin">
                ⏳
              </div>
              <div>
                <p className="text-xs font-bold text-primary">2. AI & Bank Verification</p>
                <p className="text-[11px] text-gray-500">Extracting transaction reference</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 flex items-center justify-center text-xs font-black">
                🔓
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">3. Instant Premium Upgrade</p>
                <p className="text-[11px] text-gray-500">Auto-unlocks all exams & AI tutor</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 italic">
            💡 Feel free to explore the app. We will notify you immediately the second it is approved!
          </p>

          <button 
            onClick={() => router.push('/practice')}
            className="w-full h-12 rounded-2xl bg-card border border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-200 font-bold active:scale-[0.98] transition-transform text-sm"
          >
            Practice Free Questions While Waiting
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. REJECTED SCREEN
  // ─────────────────────────────────────────────────────────────
  if (phase === 'rejected') {
    return (
      <div className="min-h-screen bg-ground pb-24 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          Receipt Not Verified
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-8 max-w-sm text-sm">
          We couldn't confirm this transaction. Please ensure the screenshot clearly displays the full transaction reference and transfer amount.
        </p>
        <button 
          onClick={() => {
            setPhase('form');
            setFile(null);
            setTransactionId('');
          }}
          className="w-full max-w-xs h-14 rounded-2xl bg-primary text-white font-black shadow-lg active:scale-[0.98] transition-transform"
        >
          Try Uploading Again
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. MAIN FORM SCREEN (PAYMENT INSTRUCTIONS & UPLOAD)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-ground pb-24">
      <TopHeader />
      
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          Unlock Premium 🚀
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-8 text-sm">
          Get unlimited AI tutor access, full exam past papers, and progress tracking.
        </p>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-[24px] shadow-xl shadow-primary/20 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <h2 className="text-lg font-bold text-white/90 mb-1">Premium Pass</h2>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black">199 ETB</span>
            <span className="text-white/80 font-medium">/ term</span>
          </div>
          <ul className="space-y-2 text-sm font-medium text-white/90">
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-300" /> Infinite AI Tutor Explanations</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-300" /> 31,000+ Past Questions with Answers</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-300" /> Topic Mastery & Exam Analytics</li>
          </ul>
        </div>

        {/* Payment Instructions */}
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> Transfer Details
        </h3>
        
        <div className="space-y-3 mb-8">
          {/* CBE */}
          <div className="bg-card border border-black/5 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Commercial Bank of Ethiopia (CBE)
              </p>
              <p className="font-black text-lg text-gray-900 dark:text-gray-100 font-mono tracking-tight">
                1000217910448
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => handleCopy('1000217910448', 'cbe')} 
              className="text-primary font-bold text-xs bg-primary/10 px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5"
            >
              {copiedBank === 'cbe' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBank === 'cbe' ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Telebirr */}
          <div className="bg-card border border-black/5 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Telebirr
              </p>
              <p className="font-black text-lg text-gray-900 dark:text-gray-100 font-mono tracking-tight">
                0942202051
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => handleCopy('0942202051', 'telebirr')} 
              className="text-primary font-bold text-xs bg-primary/10 px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5"
            >
              {copiedBank === 'telebirr' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBank === 'telebirr' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-card border-2 border-primary/10 p-5 rounded-[24px] shadow-sm">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Upload Screenshot
          </h3>

          {error && (
            <div className="p-3 mb-4 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-xl text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Transaction ID / Ref (Optional)
            </label>
            <input 
              type="text" 
              placeholder="e.g. FT23101... or Telebirr Ref"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full bg-ground border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium text-sm"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Payment Screenshot *
            </label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full border-2 border-dashed rounded-xl px-4 py-6 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-black/20 dark:border-white/20 bg-ground'}`}>
                {file ? (
                  <span className="font-bold text-primary truncate block text-sm">{file.name}</span>
                ) : (
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300 block text-sm">Tap to select receipt image</span>
                    <span className="text-xs text-gray-400 mt-1 block">Supports JPG, PNG, or mobile screenshot</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !file}
            className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-md shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Uploading Receipt...</span>
              </div>
            ) : (
              'Submit for Instant Verification'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
