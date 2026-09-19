import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ExamTimerProps {
  initialSeconds: number;
  isPaused: boolean;
  onTimeUp: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ initialSeconds, isPaused, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // Reset timer if initialSeconds changes (e.g., retake exam)
  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeUp]);

  return (
    <div className={`px-3 py-1.5 rounded-[12px] text-sm font-black tabular-nums border-2 transition-all ${
      secondsLeft < 60
        ? 'bg-red-600 border-red-700 text-white shadow-brutal-heavy animate-pulse'
        : secondsLeft < 300
        ? 'bg-error/20 border-error text-error shadow-sm'
        : 'bg-card border-primary text-gray-900 shadow-sm'
    }`}>
      <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
      {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
    </div>
  );
};
