'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type WebAppType from '@twa-dev/sdk';

let WebApp: typeof WebAppType;
if (typeof window !== 'undefined') {
  WebApp = require('@twa-dev/sdk').default;
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
      const tg = (window as any).Telegram?.WebApp || WebApp;
      const initData = tg?.initData || WebApp?.initData;
      if (initData) {
        // 1. We are inside the Telegram Mini App
        setIsTelegram(true);
        try { tg?.ready?.(); tg?.expand?.(); } catch (e) {}

        if (tg?.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user as TelegramUser);
        }
        if (tg?.colorScheme) setColorScheme(tg.colorScheme);
        setIsLoadingAuth(false);
      } else {
        // 2. We are on a Web Browser
        const webUser = localStorage.getItem('tg_web_user');
        if (webUser) {
          try {
            setUser(JSON.parse(webUser));
          } catch(e) {}
        }
        setIsLoadingAuth(false);
      }
    }
  }, []);

  // Haptic Feedback Engine - wrapped in useMemo to prevent recreation
  const haptic = useMemo(() => {
    const getHf = () => ((window as any).Telegram?.WebApp || WebApp)?.HapticFeedback;
    return {
      selection: () => {
        try { getHf()?.selectionChanged(); } catch (e) {}
      },
      impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
        try { getHf()?.impactOccurred(style); } catch (e) {}
      },
      notification: (type: 'error' | 'success' | 'warning') => {
        try { getHf()?.notificationOccurred(type); } catch (e) {}
      },
    };
  }, []);

  // Native Back Button Control
  const backButtonHandlerRef = useRef<(() => void) | null>(null);

  const setBackButton = useCallback((visible: boolean, onClick?: () => void) => {
    try {
      const bb = ((window as any).Telegram?.WebApp || WebApp)?.BackButton;
      if (!bb) return;
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
    } catch (e) {}
  }, []);

  // API 8.0+ Native Immersion Controls
  const setFullscreen = useCallback((fullscreen: boolean) => {
    try {
      const tg = ((window as any).Telegram?.WebApp || WebApp);
      if (fullscreen) tg?.requestFullscreen?.();
      else tg?.exitFullscreen?.();
    } catch (e) {}
  }, []);

  const setVerticalSwipes = useCallback((enable: boolean) => {
    try {
      const tg = ((window as any).Telegram?.WebApp || WebApp);
      if (enable) tg?.enableVerticalSwipes?.();
      else tg?.disableVerticalSwipes?.();
    } catch (e) {}
  }, []);

  const setClosingConfirmation = useCallback((enable: boolean) => {
    try {
      const tg = ((window as any).Telegram?.WebApp || WebApp);
      if (enable) tg?.enableClosingConfirmation?.();
      else tg?.disableClosingConfirmation?.();
    } catch (e) {}
  }, []);

  const setHeaderColor = useCallback((color: string) => {
    try {
      WebApp.setHeaderColor?.(color as any);
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
    twa: WebApp,
  };
}
