'use client';

import { useEffect } from 'react';
import { useAppStore, UserProfile } from '@/store/useAppStore';
import { useGamificationStore } from '@/store/useGamificationStore';

interface StoreInitializerProps {
  profile: UserProfile;
  totalCorrect?: number;
}

export function StoreInitializer({ profile, totalCorrect }: StoreInitializerProps) {
  useEffect(() => {
    useAppStore.setState({ 
      userProfile: profile, 
      profileLoaded: true 
    });
    if (typeof totalCorrect === 'number') {
      useGamificationStore.getState().syncFromDb(totalCorrect);
    }
  }, [profile, totalCorrect]);

  return null;
}
