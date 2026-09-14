'use client';
import { useRef } from 'react';
import { useAppStore, UserProfile } from '@/store/useAppStore';

interface StoreInitializerProps {
  profile: UserProfile;
}

export function StoreInitializer({ profile }: StoreInitializerProps) {
  const initialized = useRef(false);
  
  if (!initialized.current) {
    useAppStore.setState({ 
      userProfile: profile, 
      profileLoaded: true 
    });
    initialized.current = true;
  }
  
  return null;
}
