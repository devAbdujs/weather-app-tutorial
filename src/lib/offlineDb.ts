import Dexie, { Table } from 'dexie';
import { Question } from '@/types';

export interface SavedQuestion {
  id: string;
  savedAt: string;
  notes?: string;
  question: Question;
}

export interface UserExamHistory {
  id?: number;
  examType: string;
  subject: string;
  year?: number | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface OfflineQuestionCache {
  key: string; // e.g. "entrance_Physics_2016"
  cachedAt: string;
  questions: Question[];
}

export interface UserStreak {
  id: string;
  count: number;
  lastDate: string; // YYYY-MM-DD
}

export class EthioExamOfflineDB extends Dexie {
  savedQuestions!: Table<SavedQuestion, string>;
  examHistory!: Table<UserExamHistory, number>;
  questionCache!: Table<OfflineQuestionCache, string>;
  userStreak!: Table<UserStreak, string>;

  constructor() {
    super('EthioExamOfflineDB');
    this.version(1).stores({
      savedQuestions: 'id, savedAt',
      examHistory: '++id, examType, subject, completedAt',
      questionCache: 'key, cachedAt',
      userStreak: 'id'
    });
  }
}

export const offlineDb = typeof window !== 'undefined' ? new EthioExamOfflineDB() : null;

// Helper to record a study day and update streak
export async function updateDailyStreak(): Promise<number> {
  if (!offlineDb) return 1;
  const today = new Date().toISOString().split('T')[0];
  try {
    const streakRecord = await offlineDb.userStreak.get('current_streak');
    if (!streakRecord) {
      await offlineDb.userStreak.put({ id: 'current_streak', count: 1, lastDate: today });
      return 1;
    }

    const lastDate = streakRecord.lastDate;
    if (lastDate === today) {
      return streakRecord.count;
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastDate === yesterday) {
      const newCount = streakRecord.count + 1;
      await offlineDb.userStreak.put({ id: 'current_streak', count: newCount, lastDate: today });
      return newCount;
    } else {
      // Streak broken
      await offlineDb.userStreak.put({ id: 'current_streak', count: 1, lastDate: today });
      return 1;
    }
  } catch {
    return 1;
  }
}
