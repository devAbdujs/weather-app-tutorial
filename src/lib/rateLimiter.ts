/**
 * Sliding Window Rate Limiter
 *
 * In-memory, per-identifier (IP or Telegram user ID).
 * Allows `maxRequests` per `windowMs` milliseconds.
 *
 * NOTE: For a multi-instance / serverless deployment (Vercel), each cold-start
 * gets its own in-memory store. This is acceptable for beta — it is still
 * effective because each serverless instance handles many requests, and
 * combined with Gemini's own per-key quotas, abuse is naturally bounded.
 * When scaling, swap the Map for Upstash Redis using the same interface.
 */

interface RateLimitEntry {
  timestamps: number[]; // timestamps of each request in the current window
}

const store = new Map<string, RateLimitEntry>();

// Purge identifiers that haven't been seen in 10 minutes to prevent memory leak
setInterval(() => {
  const cutoff = Date.now() - 600_000;
  store.forEach((entry, key) => {
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
      store.delete(key);
    }
  });
}, 300_000); // cleanup every 5 minutes

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;  // requests remaining in window
  resetInMs: number;  // ms until oldest request falls out of window
}

/**
 * Check and record a request for the given identifier.
 *
 * @param identifier - IP address or Telegram user ID
 * @param maxRequests - max allowed in window (default: 15)
 * @param windowMs    - window duration in ms (default: 60 000 = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 15,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!store.has(identifier)) {
    store.set(identifier, { timestamps: [] });
  }

  const entry = store.get(identifier)!;

  // Drop timestamps outside the current window (sliding window)
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

  const remaining = Math.max(0, maxRequests - entry.timestamps.length);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0];
    const resetInMs = oldest + windowMs - now;
    return { allowed: false, remaining: 0, resetInMs };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: remaining - 1,
    resetInMs: windowMs,
  };
}
