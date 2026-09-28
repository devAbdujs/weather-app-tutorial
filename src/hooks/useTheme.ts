'use client';

import { useEffect, useState } from 'react';
import { surfaceHex } from '@/styles/tokens';
import { safeLocalStorage } from '@/lib/safeStorage';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Read stored preference safely
    const stored = (safeLocalStorage.getItem('theme') as Theme) || 'system';
    setThemeState(stored);

    const applyTheme = (t: Theme) => {
      try {
        const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
        const isDark = t === 'dark' || (t === 'system' && Boolean(prefersDark));
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', isDark);
        }
        setResolvedTheme(isDark ? 'dark' : 'light');
        
        // Safely sync with Telegram native header without requiring twa-dev sdk
        const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
        tg?.setHeaderColor?.(isDark ? surfaceHex.groundDark : surfaceHex.groundLight);
      } catch (e) {}
    };

    applyTheme(stored);

    // Listen for system changes when in 'system' mode
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
          if ((safeLocalStorage.getItem('theme') || 'system') === 'system') {
            applyTheme('system');
          }
        };
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
      }
    } catch (e) {}
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    safeLocalStorage.setItem('theme', t);
    try {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      const isDark = t === 'dark' || (t === 'system' && Boolean(prefersDark));
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark);
      }
      setResolvedTheme(isDark ? 'dark' : 'light');
      
      // Sync with Telegram Native Header
      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
      tg?.setHeaderColor?.(isDark ? surfaceHex.groundDark : surfaceHex.groundLight);
    } catch (e) {}
  };

  const toggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return { theme, resolvedTheme, setTheme, toggle };
}
