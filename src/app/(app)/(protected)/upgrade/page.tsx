'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { ShieldCheck, Upload, CreditCard, CheckCircle2 } from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';

export default function UpgradePage() {
  const router = useRouter();
  const { setBackButton, haptic } = useTelegram();
  const [file, setFile] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBackButton(true, () => router.back());
    return () => setBackButton(false);
  }, [setBackButton, router]);

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

      haptic.notification('success');
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
      haptic.notification('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-ground pb-24 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">Payment Submitted!</h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-8 max-w-sm">
          Your receipt has been sent to our admins for verification. We will upgrade your account shortly!
        </p>
        <button 
          onClick={() => router.push('/profile')}
          className="w-full max-w-xs h-14 rounded-2xl bg-primary text-white font-black shadow-lg active:scale-[0.98] transition-transform"
        >
          Return to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground pb-24">
      <TopHeader />
      
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          Unlock Premium 🚀
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-8">
          Get unlimited AI tutor access, full exam analytics, and offline mastery.
        </p>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-[24px] shadow-xl shadow-primary/20 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <h2 className="text-lg font-bold text-white/90 mb-1">Premium Access</h2>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black">199 ETB</span>
            <span className="text-white/80 font-medium">/ term</span>
          </div>
          <ul className="space-y-2 text-sm font-medium text-white/90">
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Infinite AI Tutor Chats</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> 31,000+ Past Questions</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Advanced Progress Tracking</li>
          </ul>
        </div>

        {/* Payment Instructions */}
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> How to Pay
        </h3>
        
        <div className="space-y-3 mb-8">
          <div className="bg-card border border-black/5 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Commercial Bank of Ethiopia (CBE)</p>
              <p className="font-black text-lg text-gray-900 dark:text-gray-100 font-mono tracking-tight">1000217910448</p>
            </div>
            <button type="button" onClick={() => { navigator.clipboard.writeText('1000217910448'); haptic.selection(); }} className="text-primary font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Copy</button>
          </div>

          <div className="bg-card border border-black/5 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Telebirr</p>
              <p className="font-black text-lg text-gray-900 dark:text-gray-100 font-mono tracking-tight">0942202051</p>
            </div>
            <button type="button" onClick={() => { navigator.clipboard.writeText('0942202051'); haptic.selection(); }} className="text-primary font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Copy</button>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-card border-2 border-primary/10 p-5 rounded-[24px] shadow-sm">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Submit Receipt
          </h3>

          {error && (
            <div className="p-3 mb-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Transaction ID (Optional)
            </label>
            <input 
              type="text" 
              placeholder="e.g. FT23101..."
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full bg-ground border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Screenshot of Receipt *
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
                  <span className="font-bold text-primary truncate block">{file.name}</span>
                ) : (
                  <span className="font-medium text-gray-500 dark:text-gray-400">Tap to select image</span>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !file}
            className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Submit for Approval'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
