'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type WebAppType from '@twa-dev/sdk';
import { safeLocalStorage } from '@/lib/safeStorage';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

/**
 * Safely retrieve the Telegram WebApp object.
 * In production, the official Telegram SDK is injected globally via
 * <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
 * or natively by the Telegram mobile client.
 */
function getTelegramWebApp(): typeof WebAppType | null {
  if (typeof window === 'undefined') return null;
  return (window as any).Telegram?.WebApp || null;
}

export function useTelegram() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const tg = getTelegramWebApp();
        const initData = tg?.initData;
        if (initData) {
          // 1. We are inside the Telegram Mini App
          setIsTelegram(true);
          try {
            tg?.ready?.();
            tg?.expand?.();
          } catch (e) {}

          if (tg?.initDataUnsafe?.user) {
            setUser(tg.initDataUnsafe.user as TelegramUser);
          }
          if (tg?.colorScheme) {
            setColorScheme(tg.colorScheme);
          }
          if (tg?.themeParams && typeof document !== 'undefined') {
            const p = tg.themeParams;
            const doc = document.documentElement;
            if (p.bg_color) doc.style.setProperty('--tg-theme-bg-color', p.bg_color);
            if (p.secondary_bg_color) doc.style.setProperty('--tg-theme-secondary-bg-color', p.secondary_bg_color);
            if (p.text_color) doc.style.setProperty('--tg-theme-text-color', p.text_color);
            if (p.hint_color) doc.style.setProperty('--tg-theme-hint-color', p.hint_color);
            if (p.link_color) doc.style.setProperty('--tg-theme-link-color', p.link_color);
            if (p.button_color) doc.style.setProperty('--tg-theme-button-color', p.button_color);
            if (p.button_text_color) doc.style.setProperty('--tg-theme-button-text-color', p.button_text_color);
          }
          setIsLoadingAuth(false);
        } else {
          // 2. We are on a Web Browser
          const webUser = safeLocalStorage.getItem('tg_web_user');
          if (webUser) {
            try {
              setUser(JSON.parse(webUser));
            } catch (e) {}
          }
          setIsLoadingAuth(false);
        }
      } catch (err) {
        console.warn('[useTelegram] Initialization error:', err);
        setIsLoadingAuth(false);
      }
    }
  }, []);

  // Haptic Feedback Engine - safely guarded against missing methods
  const haptic = useMemo(() => {
    return {
      selection: () => {
        try {
          getTelegramWebApp()?.HapticFeedback?.selectionChanged?.();
        } catch (e) {}
      },
      impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
        try {
          getTelegramWebApp()?.HapticFeedback?.impactOccurred?.(style);
        } catch (e) {}
      },
      notification: (type: 'error' | 'success' | 'warning') => {
        try {
          getTelegramWebApp()?.HapticFeedback?.notificationOccurred?.(type);
        } catch (e) {}
      },
    };
  }, []);

  // Native Back Button Control
  const backButtonHandlerRef = useRef<(() => void) | null>(null);

  const setBackButton = useCallback((visible: boolean, onClick?: () => void) => {
    try {
      const bb = getTelegramWebApp()?.BackButton;
      if (!bb) return;
      // Remove previous handler before adding a new one to prevent stacking
      if (backButtonHandlerRef.current) {
        bb.offClick?.(backButtonHandlerRef.current);
        backButtonHandlerRef.current = null;
      }
      if (visible) {
        bb.show?.();
        if (onClick) {
          backButtonHandlerRef.current = onClick;
          bb.onClick?.(onClick);
        }
      } else {
        bb.hide?.();
      }
    } catch (e) {}
  }, []);

  // API 8.0+ Native Immersion Controls
  const setFullscreen = useCallback((fullscreen: boolean) => {
    try {
      const tg = getTelegramWebApp();
      if (fullscreen) tg?.requestFullscreen?.();
      else tg?.exitFullscreen?.();
    } catch (e) {}
  }, []);

  const setVerticalSwipes = useCallback((enable: boolean) => {
    try {
      const tg = getTelegramWebApp();
      if (enable) tg?.enableVerticalSwipes?.();
      else tg?.disableVerticalSwipes?.();
    } catch (e) {}
  }, []);

  const setClosingConfirmation = useCallback((enable: boolean) => {
    try {
      const tg = getTelegramWebApp();
      if (enable) tg?.enableClosingConfirmation?.();
      else tg?.disableClosingConfirmation?.();
    } catch (e) {}
  }, []);

  const setHeaderColor = useCallback((color: string) => {
    try {
      const tg = getTelegramWebApp();
      tg?.setHeaderColor?.(color as any);
    } catch (e) {}
  }, []);

  return {
    isTelegram,
    user,
    colorScheme,
    haptic,
    setBackButton,
    setFullscreen,
    setVerticalSwipes,
    setClosingConfirmation,
    setHeaderColor,
    twa: getTelegramWebApp(),
  };
}
