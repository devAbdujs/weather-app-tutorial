'use client';

import { useEffect, useRef } from 'react';
import { useAppStore, UserProfile } from '@/store/useAppStore';

interface StoreInitializerProps {
  profile: UserProfile;
}

export function StoreInitializer({ profile }: StoreInitializerProps) {
  const isFirstRender = useRef(true);

  if (isFirstRender.current) {
    const current = useAppStore.getState().userProfile;
    if (!current || current.telegram_id !== profile.telegram_id) {
      useAppStore.setState({ 
        userProfile: profile, 
        profileLoaded: true 
      });
    }
    isFirstRender.current = false;
  }

  useEffect(() => {
    useAppStore.setState({ 
      userProfile: profile, 
      profileLoaded: true 
    });
  }, [profile]);

  return null;
}
