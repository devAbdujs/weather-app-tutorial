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
  Check,
  ImageIcon,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '@/lib/sounds';
import { TemariMascot } from '@/components/mascot/TemariMascot';
import { useAppStore } from '@/store/useAppStore';

type FlowPhase = 'loading' | 'form' | 'verifying' | 'approved' | 'rejected';

export default function UpgradePage() {
  const router = useRouter();
  const { setBackButton, haptic } = useTelegram();
  const userProfile = useAppStore(s => s.userProfile);
  const isInitiallyPro = userProfile?.subscription_status === 'premium';

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<FlowPhase>(isInitiallyPro ? 'approved' : 'loading');
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>(userProfile?.first_name || 'Scholar');
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
        if (!res.ok) {
          if (isMounted) setPhase(isInitiallyPro ? 'approved' : 'form');
          return;
        }
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
        } else {
          setPhase('form');
        }
      } catch (e) {
        if (isMounted) setPhase(isInitiallyPro ? 'approved' : 'form');
      }
    }
    checkCurrentStatus();
    return () => {
      isMounted = false;
    };
  }, [isInitiallyPro]);

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

  // Clean up object URL when unmounted or changed
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selected));
      setError('');
      haptic.selection();
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    haptic.selection();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Client-side image compression to stay safely below Vercel's 4.5MB payload limit
  const compressImage = async (inputFile: File): Promise<Blob> => {
    if (inputFile.size <= 1.5 * 1024 * 1024) return inputFile; // already small enough

    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(inputFile);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob || inputFile),
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(inputFile);
      };
      img.src = objectUrl;
    });
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
      const optimizedBlob = await compressImage(file);
      const uploadFile = new File([optimizedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
        type: 'image/jpeg'
      });

      const formData = new FormData();
      formData.append('receipt', uploadFile);

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
  // 0. MEMBERSHIP LOADING SCREEN
  // ─────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-500 border border-amber-400/30 flex items-center justify-center text-xl font-black mb-3 shadow-tactile-xs animate-pulse">
          👑
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Verifying Membership...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 1. APPROVED / CELEBRATION SCREEN
  // ─────────────────────────────────────────────────────────────
  if (phase === 'approved') {
    return (
      <div className="min-h-screen bg-ground pb-24 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        {/* Teme Celebrating Mascot */}
        <div className="mb-4">
          <TemariMascot mood="celebrating" size={120} />
        </div>

        {/* Heartwarming Congratulations */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-accent-emerald/15 border border-accent-emerald/30 text-accent-emerald text-xs font-black uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Premium Activated
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          Welcome to the Family, {studentName}! 🎉
        </h1>

        <p className="text-gray-600 dark:text-gray-300 font-medium mb-6 max-w-sm leading-relaxed text-sm">
          Your payment has been officially confirmed! You just unlocked unlimited access to 
          <span className="font-bold text-gray-900 dark:text-white"> 31,000+ past questions</span>, 
          instant <span className="font-bold text-primary">AI Tutoring</span>, and full analytics. 
          We believe in you — let's make your academic dream happen! 🌟
        </p>

        {/* Feature Highlights Card */}
        <div className="w-full max-w-sm bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-2xl p-4 mb-6 text-left space-y-3 shadow-tactile-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-emerald/15 text-accent-emerald flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-gray-100">Infinite AI Tutor Explanations</p>
              <p className="text-caption text-gray-500 dark:text-gray-400">Ask any question at any time</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-gray-100">All Past Exam Archives</p>
              <p className="text-caption text-gray-500 dark:text-gray-400">Entrance, Freshman, & Exit exams</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-gold/15 text-accent-gold flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-gray-100">Mastery & Streaks Tracking</p>
              <p className="text-caption text-gray-500 dark:text-gray-400">Track your Scholar Tree growth</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xs space-y-3">
          <button 
            onClick={() => {
              sounds.playTap();
              haptic.impact('heavy');
              router.push('/practice');
            }}
            className="btn-3d-primary w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
          >
            Start Practicing Now 🚀
            <ArrowRight className="w-5 h-5" />
          </button>

          <button 
            onClick={() => { sounds.playTap(); router.push('/'); }}
            className="btn-3d-card w-full py-3 rounded-2xl font-black text-sm text-gray-700 dark:text-gray-300"
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
      <div className="min-h-screen bg-ground pb-24 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="max-w-sm w-full mx-auto pt-6 flex flex-col items-center">
          {/* Teme Mascot studying/verifying */}
          <div className="relative mb-3">
            <TemariMascot mood="studying" size={100} />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
            Verifying Your Payment
          </h1>

          <p className="text-gray-600 dark:text-gray-400 font-medium text-sm mb-6 max-w-xs">
            Our AI &amp; verification admin are reviewing your receipt. Most approvals complete in under 5 minutes!
          </p>

          {/* Large Countdown Badge */}
          <div className="bg-card border border-primary/25 border-b-bevel rounded-2xl p-6 mb-6 shadow-tactile-sm w-full relative overflow-hidden">
            <div className="text-xs font-black uppercase tracking-widest text-primary mb-1">
              Estimated Approval In
            </div>

            <div className="text-5xl font-black font-mono tracking-tight text-gray-900 dark:text-gray-100 mb-2 tabular-nums">
              {formatTimer(secondsLeft)}
            </div>

            {/* Live Progress Bar */}
            <div className="w-full bg-black/5 dark:bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5 mb-3">
              <div 
                className="bg-primary h-full transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${Math.max(5, ((300 - secondsLeft) / 300) * 100)}%` }}
              />
            </div>

            {/* Real-time Status Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-accent-emerald bg-accent-emerald/10 px-3 py-1.5 rounded-full border border-accent-emerald/20">
              <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
              Listening for approval live...
            </div>
          </div>

          {/* 3 Step Interactive Progress */}
          <div className="w-full bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-2xl p-4 mb-6 text-left space-y-3 shadow-tactile-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-accent-emerald text-white flex items-center justify-center text-xs font-black">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">1. Receipt Uploaded</p>
                <p className="text-caption text-gray-500">Image submitted to database</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black">
                ⏳
              </div>
              <div>
                <p className="text-xs font-bold text-primary">2. AI &amp; Bank Verification</p>
                <p className="text-caption text-gray-500">Extracting transaction reference</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 text-gray-500 flex items-center justify-center text-xs font-black">
                🔓
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">3. Instant Premium Upgrade</p>
                <p className="text-caption text-gray-500">Auto-unlocks all exams &amp; AI tutor</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 italic">
            💡 Feel free to explore the app. We will notify you immediately the second it is approved!
          </p>

          <button 
            onClick={() => { sounds.playTap(); router.push('/practice'); }}
            className="btn-3d-card w-full py-3.5 rounded-2xl font-black text-sm text-gray-800 dark:text-gray-200"
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
      <div className="min-h-screen bg-ground pb-24 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-error/10 border border-error/20 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-error" />
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
            handleRemoveFile();
          }}
          className="w-full max-w-xs h-14 rounded-2xl bg-gray-950 hover:bg-black text-white dark:bg-white dark:text-gray-950 font-black shadow-tactile-md active:scale-[0.98] transition-all border-2 border-b-[4px] border-black dark:border-white"
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
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          Unlock Premium 🚀
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-5 text-sm">
          Get unlimited AI tutor access, full exam past papers, and progress tracking.
        </p>

        {/* Mascot Encouragement */}
        <div className="flex items-center gap-3 mb-5 bg-card border border-black/[0.08] dark:border-white/[0.08] border-b-bevel rounded-card-lg p-4 shadow-tactile-sm">
          <TemariMascot mood="happy" size={56} className="shrink-0" />
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-snug">
            &ldquo;Unlock everything once, study with zero limits! 31,000+ past questions and unlimited AI explanations.&rdquo;
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-primary to-primary/85 p-6 rounded-card-lg border border-primary/40 border-b-bevel-lg border-b-black/30 shadow-tactile-md text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.06] rounded-full blur-2xl -mr-10 -mt-10" />
          <h2 className="text-lg font-bold text-white/85 mb-1">Premium Pass</h2>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black">199 ETB</span>
            <span className="text-white/75 font-medium">/ term</span>
          </div>
          <ul className="space-y-2 text-sm font-medium text-white/85">
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-white/70" /> Infinite AI Tutor Explanations</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-white/70" /> 31,000+ Past Questions with Answers</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-white/70" /> Topic Mastery &amp; Exam Analytics</li>
          </ul>
        </div>

        {/* Step 1: Payment Instructions */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-950 text-white dark:bg-white dark:text-gray-950 flex items-center justify-center text-xs font-black shadow-2xs">
              1
            </span>
            Transfer 199 ETB
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Choose payment method</span>
        </div>
        
        <div className="space-y-3 mb-6">
          {/* CBE */}
          <div className="bg-card border border-black/5 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-caption font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Commercial Bank of Ethiopia (CBE)
              </p>
              <p className="font-black text-lg text-gray-900 dark:text-gray-100 font-mono tracking-tight">
                1000217910448
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => handleCopy('1000217910448', 'cbe')} 
              className="text-primary font-bold text-xs bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5"
            >
              {copiedBank === 'cbe' ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBank === 'cbe' ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Telebirr */}
          <div className="bg-card border border-black/5 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-caption font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Telebirr
              </p>
              <p className="font-black text-lg text-gray-900 dark:text-gray-100 font-mono tracking-tight">
                0942202051
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => handleCopy('0942202051', 'telebirr')} 
              className="text-primary font-bold text-xs bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5"
            >
              {copiedBank === 'telebirr' ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBank === 'telebirr' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Step 2: Upload Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-black/5 dark:border-white/10 p-5 rounded-hero shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-950 text-white dark:bg-white dark:text-gray-950 flex items-center justify-center text-xs font-black shadow-2xs">
                2
              </span>
              Upload Payment Receipt
            </h3>
            <span className="text-caption font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Instant AI OCR
            </span>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Hidden File Input */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Dropzone or File Preview Card */}
          <div className="mb-5">
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-primary/30 hover:border-primary dark:border-white/20 hover:bg-primary/5 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center group active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  Tap to upload receipt screenshot
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  CBE Mobile, CBE Birr, or Telebirr (JPG, PNG)
                </p>
              </div>
            ) : (
              <div className="w-full bg-ground border border-accent-emerald/30 rounded-2xl p-3.5 flex items-center gap-3.5 animate-in fade-in duration-200">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Receipt preview" 
                    className="w-16 h-16 rounded-xl object-cover border border-black/10 dark:border-white/10 shrink-0 bg-black/5" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-accent-emerald text-xs font-bold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Receipt attached</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-caption text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    aria-label="Remove photo"
                    className="p-1.5 rounded-xl text-gray-400 hover:text-error hover:bg-error/10 transition-colors active:scale-95"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !file}
            className="btn-3d-primary w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:border-b-4 disabled:active:translate-y-0"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Optimizing & Submitting...</span>
              </div>
            ) : (
              'Submit for Instant Verification 🚀'
            )}
          </button>

          <p className="text-center text-caption text-gray-400 font-medium mt-3 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-emerald" />
            Auto-approved in ~5 minutes • Instant access unlocked
          </p>
        </form>
      </div>
    </div>
  );
}
