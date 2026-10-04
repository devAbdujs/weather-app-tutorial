import { redis } from './redis';

/**
 * Distributed Sliding Window Rate Limiter
 *
 * Uses Upstash Redis for distributed atomic rate limiting across all Vercel
 * serverless and edge instances worldwide.
 *
 * If Redis is not configured (e.g. local dev without credentials or during CI),
 * seamlessly falls back to the in-memory sliding window store.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitEntry>();

// Purge identifiers that haven't been seen in 10 minutes to prevent memory leak
const cleanupInterval = setInterval(() => {
  const cutoff = Date.now() - 600_000;
  memoryStore.forEach((entry, key) => {
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
      memoryStore.delete(key);
    }
  });
}, 300_000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * In-memory sliding window rate limiter (fallback or standalone)
 */
export function checkRateLimitMemory(
  identifier: string,
  maxRequests = 15,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!memoryStore.has(identifier)) {
    memoryStore.set(identifier, { timestamps: [] });
  }

  const entry = memoryStore.get(identifier)!;
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

  const remaining = Math.max(0, maxRequests - entry.timestamps.length);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0];
    const resetInMs = oldest + windowMs - now;
    return { allowed: false, remaining: 0, resetInMs };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: remaining - 1,
    resetInMs: windowMs,
  };
}

/**
 * Distributed atomic rate limiter.
 *
 * Primary: Upstash Redis (shared globally across all serverless instances).
 * Fallback: Local memory store if Redis is unavailable.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 15,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  if (redis) {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      const key = `ratelimit:${identifier}`;

      // Redis sliding window using sorted sets
      const p = redis.pipeline();
      p.zremrangebyscore(key, 0, windowStart);
      p.zcard(key);
      p.zadd(key, { score: now, member: `${now}:${Math.random().toString(36).substring(2, 8)}` });
      p.pexpire(key, windowMs);

      const results = await p.exec<[number, number, number, number]>();
      const currentCount = (results[1] as number) || 0;

      if (currentCount >= maxRequests) {
        return { allowed: false, remaining: 0, resetInMs: windowMs };
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - currentCount - 1),
        resetInMs: windowMs,
      };
    } catch (err) {
      console.warn('[RateLimiter] Upstash Redis call failed, falling back to memory store:', err);
    }
  }

  return checkRateLimitMemory(identifier, maxRequests, windowMs);
}
