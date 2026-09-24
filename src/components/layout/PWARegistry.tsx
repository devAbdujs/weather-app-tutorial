'use client';

import { useEffect, useState, useRef } from 'react';
import { syncOfflineSubmissions } from '@/utils/offlineSync';
import { toast } from 'sonner';
import { X, Download, Share } from 'lucide-react';

export function PWARegistry() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const hasPrompted = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => console.log('Service Worker registered successfully'))
          .catch((err) => console.error('PWA Registration failed:', err));
      });
    }

    syncOfflineSubmissions();
    window.addEventListener('online', syncOfflineSubmissions);
    
    // Check if the app is already installed/running in standalone mode
    const isStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone) || 
                         window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone) return; // Never show the prompt if they already installed it

    // Check if device is iOS
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    if (isIos) {
      // --- iOS FALLBACK LOGIC ---
      // iOS doesn't fire beforeinstallprompt, so we just trigger the toast after 5s
      if (hasPrompted.current) return;
      hasPrompted.current = true;

      setTimeout(() => {
        toast.custom((t) => (
          <div className="bg-card dark:bg-card border border-black/5 dark:border-white/10 shadow-xl p-3 rounded-[16px] flex flex-col w-[320px] pointer-events-auto">
             <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-3 pl-1">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                     <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Install Temari</span>
                     <span className="text-[11px] text-gray-500 font-medium">Faster & Offline</span>
                  </div>
               </div>
               <button 
                 onClick={() => toast.dismiss(t)} 
                 className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-full transition-all active:scale-95"
               >
                 <X className="w-4 h-4"/>
               </button>
             </div>
             <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
               Tap <Share className="w-3.5 h-3.5 text-gray-900 dark:text-gray-100"/> then <span className="font-bold text-gray-900 dark:text-white">Add to Home Screen</span>
             </div>
          </div>
        ), { 
          id: 'pwa-install-prompt',
          duration: Infinity 
        });
      }, 5000);

    } else {
      // --- STANDARD ANDROID/DESKTOP LOGIC ---
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        
        if (hasPrompted.current) return;
        hasPrompted.current = true;
        
        setTimeout(() => {
          toast.custom((t) => (
            <div className="bg-card dark:bg-card border border-black/5 dark:border-white/10 shadow-xl p-2.5 rounded-[16px] flex items-center justify-between w-[320px] pointer-events-auto">
               <div className="flex items-center gap-3 pl-1">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                     <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Install Temari</span>
                     <span className="text-[11px] text-gray-500 font-medium">Faster & Offline</span>
                  </div>
               </div>
               <div className="flex items-center gap-1.5 pr-1">
                  <button 
                    onClick={() => { 
                      toast.dismiss(t);
                      (e as any).prompt();
                      (e as any).userChoice.then((choiceResult: any) => {
                        if (choiceResult.outcome === 'accepted') {
                          console.log('User accepted the A2HS prompt');
                        }
                      });
                    }} 
                    className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm shadow-primary/20"
                  >
                    Install
                  </button>
                  <button 
                    onClick={() => toast.dismiss(t)} 
                    className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-full transition-all active:scale-95"
                  >
                    <X className="w-4 h-4"/>
                  </button>
               </div>
            </div>
          ), { 
            id: 'pwa-install-prompt',
            duration: Infinity 
          });
        }, 5000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('online', syncOfflineSubmissions);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  return null;
}
