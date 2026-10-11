'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Copy, 
  Upload, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTelegram } from '@/hooks/useTelegram';
import { sounds } from '@/lib/sounds';

// Simple canvas image compression to stay within payload limits
async function compressReceiptImage(inputFile: File): Promise<Blob> {
  if (inputFile.size <= 1.5 * 1024 * 1024) return inputFile;

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
}

export function TelebirrLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#00A3E0" />
      <path d="M12 14C12 12.8954 12.8954 12 14 12H26C27.1046 12 28 12.8954 28 14V17C28 18.1046 27.1046 19 26 19H22V27C22 28.1046 21.1046 29 20 29H18C16.8954 29 16 28.1046 16 27V19H14C12.8954 19 12 18.1046 12 17V14Z" fill="white" />
      <circle cx="27" cy="25" r="3" fill="#FFCC00" />
    </svg>
  );
}

export function CbeLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#5A187A" />
      <path d="M20 9L20 31M14 14H26M13 14L10 21H16L13 14ZM27 14L24 21H30L27 14Z" stroke="#FFB81C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="11" r="2" fill="#FFB81C" />
    </svg>
  );
}

export function AwashLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#003B70" />
      <path d="M20 10L11 28H16L20 19L24 28H29L20 10Z" fill="#F58220" />
      <path d="M16 23H24L20 15L16 23Z" fill="white" />
    </svg>
  );
}

export function UpgradeModal() {
  const isUpgradeModalOpen = useAppStore((s) => s.isUpgradeModalOpen);
  const setIsUpgradeModalOpen = useAppStore((s) => s.setIsUpgradeModalOpen);
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const { haptic } = useTelegram();

  const isPro = userProfile?.subscription_status === 'premium';

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [successStatus, setSuccessStatus] = useState<'approved' | 'pending' | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUpgradeModalOpen) {
        setIsUpgradeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUpgradeModalOpen, setIsUpgradeModalOpen]);

  if (!isUpgradeModalOpen) return null;

  const handleClose = () => {
    sounds.playTap();
    setIsUpgradeModalOpen(false);
    setError('');
    setFile(null);
    setPreviewUrl(null);
    setSuccessStatus(null);
  };

  const handleCopy = (text: string, bank: string) => {
    sounds.playTap();
    haptic.impact('light');
    navigator.clipboard.writeText(text);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, or WebP).');
      haptic.notification('error');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      haptic.notification('error');
      return;
    }

    setError('');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    haptic.selection();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please attach your payment receipt screenshot.');
      haptic.notification('error');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const optimizedBlob = await compressReceiptImage(file);
      const uploadFile = new File([optimizedBlob], 'receipt.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('receipt', uploadFile);

      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment submission failed. Please try again.');
      }

      if (data.isAutoApproved) {
        sounds.playCelebration();
        haptic.notification('success');
        setUserProfile({ subscription_status: 'premium' });
        setSuccessStatus('approved');
      } else {
        sounds.playTap();
        haptic.notification('success');
        setSuccessStatus('pending');
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      haptic.notification('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-card text-foreground rounded-t-3xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/5 bg-ground/50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-base font-black shadow-2xs">
              👑
            </span>
            <div>
              <h2 className="text-base font-black tracking-tight leading-none text-foreground">
                Temari PRO Pass
              </h2>
              <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                Instant Automated Activation
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-ground hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Case 1: User is already PRO */}
          {isPro && !successStatus ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-400/20 text-amber-500 flex items-center justify-center text-3xl font-black border border-amber-400/30">
                👑
              </div>
              <h3 className="text-lg font-black text-foreground">You are a Temari PRO Member</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Enjoy unlimited AI Tutor guidance, 31,000+ past exam solutions, and offline chapter notes!
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-2xl bg-primary text-white font-black text-xs shadow-tactile-xs"
              >
                Continue Learning
              </button>
            </div>
          ) : successStatus === 'approved' ? (
            /* Case 2: Auto-Approved Instant Success */
            <div className="text-center py-6 space-y-4 animate-scale-up">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-3xl font-black border border-emerald-500/30">
                🎉
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">PRO Activated Automatically!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Your receipt was verified by AI in real-time. All premium past papers, topic notes, and AI explanations are now unlocked!
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-tactile-xs active:scale-95 transition-all"
              >
                Let&apos;s Go 🚀
              </button>
            </div>
          ) : successStatus === 'pending' ? (
            /* Case 3: Submitted for manual review fallback */
            <div className="text-center py-6 space-y-4 animate-scale-up">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-3xl font-black border border-amber-500/30">
                ⏳
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Receipt Received!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Your receipt was submitted and forwarded for instant review. We will notify you on Telegram as soon as it is approved (~5 mins).
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-black text-xs shadow-tactile-xs"
              >
                Got It
              </button>
            </div>
          ) : (
            /* Case 4: Upgrade Flow (1-Tap Instructions & Upload) */
            <>
              {/* Pricing Hero Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white shadow-tactile-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/80">Term Pass</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-black tracking-tight">250 ETB</span>
                      <span className="text-xs font-semibold text-white/80">/ semester</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-black backdrop-blur-xs">
                      100% Guaranteed
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-2 gap-2 text-[11px] font-semibold text-white/90">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Unlimited AI Tutor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>31,000+ Exam Questions</span>
                  </div>
                </div>
              </div>

              {/* Bank Accounts */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  1. Transfer 250 ETB to any account
                </p>

                {/* Telebirr Account */}
                <div className="p-3 rounded-2xl bg-ground border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TelebirrLogo className="w-8 h-8 shrink-0 rounded-xl shadow-2xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-black uppercase text-foreground">Telebirr</p>
                        <span className="text-[10px] text-muted-foreground truncate">(Abdu Seid)</span>
                      </div>
                      <p className="text-xs font-black font-mono tracking-tight text-foreground">0942202051</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('0942202051', 'telebirr')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-foreground transition-all active:scale-95 shrink-0"
                  >
                    {copiedBank === 'telebirr' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBank === 'telebirr' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* CBE Account */}
                <div className="p-3 rounded-2xl bg-ground border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CbeLogo className="w-8 h-8 shrink-0 rounded-xl shadow-2xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-black uppercase text-foreground">CBE Bank</p>
                        <span className="text-[10px] text-muted-foreground truncate">(Abdu Seid)</span>
                      </div>
                      <p className="text-xs font-black font-mono tracking-tight text-foreground">1000217910448</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('1000217910448', 'cbe')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-foreground transition-all active:scale-95 shrink-0"
                  >
                    {copiedBank === 'cbe' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBank === 'cbe' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Awash Bank Account */}
                <div className="p-3 rounded-2xl bg-ground border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AwashLogo className="w-8 h-8 shrink-0 rounded-xl shadow-2xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-black uppercase text-foreground">Awash Bank</p>
                        <span className="text-[10px] text-muted-foreground truncate">(Abdu Seid)</span>
                      </div>
                      <p className="text-xs font-black font-mono tracking-tight text-foreground">01320875412900</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('01320875412900', 'awash')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-foreground transition-all active:scale-95 shrink-0"
                  >
                    {copiedBank === 'awash' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBank === 'awash' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Upload Screenshot Form */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  2. Upload Transfer Screenshot
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-black/15 dark:border-white/15 hover:border-primary/50 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-ground/50 active:scale-[0.99]"
                  >
                    <Upload className="w-6 h-6 mx-auto text-primary mb-1.5" />
                    <p className="text-xs font-bold text-foreground">Tap to select receipt image</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, or WebP</p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-black/10 dark:border-white/10 p-2 flex items-center gap-3 bg-ground">
                    <img 
                      src={previewUrl} 
                      alt="Receipt preview" 
                      className="w-12 h-12 object-cover rounded-xl border border-black/10 dark:border-white/10" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-foreground">{file?.name}</p>
                      <p className="text-[10px] text-muted-foreground">Ready for AI verification</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/95 text-white font-black text-xs shadow-tactile-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying with AI Engine...</span>
                    </>
                  ) : (
                    <span>Instant AI Verification & Unlock 🚀</span>
                  )}
                </button>

                <p className="text-center text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Verified in seconds by Gemini Vision • Safe & Encrypted
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
