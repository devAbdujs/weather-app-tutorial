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
    <div className={`px-3 py-1.5 rounded-[12px] text-sm font-black tabular-nums border-2 transition-all ${
      secondsLeft < 60
        ? 'bg-red-600 border-red-700 text-white shadow-md animate-pulse'
        : secondsLeft < 300
        ? 'bg-error/20 border-error text-error shadow-sm'
        : 'bg-card border-primary text-gray-900 dark:text-gray-100 shadow-sm'
    }`}>
      <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
      {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
    </div>
  );
};
