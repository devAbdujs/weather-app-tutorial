'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Read stored preference
    const stored = (localStorage.getItem('theme') as Theme) || 'system';
    setThemeState(stored);

    const applyTheme = (t: Theme) => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = t === 'dark' || (t === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', isDark);
      setResolvedTheme(isDark ? 'dark' : 'light');
      
      try {
        const WebApp = require('@twa-dev/sdk').default;
        WebApp.setHeaderColor?.(isDark ? '#1a1f2e' : '#f8fafc');
      } catch (e) {}
    };

    applyTheme(stored);

    // Listen for system changes when in 'system' mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if ((localStorage.getItem('theme') || 'system') === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = t === 'dark' || (t === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    setResolvedTheme(isDark ? 'dark' : 'light');
    
    // Sync with Telegram Native Header
    try {
      const WebApp = require('@twa-dev/sdk').default;
      WebApp.setHeaderColor?.(isDark ? '#1a1f2e' : '#f8fafc'); // Match bg-ground colors
    } catch (e) {}
  };

  const toggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return { theme, resolvedTheme, setTheme, toggle };
}
