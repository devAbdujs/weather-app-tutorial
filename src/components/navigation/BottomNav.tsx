'use client';

import React from 'react';
import { Home, BookOpen, Zap, User } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';

export type NavTab = 'tracks' | 'practice' | 'flashcards' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { haptic } = useTelegram();

  const handleTabClick = (tab: NavTab) => {
    haptic.selection();
    onChangeTab(tab);
  };

  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'tracks', label: 'Tracks', icon: <Home className="w-5 h-5" /> },
    { id: 'practice', label: 'Practice', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Zap className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-blue-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-blue-500/10' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
