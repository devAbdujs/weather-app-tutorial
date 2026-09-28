'use client';

import { useEffect } from 'react';
import { useAppStore, UserProfile } from '@/store/useAppStore';

interface StoreInitializerProps {
  profile: UserProfile;
}

export function StoreInitializer({ profile }: StoreInitializerProps) {
  useEffect(() => {
    useAppStore.setState({ 
      userProfile: profile, 
      profileLoaded: true 
    });
  }, [profile]);

  return null;
}
