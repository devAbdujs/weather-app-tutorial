'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/marketing/LandingPage';

export const ClientAuthDetector: React.FC = () => {
  const router = useRouter();
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

    if (tg && tg.initData) {
      // 1. Detected Telegram Mini App! 
      // Exchange local Telegram initData for a secure Server Cookie
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData })
      }).then(res => {
        if (res.ok) {
          // Tell Next.js to re-render the page now that it has the cookie
          router.refresh(); 
        } else {
          setIsWeb(true); // Fallback if auth fails
        }
      });
    } else {
      // 2. Detected Standard Web Browser
      setIsWeb(true);
    }
  }, [router]);

  if (!isWeb) {
    // Show a native-feeling spinner while the Mini App exchanges tokens (takes ~50ms)
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  // Render the marketing Landing Page for unauthenticated Web users
  return (
    <LandingPage onLogin={async (webData) => {
      const res = await fetch('/api/auth/session', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webData }) 
      });
      if (res.ok) {
        window.location.reload(); // Full reload to initialize Server Session
      }
    }} />
  );
};
