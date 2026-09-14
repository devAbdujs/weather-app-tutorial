import localforage from 'localforage';
import { Question } from '@/types';

localforage.config({
  name: 'EthioScholar',
  storeName: 'exam_cache', 
  description: 'Caches exam questions for offline and instant load speeds'
});

const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface CacheItem {
  timestamp: number;
  data: Question[];
}

export const getCachedQuestions = async (cacheKey: string): Promise<Question[] | null> => {
  try {
    const cached = await localforage.getItem<CacheItem>(cacheKey);
    if (!cached) return null;
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
      await localforage.removeItem(cacheKey);
      return null;
    }
    
    return cached.data;
  } catch (err) {
    console.warn('Failed to read from cache:', err);
    return null;
  }
};

export const setCachedQuestions = async (cacheKey: string, data: Question[]) => {
  try {
    await localforage.setItem(cacheKey, {
      timestamp: Date.now(),
      data
    });
  } catch (err) {
    console.warn('Failed to write to cache:', err);
  }
};
