import { safeCookieStorage, authStateStorage, safeSessionStorage, safeLocalStorage } from '@/lib/safeStorage';

describe('safeStorage & authStateStorage', () => {
  beforeEach(() => {
    // Clear cookies & storages
    authStateStorage.clearOidcData();
  });

  describe('safeCookieStorage', () => {
    it('sets and retrieves cookies properly', () => {
      safeCookieStorage.setItem('test_key', 'test_val');
      expect(safeCookieStorage.getItem('test_key')).toBe('test_val');
    });

    it('removes cookies properly', () => {
      safeCookieStorage.setItem('test_remove', 'to_delete');
      expect(safeCookieStorage.getItem('test_remove')).toBe('to_delete');
      safeCookieStorage.removeItem('test_remove');
      expect(safeCookieStorage.getItem('test_remove')).toBeNull();
    });
  });

  describe('authStateStorage', () => {
    it('persists and retrieves OIDC PKCE state and verifier', () => {
      const state = 'random_state_string_abc123';
      const verifier = 'random_verifier_string_xyz789';
      const targetExam = 'entrance';

      authStateStorage.setOidcState(state, verifier, targetExam);

      expect(authStateStorage.getOidcState()).toBe(state);
      expect(authStateStorage.getOidcVerifier()).toBe(verifier);
      expect(authStateStorage.getTargetExam()).toBe('entrance');
    });

    it('clears all OIDC data across storage layers', () => {
      authStateStorage.setOidcState('s1', 'v1', 'freshman');
      expect(authStateStorage.getOidcState()).toBe('s1');

      authStateStorage.clearOidcData();

      expect(authStateStorage.getOidcState()).toBeNull();
      expect(authStateStorage.getOidcVerifier()).toBeNull();
      expect(authStateStorage.getTargetExam()).toBeNull();
    });

    it('retains verifier and state even if sessionStorage is empty (cross-domain simulation)', () => {
      const state = 'simulated_state';
      const verifier = 'simulated_verifier';
      
      authStateStorage.setOidcState(state, verifier);

      // Simulate origin transition where sessionStorage is isolated/empty
      safeSessionStorage.removeItem('tg_oidc_state');
      safeSessionStorage.removeItem('tg_oidc_verifier');

      // State and verifier must still be accessible via cookie/localStorage
      expect(authStateStorage.getOidcState()).toBe(state);
      expect(authStateStorage.getOidcVerifier()).toBe(verifier);
    });
  });
});
