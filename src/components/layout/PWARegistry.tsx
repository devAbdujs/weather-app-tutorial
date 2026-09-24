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
      
      // Prevent multiple timeouts if the event fires multiple times on navigation
      if (hasPrompted.current) return;
      hasPrompted.current = true;
      
      setTimeout(() => {
        toast.custom((t) => (
          <div className="bg-card dark:bg-card border border-black/5 dark:border-white/10 shadow-2xl p-4 rounded-[20px] flex flex-col gap-3 w-full max-w-[356px] pointer-events-auto">
             <div className="flex justify-between items-start">
                <div>
                   <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Install Temari App</h3>
                   <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-1 leading-relaxed">
                     Get faster access, full screen mode, and offline notes directly on your home screen.
                   </p>
                </div>
                <button 
                  onClick={() => toast.dismiss(t)} 
                  className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all active:scale-95"
                >
                  <X className="w-4 h-4"/>
                </button>
             </div>
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
                className="bg-primary text-white font-bold h-11 rounded-xl w-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm shadow-primary/20 hover:bg-primary/90 mt-1"
             >
                <Download className="w-4 h-4" />
                Install Now
             </button>
          </div>
        ), { 
          id: 'pwa-install-prompt', // Forces sonner to reuse this toast instead of stacking
          duration: Infinity 
        });
      }, 8000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', syncOfflineSubmissions);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
