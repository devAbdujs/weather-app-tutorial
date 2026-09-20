'use client';

import { useEffect } from 'react';

export function PWARegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the Service Worker in the background
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
  }, []);

  return null;
}
