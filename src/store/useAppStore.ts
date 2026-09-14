import { create } from 'zustand';

export type SetupModalType = 'exam' | 'flashcards' | 'notes' | null;

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

  setSetupModalType: (type: SetupModalType) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  setupModalType: null,
  userProfile: null,
  profileLoaded: false,

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
}));
