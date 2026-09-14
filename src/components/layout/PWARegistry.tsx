'use client';

import { useEffect } from 'react';

export function PWARegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the Service Worker in the background
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Ethio Scholar PWA Active. Scope:', registration.scope);
          })
          .catch((err) => {
            console.error('PWA Registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
