/**
 * @jest-environment node
 *
 * Rate Limiter tests.
 *
 * The rate limiter is in-memory and guards all AI routes. These tests verify
 * the sliding-window behaviour without any network calls.
 */
import { checkRateLimit } from '@/lib/rateLimiter';

describe('Sliding-window rate limiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests up to the limit', () => {
    const id = `test-${Date.now()}-allow`;
    const result1 = checkRateLimit(id, 3, 60_000);
    const result2 = checkRateLimit(id, 3, 60_000);
    const result3 = checkRateLimit(id, 3, 60_000);

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('blocks the request that exceeds the limit', () => {
    const id = `test-${Date.now()}-block`;
    checkRateLimit(id, 2, 60_000);
    checkRateLimit(id, 2, 60_000);
    const blocked = checkRateLimit(id, 2, 60_000);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInMs).toBeGreaterThan(0);
  });

  it('allows again after the time window slides past', () => {
    const id = `test-${Date.now()}-slide`;
    checkRateLimit(id, 1, 60_000); // use up the 1 allowed slot

    const blocked = checkRateLimit(id, 1, 60_000);
    expect(blocked.allowed).toBe(false);

    // Advance time past the window
    jest.advanceTimersByTime(61_000);

    const allowed = checkRateLimit(id, 1, 60_000);
    expect(allowed.allowed).toBe(true);
  });

  it('tracks different identifiers independently', () => {
    const id1 = `test-${Date.now()}-user1`;
    const id2 = `test-${Date.now()}-user2`;

    checkRateLimit(id1, 1, 60_000);
    const blockedUser1 = checkRateLimit(id1, 1, 60_000);
    const allowedUser2 = checkRateLimit(id2, 1, 60_000);

    expect(blockedUser1.allowed).toBe(false);
    expect(allowedUser2.allowed).toBe(true);
  });

  it('returns correct resetInMs when blocked', () => {
    const id = `test-${Date.now()}-reset`;
    checkRateLimit(id, 1, 30_000);
    const blocked = checkRateLimit(id, 1, 30_000);

    expect(blocked.allowed).toBe(false);
    // resetInMs should be close to 30s (within 100ms tolerance for test execution time)
    expect(blocked.resetInMs).toBeLessThanOrEqual(30_000);
    expect(blocked.resetInMs).toBeGreaterThan(29_000);
  });
});
