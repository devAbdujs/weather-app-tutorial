'use client';

import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        colorScheme?: 'light' | 'dark';
        initDataUnsafe?: {
          user?: TelegramUser;
        };
        HapticFeedback?: {
          selectionChanged: () => void;
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
        };
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function useTelegram() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setIsTelegram(true);

      // Expand to 100% viewport height
      try {
        tg.ready();
        tg.expand();
      } catch (e) {
        console.error('Failed to expand Telegram WebApp', e);
      }

      // Extract user
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Extract color scheme
      if (tg.colorScheme) {
        setColorScheme(tg.colorScheme);
      }
    }
  }, []);

  // Haptic Feedback Engine
  const haptic = {
    selection: useCallback(() => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    }, []),
    impact: useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      }
    }, []),
    notification: useCallback((type: 'error' | 'success' | 'warning') => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      }
    }, [])
  };

  // Native Back Button Control
  const setBackButton = useCallback((visible: boolean, onClick?: () => void) => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
      const bb = window.Telegram.WebApp.BackButton;
      if (visible) {
        bb.show();
        if (onClick) {
          bb.onClick(onClick);
        }
      } else {
        bb.hide();
      }
    }
  }, []);

  return {
    isTelegram,
    user,
    colorScheme,
    haptic,
    setBackButton
  };
}
