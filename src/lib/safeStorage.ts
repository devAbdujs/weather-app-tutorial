/**
 * Safe Storage Utility for Temari App
 * Provides exception-safe access to localStorage and sessionStorage.
 * In Telegram Mini Apps (especially iOS WebViews or Telegram Web iframes),
 * direct access to localStorage / sessionStorage can throw SecurityError or DOMException.
 * This utility safely catches all access errors and falls back to an in-memory Map.
 */

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    try {
      this.store.set(key, String(value));
    } catch {}
  }

  removeItem(key: string): void {
    try {
      this.store.delete(key);
    } catch {}
  }

  clear(): void {
    try {
      this.store.clear();
    } catch {}
  }
}

const memoryLocalStorage = new MemoryStorage();
const memorySessionStorage = new MemoryStorage();

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryLocalStorage.getItem(key);
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryLocalStorage.setItem(key, value);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryLocalStorage.removeItem(key);
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return memorySessionStorage.getItem(key);
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      memorySessionStorage.setItem(key, value);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      memorySessionStorage.removeItem(key);
    }
  },
};

export const safeCookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    try {
      const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + encodeURIComponent(key) + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string, maxAgeSeconds = 1800): void => {
    if (typeof document === 'undefined') return;
    try {
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const parts = hostname.split('.');
      const encodedKey = encodeURIComponent(key);
      const encodedVal = encodeURIComponent(value);

      // 1. Host-only cookie
      document.cookie = `${encodedKey}=${encodedVal}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${isSecure ? '; Secure' : ''}`;

      // 2. Shared root domain cookie (e.g. .temari.top) across all subdomains
      if (parts.length >= 2 && !hostname.includes('localhost') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        const rootDomain = `.${parts.slice(-2).join('.')}`;
        document.cookie = `${encodedKey}=${encodedVal}; Domain=${rootDomain}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      }
    } catch {}
  },

  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    try {
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const parts = hostname.split('.');
      const encodedKey = encodeURIComponent(key);

      document.cookie = `${encodedKey}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isSecure ? '; Secure' : ''}`;

      if (parts.length >= 2 && !hostname.includes('localhost') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        const rootDomain = `.${parts.slice(-2).join('.')}`;
        document.cookie = `${encodedKey}=; Domain=${rootDomain}; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isSecure ? '; Secure' : ''}`;
      }
    } catch {}
  },
};

export const authStateStorage = {
  setOidcState: (state: string, verifier: string, targetExam?: string | null): void => {
    // Write across all 3 storage mechanisms for multi-subdomain + iframe resilience
    safeCookieStorage.setItem('tg_oidc_state', state);
    safeCookieStorage.setItem('tg_oidc_verifier', verifier);
    safeLocalStorage.setItem('tg_oidc_state', state);
    safeLocalStorage.setItem('tg_oidc_verifier', verifier);
    safeSessionStorage.setItem('tg_oidc_state', state);
    safeSessionStorage.setItem('tg_oidc_verifier', verifier);

    if (targetExam) {
      safeCookieStorage.setItem('temari_target_exam', targetExam);
      safeLocalStorage.setItem('temari_target_exam', targetExam);
      safeSessionStorage.setItem('temari_target_exam', targetExam);
    } else {
      safeCookieStorage.removeItem('temari_target_exam');
      safeLocalStorage.removeItem('temari_target_exam');
      safeSessionStorage.removeItem('temari_target_exam');
    }
  },

  getOidcState: (): string | null => {
    return (
      safeCookieStorage.getItem('tg_oidc_state') ||
      safeLocalStorage.getItem('tg_oidc_state') ||
      safeSessionStorage.getItem('tg_oidc_state')
    );
  },

  getOidcVerifier: (): string | null => {
    return (
      safeCookieStorage.getItem('tg_oidc_verifier') ||
      safeLocalStorage.getItem('tg_oidc_verifier') ||
      safeSessionStorage.getItem('tg_oidc_verifier')
    );
  },

  getTargetExam: (): string | null => {
    return (
      safeCookieStorage.getItem('temari_target_exam') ||
      safeLocalStorage.getItem('temari_target_exam') ||
      safeSessionStorage.getItem('temari_target_exam')
    );
  },

  clearOidcData: (): void => {
    safeCookieStorage.removeItem('tg_oidc_state');
    safeCookieStorage.removeItem('tg_oidc_verifier');
    safeCookieStorage.removeItem('temari_target_exam');
    safeLocalStorage.removeItem('tg_oidc_state');
    safeLocalStorage.removeItem('tg_oidc_verifier');
    safeLocalStorage.removeItem('temari_target_exam');
    safeSessionStorage.removeItem('tg_oidc_state');
    safeSessionStorage.removeItem('tg_oidc_verifier');
    safeSessionStorage.removeItem('temari_target_exam');
  },
};
