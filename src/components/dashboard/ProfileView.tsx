'use client';

import React from 'react';
import { User, LogOut, Award, ChevronRight, Zap, GraduationCap, Settings } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export const ProfileView = ({ profile }: { profile: any }) => {
  const router = useRouter();
  const { haptic } = useTelegram();
  const setSetupModalType = useAppStore(s => s.setSetupModalType);

  const handleLogout = () => {
    haptic.impact('heavy');
    // For telegram mini app, logging out is closing the app or resetting.
    // For standard web, we delete the cookie.
    document.cookie = "es_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/';
  };

  const handleRetakeOnboarding = () => {
    haptic.selection();
    setSetupModalType('exam');
    router.push('/');
  };

  const isPremium = profile.subscription_status === 'premium';

  return (
    <div className="flex-1 flex flex-col pt-6 px-4 pb-24 overflow-y-auto animate-fade-in bg-ground custom-scrollbar">
      
      {/* Header Profile Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center text-primary mb-3 relative shadow-sm">
          <User className="w-8 h-8" />
          {isPremium && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-ground shadow-md">
              <Zap className="w-3 h-3 fill-white" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black text-primary tracking-tight">{profile.full_name || 'Scholar'}</h1>
        <p className="text-sm font-bold text-tertiary">ID: {profile.telegram_id}</p>
      </div>

      <div className="space-y-4">
        {/* Subscription Card */}
        <div className="bg-card border border-black/5 shadow-sm rounded-[20px] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${isPremium ? 'bg-primary text-white' : 'bg-black/5 text-secondary'}`}>
              <Zap className={`w-5 h-5 ${isPremium ? 'fill-white' : ''}`} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-primary">Subscription</h2>
              <p className="text-xs font-bold text-tertiary">{isPremium ? 'Premium Active' : 'Free Tier'}</p>
            </div>
          </div>
          {!isPremium && (
            <button className="px-4 py-2 bg-primary text-white rounded-full text-xs font-black shadow-md active:scale-95 transition-all">
              Upgrade
            </button>
          )}
        </div>

        {/* Exam Goal Card */}
        <button onClick={handleRetakeOnboarding} className="w-full bg-card border border-black/5 shadow-sm rounded-[20px] p-5 flex items-center justify-between active:scale-95 transition-all text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-primary">Academic Goal</h2>
              <p className="text-xs font-bold text-tertiary capitalize">{profile.target_exam} • {profile.stream}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-tertiary" />
        </button>

        {/* Stats Card */}
        <div className="bg-card border border-black/5 shadow-sm rounded-[20px] p-5 flex flex-col gap-4">
          <h2 className="text-[15px] font-black text-primary flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Activity Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ground border border-black/5 rounded-[16px] p-4 text-center">
              <span className="text-2xl font-black text-primary block leading-none mb-1">{profile.daily_streak}</span>
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Day Streak</span>
            </div>
            <div className="bg-ground border border-black/5 rounded-[16px] p-4 text-center">
              <span className="text-2xl font-black text-primary block leading-none mb-1">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 'N/A'}
              </span>
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Joined</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full mt-4 bg-ground border border-black/5 shadow-sm rounded-[20px] p-5 flex items-center justify-center gap-2 active:scale-95 transition-all">
          <LogOut className="w-5 h-5 text-red-500" />
          <span className="text-[15px] font-black text-red-500">Sign Out</span>
        </button>
      </div>

    </div>
  );
};
