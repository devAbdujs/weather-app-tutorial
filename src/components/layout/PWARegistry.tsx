'use client';

import { useEffect, useState } from 'react';
import { syncOfflineSubmissions } from '@/utils/offlineSync';
import { toast } from 'sonner';

export function PWARegistry() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Register the Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => console.log('Service Worker registered successfully'))
          .catch((err) => console.error('PWA Registration failed:', err));
      });
    }

    // 2. Initial offline sync check on load
    syncOfflineSubmissions();

    // 3. Listen for network returning online
    window.addEventListener('online', syncOfflineSubmissions);
    
    // 4. Intercept the native PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Delay prompt by 8 seconds so it doesn't interrupt the dashboard immediately
      setTimeout(() => {
        toast('Install Temari App', {
          description: 'Get faster access and offline notes on your home screen!',
          action: {
            label: 'Install',
            onClick: () => {
              (e as any).prompt();
              (e as any).userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the A2HS prompt');
                }
              });
            }
          },
          duration: 10000,
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
