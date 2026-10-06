'use client';

import { useEffect, useState, useRef } from 'react';
import { syncOfflineSubmissions } from '@/utils/offlineSync';
import { X, Download, Share } from 'lucide-react';

export function PWARegistry() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Service Worker & Offline Sync (Run for ALL users including Telegram Mini App)
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => console.error('PWA Registration failed:', err));
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    syncOfflineSubmissions();
    window.addEventListener('online', syncOfflineSubmissions);
    
    // 2. Install Banner Prompts (Skip only inside Telegram WebApp or already installed standalone mode)
    const isTelegram = Boolean((window as any).Telegram?.WebApp?.initData);
    const isStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone) || 
                         window.matchMedia('(display-mode: standalone)').matches;
    
    if (isTelegram || isStandalone) {
      return () => {
        window.removeEventListener('online', syncOfflineSubmissions);
      };
    }

    // Check if device is iOS
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIosDevice(isIos);

    // Popup every time user visits the site
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 1500);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', syncOfflineSubmissions);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setShowBanner(false);
        }
      } catch {
        setShowBanner(false);
      }
    } else {
      // Fallback instruction for browsers without programmatic prompt
      setIsIosDevice(true);
    }
  };

  if (!showBanner) return null;

  return (
    <aside 
      role="banner"
      aria-label="Install Temari PWA"
      className="fixed bottom-20 left-0 right-0 z-50 max-w-md mx-auto px-4 animate-fade-up pointer-events-none"
    >
      <div className="pointer-events-auto bg-card/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-tactile-lg p-3 sm:p-3.5 rounded-2xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 bg-blue-500/10 dark:bg-blue-400/15 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-black text-sm text-foreground leading-tight truncate">Install Temari</span>
              <span className="text-[11px] text-muted-foreground font-semibold truncate">Faster, offline &amp; home screen</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isIosDevice && (
              <button
                onClick={handleInstall}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black px-3.5 py-1.5 rounded-xl active:scale-95 transition-all shadow-tactile-xs flex items-center gap-1 border border-blue-500/40"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="w-8 h-8 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground rounded-full transition-all active:scale-95 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isIosDevice && (
          <div className="bg-black/5 dark:bg-white/5 rounded-xl px-3 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground flex-wrap text-center">
            <span>Tap</span>
            <Share className="w-3.5 h-3.5 text-foreground inline-block shrink-0" />
            <span>then tap</span>
            <span className="font-black text-foreground">Add to Home Screen</span>
          </div>
        )}
      </div>
    </aside>
  );
}
