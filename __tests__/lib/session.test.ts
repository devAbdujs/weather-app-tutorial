/**
 * @jest-environment node
 *
 * Session encryption tests.
 *
 * encryptSession / decryptSession are the foundation of auth in this app.
 * These tests ensure the AES-GCM round-trip works and that tampered tokens
 * are rejected.
 */
import { encryptSession, decryptSession } from '@/lib/session';

// The session module uses crypto.subtle which needs to be available in the
// test environment. Next.js's jest config provides it via the node environment.

const SAMPLE_SESSION = {
  telegram_id: '123456789',
  profile_id: 'profile-abc',
  first_name: 'Test',
  target_exam: 'entrance' as const,
  stream: 'Natural Science',
};

describe('encryptSession / decryptSession round-trip', () => {
  it('encrypts and decrypts a session correctly', async () => {
    const token = await encryptSession(SAMPLE_SESSION);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(token).toContain(':'); // iv:ciphertext format

    const decrypted = await decryptSession(token);
    expect(decrypted).not.toBeNull();
    expect(decrypted?.telegram_id).toBe(SAMPLE_SESSION.telegram_id);
    expect(decrypted?.profile_id).toBe(SAMPLE_SESSION.profile_id);
    expect(decrypted?.first_name).toBe(SAMPLE_SESSION.first_name);
    expect(decrypted?.target_exam).toBe(SAMPLE_SESSION.target_exam);
    expect(decrypted?.stream).toBe(SAMPLE_SESSION.stream);
  });

  it('produces a different ciphertext on each call (random IV)', async () => {
    const token1 = await encryptSession(SAMPLE_SESSION);
    const token2 = await encryptSession(SAMPLE_SESSION);
    // Same plaintext but different ciphertext due to random IV
    expect(token1).not.toBe(token2);
  });

  it('returns null for a completely invalid token', async () => {
    const result = await decryptSession('notavalidtoken');
    expect(result).toBeNull();
  });

  it('returns null for a token with only one part (missing colon separator)', async () => {
    const result = await decryptSession('aabbccddeeff');
    expect(result).toBeNull();
  });

  it('returns null for a tampered ciphertext', async () => {
    const token = await encryptSession(SAMPLE_SESSION);
    const [iv, ciphertext] = token.split(':');
    // Flip a character in the ciphertext to simulate tampering
    const tampered = `${iv}:${ciphertext.slice(0, -4)}ffff`;
    const result = await decryptSession(tampered);
    expect(result).toBeNull();
  });
});
