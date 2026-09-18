'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        colorScheme?: 'light' | 'dark';
        initData?: string;
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
          offClick: (callback: () => void) => void;
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
  photo_url?: string;
}

export function useTelegram() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.Telegram?.WebApp && window.Telegram.WebApp.initData) {
        // 1. We are inside the Telegram Mini App
        const tg = window.Telegram.WebApp;
        setIsTelegram(true);
        try { tg.ready(); tg.expand(); } catch (e) {}

        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user);
        }
        if (tg.colorScheme) setColorScheme(tg.colorScheme);
        setIsLoadingAuth(false);
      } else {
        // 2. We are on a Web Browser
        const webUser = localStorage.getItem('tg_web_user');
        if (webUser) {
          try {
            setUser(JSON.parse(webUser));
          } catch(e) {}
        } else if (process.env.NODE_ENV === 'development') {
           // Optional: Uncomment for local dev without internet
           // setUser({ id: 123456789, first_name: 'Dev' });
        }
        setIsLoadingAuth(false);
      }
    }
  }, []);

  // Haptic Feedback Engine - wrapped in useMemo to prevent timer recreation
  const haptic = useMemo(() => ({
    selection: () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    },
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      }
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      }
    },
  }), []);

  // Native Back Button Control
  const backButtonHandlerRef = useRef<(() => void) | null>(null);

  const setBackButton = useCallback((visible: boolean, onClick?: () => void) => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
      const bb = window.Telegram.WebApp.BackButton;
      // Remove previous handler before adding a new one to prevent stacking
      if (backButtonHandlerRef.current) {
        bb.offClick(backButtonHandlerRef.current);
        backButtonHandlerRef.current = null;
      }
      if (visible) {
        bb.show();
        if (onClick) {
          backButtonHandlerRef.current = onClick;
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
