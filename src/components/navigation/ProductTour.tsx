'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Check, BookOpen, Brain, LibraryBig } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';

const TOUR_STEPS = [
  {
    title: 'Welcome to Temari App',
    description: 'The AI-powered Exam Preparation and Study Partner for Ethiopian Students.',
    icon: <Sparkles className="w-6 h-6 text-accent-blue" />,
    color: 'bg-accent-blue/10 text-accent-blue'
  },
  {
    title: '33,000+ Past Papers',
    description: 'Practice with real national exam questions, complete with instant feedback and tracking.',
    icon: <LibraryBig className="w-6 h-6 text-accent-emerald" />,
    color: 'bg-accent-emerald/10 text-accent-emerald'
  },
  {
    title: 'Your Personal AI Tutor',
    description: 'Stuck on a problem? Our AI breaks it down step-by-step so you actually understand it.',
    icon: <Brain className="w-6 h-6 text-accent-amber" />,
    color: 'bg-accent-amber/10 text-accent-amber'
  },
  {
    title: 'Smart Flashcards',
    description: 'Review key concepts fast with our Tinder-style swipeable flashcards and spaced repetition.',
    icon: <BookOpen className="w-6 h-6 text-gray-900 dark:text-gray-100" />,
    color: 'bg-primary/10 text-gray-900 dark:text-gray-100'
  }
];

export const ProductTour: React.FC = () => {
  const { haptic, isTelegram } = useTelegram();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('temari_tour_v1');
    if (!hasSeenTour) {
      // Small delay to allow the app to render first
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    haptic.selection();
    if (step < TOUR_STEPS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    haptic.notification('success');
    setIsVisible(false);
    localStorage.setItem('temari_tour_v1', 'true');
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Dark Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in" />
      
      {/* Bottom Sheet for Mobile, Centered Modal for Desktop */}
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center items-center pointer-events-none sm:p-6">
        <div 
          className="w-full max-w-[400px] bg-card md:rounded-[32px] rounded-t-[32px] md:shadow-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pointer-events-auto relative overflow-hidden transition-transform duration-500 ease-spring transform translate-y-0 animate-sheet-up"
        >
          {/* Subtle drag handle indicator for mobile feel */}
          <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-12 h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
          </div>

          <button 
            onClick={handleComplete}
            className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-ground text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors active:scale-[0.98] active:opacity-80 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 px-6 pb-8 pt-4 md:pt-8 md:px-8 space-y-6">
            
            {/* Dynamic Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${TOUR_STEPS[step].color}`}>
              {TOUR_STEPS[step].icon}
            </div>

            {/* Content */}
            <div className="space-y-3 min-h-[90px]">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-opacity duration-300">
                {TOUR_STEPS[step].title}
              </h3>
              <p className="text-[15px] font-medium text-gray-600 dark:text-gray-400 leading-relaxed transition-opacity duration-300">
                {TOUR_STEPS[step].description}
              </p>
            </div>

            {/* Pagination & Controls */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-2">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ease-out ${
                      i === step ? 'w-6 bg-primary' : 'w-2 bg-black/10 dark:bg-white/10'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-[16px] font-bold text-[15px] shadow-md transition-all active:scale-[0.98] active:opacity-80"
              >
                {step === TOUR_STEPS.length - 1 ? (
                  <>Start Practicing <Check className="w-5 h-5" /></>
                ) : (
                  <>Next <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
