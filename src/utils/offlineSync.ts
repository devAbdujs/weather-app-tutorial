import localforage from 'localforage';
import { toast } from 'sonner';

interface ExamSubmission {
  id: string;
  subject: string;
  attempted: number;
  correct: number;
  timeSpentSeconds: number;
  timestamp: number;
}

const OFFLINE_STORE_KEY = 'temari_offline_submissions';

export const saveOfflineSubmission = async (submission: Omit<ExamSubmission, 'id' | 'timestamp'>) => {
  try {
    const existing = (await localforage.getItem<ExamSubmission[]>(OFFLINE_STORE_KEY)) || [];
    const newSubmission: ExamSubmission = {
      ...submission,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    await localforage.setItem(OFFLINE_STORE_KEY, [...existing, newSubmission]);
    console.log('Submission saved offline successfully');
  } catch (error) {
    console.error('Failed to save offline submission', error);
  }
};

export const syncOfflineSubmissions = async () => {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  try {
    const pending = (await localforage.getItem<ExamSubmission[]>(OFFLINE_STORE_KEY)) || [];
    if (pending.length === 0) return;

    let syncedCount = 0;
    const remaining = [];

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
          // If the server explicitly rejected it (e.g. 400 Bad Request), we might want to discard it anyway
          // But for now, let's keep it if it's a 500 error
          if (res.status >= 500) {
            remaining.push(sub);
          }
        }
      } catch (err) {
        // Network error still, keep in queue
        remaining.push(sub);
      }
    }

    await localforage.setItem(OFFLINE_STORE_KEY, remaining);
    
    if (syncedCount > 0) {
      toast.success(`Successfully synced ${syncedCount} offline exam(s)!`);
    }
  } catch (err) {
    console.error('Failed to process offline sync', err);
  }
};

export const useOfflineSyncObserver = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', syncOfflineSubmissions);
  }
};
