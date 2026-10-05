import localforage from 'localforage';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface ExamSubmission {
  id: string;
  subject: string;
  attempted: number;
  correct: number;
  timeSpentSeconds: number;
  timestamp: number;
}

const OFFLINE_STORE_KEY = 'temari_offline_submissions';

// Mutex flag preventing concurrent in-flight syncs (e.g. multiple tabs or rapid online events)
let isSyncing = false;

export const saveOfflineSubmission = async (submission: Omit<ExamSubmission, 'id' | 'timestamp'>) => {
  try {
    const existing = (await localforage.getItem<ExamSubmission[]>(OFFLINE_STORE_KEY)) || [];
    const newSubmission: ExamSubmission = {
      ...submission,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    await localforage.setItem(OFFLINE_STORE_KEY, [...existing, newSubmission]);
  } catch (error) {
    console.error('Failed to save offline submission', error);
  }
};

export const syncOfflineSubmissions = async () => {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  if (isSyncing) return;

  isSyncing = true;
  try {
    const pending = (await localforage.getItem<ExamSubmission[]>(OFFLINE_STORE_KEY)) || [];
    if (pending.length === 0) return;

    let syncedCount = 0;
    const remaining: ExamSubmission[] = [];

    for (const sub of pending) {
      try {
        const res = await fetch('/api/exam/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: sub.subject,
            attempted: sub.attempted,
            correct: sub.correct,
            timeSpentSeconds: sub.timeSpentSeconds,
          }),
        });

        if (res.ok) {
          syncedCount++;
        } else {
          // If server rejected with a 500 error, keep in retry queue; discard if 4xx bad request
          if (res.status >= 500) {
            remaining.push(sub);
          }
        }
      } catch (err) {
        // Network failure, keep in queue
        remaining.push(sub);
      }
    }

    await localforage.setItem(OFFLINE_STORE_KEY, remaining);
    
    if (syncedCount > 0) {
      toast.success(`Successfully synced ${syncedCount} offline exam(s)!`);
    }
  } catch (err) {
    console.error('Failed to process offline sync', err);
  } finally {
    isSyncing = false;
  }
};

export const useOfflineSyncObserver = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', syncOfflineSubmissions);
    return () => {
      window.removeEventListener('online', syncOfflineSubmissions);
    };
  }, []);
};
