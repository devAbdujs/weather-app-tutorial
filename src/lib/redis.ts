import { Redis } from '@upstash/redis';

/**
 * Serverless Redis Client (Upstash)
 *
 * Connects over HTTP REST, making it 100% compatible with Vercel Edge & Serverless
 * without persistent TCP connection pool headaches.
 *
 * Gracefully falls back to null if environment variables are not configured,
 * ensuring local development and CI tests function without a remote Redis database.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = (url && token)
  ? new Redis({ url, token })
  : null;

/**
 * Returns true if distributed Redis is active and connected.
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

// ─── AI Response Cache Helpers ────────────────────────────────────────────────

/**
 * Fast lookup for AI responses in Redis (sub-10ms) before falling back to Supabase.
 */
export async function getCachedAIResponse(questionId: string, promptType: string): Promise<string | null> {
  if (!redis) return null;
  try {
    const key = `ai_cache:${questionId}:${promptType}`;
    const cached = await redis.get<string>(key);
    return cached || null;
  } catch (err) {
    console.warn('[Redis] Failed to read AI cache:', err);
    return null;
  }
}

/**
 * Stores AI response in Redis with a 30-day TTL.
 */
export async function setCachedAIResponse(questionId: string, promptType: string, response: string): Promise<void> {
  if (!redis) return;
  try {
    const key = `ai_cache:${questionId}:${promptType}`;
    // Cache for 30 days (2,592,000 seconds)
    await redis.set(key, response, { ex: 60 * 60 * 24 * 30 });
  } catch (err) {
    console.warn('[Redis] Failed to write AI cache:', err);
  }
}

// ─── Gamification & Leaderboard Helpers ────────────────────────────────────────

const LEADERBOARD_KEY = 'leaderboard:national:xp';

/**
 * Updates a student's XP score in the national Redis Sorted Set (ZSET).
 * Instant O(log(N)) update across all students.
 */
export async function updateStudentXPInLeaderboard(telegramId: string, totalXp: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.zadd(LEADERBOARD_KEY, { score: totalXp, member: telegramId });
  } catch (err) {
    console.warn('[Redis] Failed to update student leaderboard XP:', err);
  }
}

/**
 * Retrieves top ranking students from Redis Sorted Set.
 * Instant sub-millisecond retrieval.
 */
export async function getTopStudentsFromLeaderboard(limit = 50): Promise<{ telegramId: string; score: number }[]> {
  if (!redis) return [];
  try {
    const results = await redis.zrange<string[]>(LEADERBOARD_KEY, 0, limit - 1, {
      rev: true,
      withScores: true,
    });

    const leaderboard: { telegramId: string; score: number }[] = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        telegramId: results[i],
        score: Number(results[i + 1]),
      });
    }
    return leaderboard;
  } catch (err) {
    console.warn('[Redis] Failed to fetch top leaderboard:', err);
    return [];
  }
}
