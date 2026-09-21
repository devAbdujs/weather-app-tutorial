'use client';

import React, { useMemo, useState } from 'react';
import { LogOut, Award, ChevronRight, Zap, GraduationCap, Target, BarChart2 } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { logout } from '@/app/actions/user';
import { WelcomeOnboarding } from './WelcomeOnboarding';

export const ProfileView = ({ profile, stats }: { profile: any, stats: any[] }) => {
  const router = useRouter();
  const { haptic, isTelegram } = useTelegram();
  const updateProfile = useAppStore(s => s.updateProfile);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChangingExam, setIsChangingExam] = useState(false);
  const [devClicks, setDevClicks] = useState(0);
  const toggleDevMode = useAppStore(s => s.toggleDevMode);
  const devMode = useAppStore(s => s.devMode);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    haptic.impact('heavy');
    try {
      await logout();
      window.location.href = '/';
    } catch (e) {
      console.error('Logout failed', e);
      setIsLoggingOut(false);
    }
  };

  const handleRetakeOnboarding = () => {
    haptic.selection();
    setIsChangingExam(true);
  };

  const handleAvatarClick = () => {
    setDevClicks(prev => {
      const next = prev + 1;
      if (next === 5) {
        haptic.notification('success');
        toggleDevMode();
        return 0;
      }
      return next;
    });
  };

  const isPremium = profile.subscription_status === 'premium';
  
  const initials = useMemo(() => {
    const name = profile.full_name || 'Scholar';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }, [profile.full_name]);

  const totalQuestions = stats.reduce((acc, curr) => acc + (curr.questions_attempted || 0), 0);
  const totalCorrect = stats.reduce((acc, curr) => acc + (curr.questions_correct || 0), 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <>
      {isChangingExam && (
        <WelcomeOnboarding 
          onComplete={(res) => {
            updateProfile({ target_exam: res.target, stream: res.stream });
            setIsChangingExam(false);
            router.refresh();
          }}
          onCancel={() => setIsChangingExam(false)}
        />
      )}
      <div className="flex-1 flex flex-col pt-6 px-4 pb-24 overflow-y-auto animate-fade-in bg-ground custom-scrollbar">
        
        {/* Header Profile Section */}
      <div className="flex flex-col items-center mb-8 relative">
        {devMode && <div className="absolute top-0 right-5 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-full">Dev Mode</div>}
        <div onClick={handleAvatarClick} className="w-24 h-24 bg-gradient-to-br from-[#229ED9] to-[#1E8CC0] rounded-[28px] flex items-center justify-center text-white mb-4 relative shadow-lg shadow-[#229ED9]/20 transform rotate-3 active:scale-[0.98] active:opacity-80 transition-transform">
          <div className="w-full h-full absolute inset-0 bg-black/10 rounded-[28px] transform -rotate-6 transition-transform overflow-hidden" />
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={profile.avatar_url} 
              alt={profile.full_name || 'Avatar'} 
              className="w-full h-full object-cover rounded-[28px] relative z-10 transform -rotate-3"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-3xl font-black tracking-tighter relative z-10">{initials}</span>
          )}
          {isPremium && (
            <div className="absolute -bottom-2 -right-2 bg-accent-gold text-gray-900 p-1.5 rounded-xl shadow-md z-20">
              <Zap className="w-4 h-4 fill-primary" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{profile.full_name || 'Scholar'}</h1>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">ID: {profile.telegram_id}</p>
      </div>

      <div className="space-y-4">
        {/* Subscription Card */}
        <div className="bg-card border border-black/5 shadow-sm rounded-[24px] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${isPremium ? 'bg-accent-gold text-gray-900 shadow-sm' : 'bg-black/5 text-gray-600'}`}>
              <Zap className={`w-6 h-6 ${isPremium ? 'fill-primary' : ''}`} />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-gray-900">Subscription</h2>
              <p className="text-[13px] font-bold text-gray-500">{isPremium ? 'Premium Active' : 'Free Tier'}</p>
            </div>
          </div>
          {!isPremium && (
            <button className="px-5 py-2.5 bg-primary text-white rounded-[12px] text-[13px] font-black shadow-md active:scale-[0.98] active:opacity-80 transition-all">
              Upgrade
            </button>
          )}
        </div>

        {/* Exam Goal Card */}
        <button onClick={handleRetakeOnboarding} className="w-full bg-card border border-black/5 shadow-sm rounded-[24px] p-5 flex items-center justify-between active:scale-[0.98] active:opacity-80 transition-all text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[16px] bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-gray-900">Academic Goal</h2>
              <p className="text-[13px] font-bold text-gray-500 capitalize line-clamp-1">{profile.target_exam} • {profile.stream}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>

        {/* Global Stats */}
        <div className="bg-card border border-black/5 shadow-sm rounded-[24px] p-5 flex flex-col gap-4">
          <h2 className="text-[15px] font-black text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#229ED9]" /> Performance Overview
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-ground border border-black/5 rounded-[16px] p-3 text-center flex flex-col items-center justify-center h-20">
              <span className="text-xl font-black text-gray-900 block leading-none mb-1">{profile.daily_streak}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Streak</span>
            </div>
            <div className="bg-ground border border-black/5 rounded-[16px] p-3 text-center flex flex-col items-center justify-center h-20">
              <span className="text-xl font-black text-gray-900 block leading-none mb-1">{totalQuestions}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Drills</span>
            </div>
            <div className="bg-[#229ED9]/10 border border-[#229ED9]/20 rounded-[16px] p-3 text-center flex flex-col items-center justify-center h-20">
              <span className="text-xl font-black text-[#229ED9] block leading-none mb-1">{overallAccuracy}%</span>
              <span className="text-[9px] font-bold text-[#229ED9]/70 uppercase tracking-widest">Accuracy</span>
            </div>
          </div>
        </div>
        
        {/* Subject Mastery Details */}
        {stats.length > 0 && (
          <div className="bg-card border border-black/5 shadow-sm rounded-[24px] p-5 flex flex-col gap-4">
            <h2 className="text-[15px] font-black text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-gray-900" /> Subject Mastery
            </h2>
            <div className="flex flex-col gap-3">
              {stats.sort((a, b) => b.questions_attempted - a.questions_attempted).map((s) => {
                const acc = s.questions_attempted > 0 ? Math.round((s.questions_correct / s.questions_attempted) * 100) : 0;
                return (
                  <div key={s.subject} className="flex items-center justify-between border-b border-black/5 last:border-0 pb-3 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-black text-gray-900">{s.subject}</span>
                      <span className="text-[11px] font-bold text-gray-500">{s.questions_attempted} Qs Attempted</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[15px] font-black text-gray-900 block">{acc}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Logout (Only visible on web, Telegram Mini App handles auth implicitly) */}
        {!isTelegram && (
          <button disabled={isLoggingOut} onClick={handleLogout} className="w-full mt-2 bg-card border border-red-500/10 shadow-sm rounded-[24px] p-5 flex items-center justify-center gap-2 active:scale-[0.98] active:opacity-80 transition-all group hover:bg-red-500/5 disabled:opacity-50 disabled:active:scale-100">
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 text-red-500 group-active:scale-90 transition-transform" />
            )}
            <span className="text-[15px] font-black text-red-500 tracking-wide">
              {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </span>
          </button>
        )}
      </div>

    </div>
    </>
  );
};
