'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Check } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';

const TOUR_STEPS = [
  {
    title: 'Welcome to Ethio Scholar',
    description: 'Your bespoke AI-powered national exam preparation platform.',
    icon: <Sparkles className="w-5 h-5 text-accent-amber" />
  },
  {
    title: 'Spaced Repetition',
    description: 'Master concepts rapidly using our Tinder-swipe flashcards.',
    icon: <Sparkles className="w-5 h-5 text-accent-emerald" />
  },
  {
    title: 'AI Master Tutor',
    description: 'Get instant, step-by-step conceptual hints on any difficult question.',
    icon: <Sparkles className="w-5 h-5 text-accent-blue" />
  }
];

export const ProductTour: React.FC = () => {
  const { haptic } = useTelegram();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('ethio_tour_blueprint');
    if (!hasSeenTour) {
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
    localStorage.setItem('ethio_tour_blueprint', 'true');
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-primary/20 backdrop-blur-sm animate-fade-in" />
      
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 pointer-events-none">
        <div className="w-full max-w-[320px] bg-card border-2 border-primary rounded-[32px] p-6 shadow-[8px_8px_0px_#1a1a1a] pointer-events-auto relative overflow-hidden animate-scale-bounce">
          
          <button 
            onClick={handleComplete}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-[12px] bg-ground border-2 border-transparent hover:border-black/5 text-tertiary hover:text-primary transition-colors focus-ring active:scale-95 z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 space-y-5">
            <div className="w-12 h-12 rounded-[16px] bg-ground border-2 border-black/5 flex items-center justify-center shadow-sm">
              {TOUR_STEPS[step].icon}
            </div>

            <div className="space-y-2 min-h-[70px]">
              <h3 className="text-xl font-bold text-primary tracking-tight animate-fade-in">
                {TOUR_STEPS[step].title}
              </h3>
              <p className="text-sm font-medium text-secondary leading-relaxed animate-fade-up stagger-1">
                {TOUR_STEPS[step].description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-black/5">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-2 rounded-full transition-all duration-500 ease-spring border ${
                      i === step ? 'w-6 bg-primary border-primary' : 'w-2 bg-ground border-black/10'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-card rounded-[16px] font-bold text-sm shadow-[4px_4px_0px_#1a1a1a] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none focus-ring animate-fade-in stagger-2"
              >
                {step === TOUR_STEPS.length - 1 ? (
                  <>Start <Check className="w-4 h-4" /></>
                ) : (
                  <>Next <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
