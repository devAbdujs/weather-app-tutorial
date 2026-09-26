import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
  initialSeconds: number;
  isPaused: boolean;
  onTimeUp: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ initialSeconds, isPaused, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  
  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused) return;

    // Anchor exactly when the interval starts
    const endTime = Date.now() + secondsLeft * 1000;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeUp]); // onTimeUp is stable because it's wrapped in useCallback in ExamWorkspace

  return (
    <div className={`px-3 py-1 rounded-[12px] text-xs font-black tabular-nums border transition-all duration-200 ease-bespoke ${
      secondsLeft < 60
        ? 'bg-error border-error text-white shadow-bespoke-sm'
        : secondsLeft < 300
        ? 'bg-[hsl(36,58%,42%)]/10 border-[hsl(36,58%,42%)]/30 text-[hsl(36,58%,42%)] dark:text-[hsl(36,50%,65%)] shadow-bespoke-sm'
        : 'bg-card border-black/[0.06] dark:border-white/[0.08] text-gray-900 dark:text-gray-100 shadow-bespoke-sm'
    }`}>
      <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
      {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
    </div>
  );
};
