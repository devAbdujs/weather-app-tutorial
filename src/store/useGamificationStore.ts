import { create } from 'zustand';
import { sounds } from '@/lib/sounds';
import { safeLocalStorage } from '@/lib/safeStorage';

export interface LevelInfo {
  level: number;
  title: string;
  titleAmharic: string;
  minXp: number;
  maxXp: number;
  badge: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Novice Scholar',  titleAmharic: 'ጀማሪ ተማሪ',        minXp: 0,    maxXp: 100,   badge: '🌱' },
  { level: 2, title: 'Keen Student',    titleAmharic: 'ትጉ ተማሪ',         minXp: 100,  maxXp: 300,   badge: '📚' },
  { level: 3, title: 'Exam Battler',    titleAmharic: 'የፈተና ጀግና',       minXp: 300,  maxXp: 700,   badge: '⚔️' },
  { level: 4, title: 'Master Gobeze',   titleAmharic: 'ጎበዝ ተማሪ',        minXp: 700,  maxXp: 1500,  badge: '🦁' },
  { level: 5, title: 'National Champ',  titleAmharic: 'የአንደኛ ደረጃ ሻምፒዮን', minXp: 1500, maxXp: 3000,  badge: '👑' },
];

export function getLevelForXp(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export interface CelebrationPayload {
  type: 'quiz_completed' | 'level_up' | 'streak_milestone' | 'deck_completed';
  title: string;
  subtitle: string;
  xpEarned: number;
  accuracy?: number;
  streakCount?: number;
  mascotMood?: 'celebrating' | 'streak_fire' | 'happy' | 'proud';
}

interface GamificationState {
  xp: number;
  dailyXp: number;
  dailyXpGoal: number;
  soundEnabled: boolean;
  activeCelebration: CelebrationPayload | null;

  addXp: (amount: number, reason?: string) => void;
  triggerCelebration: (payload: CelebrationPayload) => void;
  dismissCelebration: () => void;
  toggleSound: () => void;
}

const STORAGE_KEY = 'temari_gamification_v1';

function loadPersistedState() {
  if (typeof window === 'undefined') return { xp: 45, dailyXp: 15, dailyXpGoal: 50 };
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Reset daily XP if day changed
      const today = new Date().toDateString();
      if (data.lastActiveDay !== today) {
        data.dailyXp = 0;
        data.lastActiveDay = today;
      }
      return data;
    }
  } catch {}
  return { xp: 45, dailyXp: 15, dailyXpGoal: 50 };
}

function persistState(xp: number, dailyXp: number, dailyXpGoal: number) {
  if (typeof window === 'undefined') return;
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify({
      xp,
      dailyXp,
      dailyXpGoal,
      lastActiveDay: new Date().toDateString(),
    }));
  } catch {}
}

const initial = loadPersistedState();

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xp: initial.xp || 45,
  dailyXp: initial.dailyXp || 15,
  dailyXpGoal: initial.dailyXpGoal || 50,
  soundEnabled: sounds.isEnabled(),
  activeCelebration: null,

  addXp: (amount, reason) => {
    const currentXp = get().xp;
    const currentDaily = get().dailyXp;
    const goal = get().dailyXpGoal;

    const oldLevel = getLevelForXp(currentXp);
    const newXp = currentXp + amount;
    const newDaily = currentDaily + amount;
    const newLevel = getLevelForXp(newXp);

    persistState(newXp, newDaily, goal);

    set({ xp: newXp, dailyXp: newDaily });

    // Level up trigger!
    if (newLevel.level > oldLevel.level) {
      sounds.playCelebration();
      get().triggerCelebration({
        type: 'level_up',
        title: `Level Up! Level ${newLevel.level}`,
        subtitle: `You unlocked "${newLevel.title}" (${newLevel.titleAmharic})! Keep pushing, Gobeze!`,
        xpEarned: amount,
        mascotMood: 'celebrating'
      });
    } else {
      sounds.playCorrect();
    }
  },

  triggerCelebration: (payload) => {
    sounds.playCelebration();
    set({ activeCelebration: payload });
  },

  dismissCelebration: () => {
    sounds.playTap();
    set({ activeCelebration: null });
  },

  toggleSound: () => {
    const next = sounds.toggle();
    set({ soundEnabled: next });
  },
}));
