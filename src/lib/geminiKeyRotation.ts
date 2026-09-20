/**
 * Gemini API Key Rotation with 429 Cooldown
 *
 * - Dynamically loads any env variable starting with 'gemini_api_key'
 * - Round-robin across all keys
 * - If a key returns 429 (rate limited), it's cooled down for 60s and skipped
 */

const GEMINI_KEYS: string[] = Object.keys(process.env)
  .filter(key => key.toLowerCase().startsWith('gemini_api_key'))
  .map(key => process.env[key])
  .filter((k): k is string => typeof k === 'string' && k.trim().length > 0);

if (GEMINI_KEYS.length === 0) {
  console.warn('[GeminiKeys] ⚠️  No Gemini API keys found. AI Tutor unavailable.');
}

// Track cooldown expiry timestamps per key index (in-memory)
const keyCooldowns = new Map<number, number>();

// Round-robin index, randomised at startup so multiple instances spread load
let currentKeyIndex = Math.floor(Math.random() * Math.max(GEMINI_KEYS.length, 1));

const COOLDOWN_MS = 60_000; // 60 seconds cooldown after a 429

/**
 * Mark a key as rate-limited so it is skipped for the next 60 seconds.
 */
export function markKeyRateLimited(key: string): void {
  const idx = GEMINI_KEYS.indexOf(key);
  if (idx !== -1) {
    keyCooldowns.set(idx, Date.now() + COOLDOWN_MS);
    console.warn(`[GeminiKeys] Key #${idx + 1} rate-limited — cooling down for 60s`);
  }
}

/**
 * Returns the next available (non-cooled-down) key, or null if all are exhausted.
 * Tries every key once before giving up.
 */
export function getNextGeminiKey(): string | null {
  if (GEMINI_KEYS.length === 0) return null;

  const now = Date.now();
  const totalKeys = GEMINI_KEYS.length;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const idx = currentKeyIndex % totalKeys;
    currentKeyIndex = (currentKeyIndex + 1) % totalKeys;

    const cooldownExpiry = keyCooldowns.get(idx) ?? 0;
    if (now < cooldownExpiry) continue; // skip cooled-down key

    // Clean up expired cooldown entry
    if (cooldownExpiry > 0) keyCooldowns.delete(idx);

    return GEMINI_KEYS[idx];
  }

  console.error('[GeminiKeys] ❌ All API keys are currently rate-limited.');
  return null;
}

export function getKeyCount(): number {
  return GEMINI_KEYS.length;
}
