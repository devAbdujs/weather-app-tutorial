'use client';

import { useEffect } from 'react';
import { syncOfflineSubmissions } from '@/utils/offlineSync';

export function PWARegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Register the Service Worker
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then(() => {
              // Service Worker registered successfully
            })
            .catch((err) => {
              console.error('PWA Registration failed:', err);
            });
        });
      }

      // 2. Initial offline sync check on load
      syncOfflineSubmissions();

      // 3. Listen for network returning online
      window.addEventListener('online', syncOfflineSubmissions);
      
      return () => {
        window.removeEventListener('online', syncOfflineSubmissions);
      };
    }
  }, []);

  return null;
}
