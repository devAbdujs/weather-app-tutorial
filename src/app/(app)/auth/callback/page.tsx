'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { safeSessionStorage } from '@/lib/safeStorage';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setError('No authorization code found in URL.');
      return;
    }

    const savedState = safeSessionStorage.getItem('tg_oidc_state');
    const codeVerifier = safeSessionStorage.getItem('tg_oidc_verifier');

    if (state !== savedState) {
      setError('State mismatch. Possible CSRF attack.');
      return;
    }
    
    if (!codeVerifier) {
      setError('Session expired. Please try logging in again.');
      return;
    }

    const targetExam = safeSessionStorage.getItem('temari_target_exam');

    // Exchange the code for a token on our backend
    fetch('/api/auth/oidc', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(targetExam ? { 'x-temari-target-exam': targetExam } : {})
      },
      body: JSON.stringify({ 
        code, 
        code_verifier: codeVerifier,
        targetExam: targetExam || undefined,
        redirect_uri: (process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top') + '/auth/callback'
      })
    })
    .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        // Cleanup storage and redirect to dashboard
        safeSessionStorage.removeItem('tg_oidc_state');
        safeSessionStorage.removeItem('tg_oidc_verifier');
        safeSessionStorage.removeItem('temari_target_exam');
        window.location.replace('/dashboard');
      } else {
        setError(data.error || 'Failed to authenticate');
      }
    })
    .catch(() => setError('Network error during authentication'));
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4 border border-error/20">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1.5 tracking-tight">Authentication Failed</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6 font-medium">{error}</p>
        <button 
          onClick={() => window.location.replace('/')}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-tactile-sm hover:bg-primary/95 active:scale-[0.99] transition-all duration-200 ease-bespoke"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center animate-fade-in p-6">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-tactile-md mb-6">
         <span className="text-primary-foreground font-black text-2xl tracking-tighter">Te</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Verifying Secure Login</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ground" />}>
      <CallbackContent />
    </Suspense>
  );
}
