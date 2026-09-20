import { create } from 'zustand';

export type SetupModalType = 'exam' | 'flashcards' | 'notes' | null;

/**
 * Lightweight session profile stored in the Zustand store.
 * Note: differs from the database UserProfile type in src/types/index.ts
 * which reflects the full Supabase 'profiles' table shape.
 */
export interface UserProfile {
  telegram_id?: string;
  first_name?: string;
  target_exam: string | null;
  stream: string;
  daily_streak: number;
}

interface AppState {
  setupModalType: SetupModalType;
  userProfile: UserProfile | null;
  profileLoaded: boolean;
  devMode: boolean;

  setSetupModalType: (type: SetupModalType) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  toggleDevMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  setupModalType: null,
  userProfile: null,
  profileLoaded: false,
  devMode: false,

  setSetupModalType: (type) => set({ setupModalType: type }),

  setUserProfile: (updates) => set((state) => ({
    userProfile: state.userProfile ? { ...state.userProfile, ...updates } : {
      target_exam: null,
      stream: '',
      daily_streak: 0,
      ...updates
    },
    profileLoaded: true
  })),

  toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),
}));
