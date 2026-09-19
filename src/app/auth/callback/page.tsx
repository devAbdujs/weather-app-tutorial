'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

    const savedState = sessionStorage.getItem('tg_oidc_state');
    const codeVerifier = sessionStorage.getItem('tg_oidc_verifier');

    if (state !== savedState) {
      setError('State mismatch. Possible CSRF attack.');
      return;
    }
    
    if (!codeVerifier) {
      setError('Session expired. Please try logging in again.');
      return;
    }

    // Exchange the code for a token on our backend
    fetch('/api/auth/oidc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code, 
        code_verifier: codeVerifier,
        redirect_uri: window.location.origin + '/auth/callback'
      })
    })
    .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        // Cleanup storage and reload the main page
        sessionStorage.removeItem('tg_oidc_state');
        sessionStorage.removeItem('tg_oidc_verifier');
        window.location.replace('/');
      } else {
        setError(data.error || 'Failed to authenticate');
      }
    })
    .catch(() => setError('Network error during authentication'));
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">Authentication Failed</h2>
        <p className="text-sm text-secondary text-center mb-6">{error}</p>
        <button 
          onClick={() => window.location.replace('/')}
          className="px-6 py-3 bg-[#229ED9] text-white font-bold rounded-xl shadow-sm"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center animate-fade-in">
      <div className="w-16 h-16 rounded-[20px] bg-[#229ED9] flex items-center justify-center shadow-xl mb-6 shadow-[#229ED9]/20">
         <span className="text-white font-black text-3xl tracking-tighter">Te</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-[3px] border-black/5 border-t-[#229ED9] animate-spin" />
        <p className="text-[10px] font-black text-tertiary tracking-[0.2em] uppercase">Verifying Secure Login</p>
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
