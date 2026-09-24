'use client';

import { useEffect, useState, useRef } from 'react';
import { syncOfflineSubmissions } from '@/utils/offlineSync';
import { toast } from 'sonner';
import { X, Download } from 'lucide-react';

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
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      if (hasPrompted.current) return;
      hasPrompted.current = true;
      
      // Changed to 5 seconds per user request
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
  }, []);

  return null;
}
