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
