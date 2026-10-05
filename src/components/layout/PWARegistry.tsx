'use client';

import { useEffect, useState, useRef } from 'react';
import { syncOfflineSubmissions } from '@/utils/offlineSync';
import { X, Download, Share } from 'lucide-react';

const PWA_DISMISS_KEY = 'temari_pwa_dismissed_at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(PWA_DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (isNaN(dismissedAt)) return false;
    return Date.now() - dismissedAt < SEVEN_DAYS_MS;
  } catch {
    return false;
  }
}

function recordDismissal() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PWA_DISMISS_KEY, Date.now().toString());
  } catch {}
}

export function PWARegistry() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const hasPrompted = useRef(false);

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
    
    // 2. Install Banner Prompts (Skip inside Telegram WebApp, standalone mode, or if dismissed recently)
    const isTelegram = Boolean((window as any).Telegram?.WebApp?.initData);
    const isStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone) || 
                         window.matchMedia('(display-mode: standalone)').matches;
    
    if (isTelegram || isStandalone || isDismissedRecently()) {
      return () => {
        window.removeEventListener('online', syncOfflineSubmissions);
      };
    }

    // Check if device is iOS
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIosDevice(isIos);

    if (isIos) {
      // --- iOS FALLBACK LOGIC ---
      if (hasPrompted.current) {
        return () => {
          window.removeEventListener('online', syncOfflineSubmissions);
        };
      }
      hasPrompted.current = true;

      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 5000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('online', syncOfflineSubmissions);
      };
    } else {
      // --- STANDARD ANDROID/DESKTOP LOGIC ---
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        
        if (hasPrompted.current) return;
        hasPrompted.current = true;
        
        setTimeout(() => {
          setShowBanner(true);
        }, 5000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('online', syncOfflineSubmissions);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleDismiss = () => {
    recordDismissal();
    setShowBanner(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setShowBanner(false);
      }
    } catch {
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <aside 
      role="banner"
      aria-label="Install Temari PWA"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] w-[360px] animate-fade-up pointer-events-auto"
    >
      <div className="bg-card/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl p-3.5 rounded-card-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 pl-1">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm text-foreground leading-tight">Install Temari</span>
              <span className="text-caption text-muted-foreground font-semibold">Faster, Offline & Home Screen</span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="w-8 h-8 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground rounded-full transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIosDevice ? (
          <div className="bg-black/5 dark:bg-white/5 rounded-btn px-3 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
            Tap <Share className="w-3.5 h-3.5 text-foreground" /> then tap <span className="font-black text-foreground">Add to Home Screen</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="bg-primary hover:brightness-105 text-primary-foreground text-xs font-black px-4 py-2 rounded-btn active:scale-95 transition-all shadow-tactile-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
