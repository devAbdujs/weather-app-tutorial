'use client';

import React, { useEffect, useState } from 'react';
import { BookMarked, Trash2, Loader2, Pin } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useRouter } from 'next/navigation';

export interface PinData {
  id: string;
  subject: string;
  chapter_title: string;
  content: string;
  created_at: string;
}

interface NotebookViewProps {
  subject: string;
  initialPins: PinData[];
}

const COLORS = [
  { bg: 'bg-yellow-200', border: 'border-yellow-300', text: 'text-yellow-900', tag: 'bg-yellow-300' },
  { bg: 'bg-green-200', border: 'border-green-300', text: 'text-green-900', tag: 'bg-green-300' },
  { bg: 'bg-blue-200', border: 'border-blue-300', text: 'text-blue-900', tag: 'bg-blue-300' },
  { bg: 'bg-pink-200', border: 'border-pink-300', text: 'text-pink-900', tag: 'bg-pink-300' },
  { bg: 'bg-purple-200', border: 'border-purple-300', text: 'text-purple-900', tag: 'bg-purple-300' },
];

const ROTATIONS = ['-rotate-2', '-rotate-1', 'rotate-1', 'rotate-2', '-rotate-3', 'rotate-3'];

export const NotebookView: React.FC<NotebookViewProps> = ({ subject, initialPins }) => {
  const { haptic, setBackButton } = useTelegram();
  const router = useRouter();
  
  useEffect(() => {
    setBackButton(true, () => router.push('/'));
  }, [setBackButton, router]);
  
  const [pins, setPins] = useState<PinData[]>(initialPins);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deletePin = async (id: string) => {
    haptic.impact('medium');
    setDeletingId(id);
    try {
      const res = await fetch('/api/pins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }) // telegram_id is handled securely by Server Session cookie!
      });
      if (res.ok) {
        setPins(prev => prev.filter(p => p.id !== id));
        haptic.notification('success');
      }
    } catch (err) {
      console.error('Failed to delete pin', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getStyle = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const color = COLORS[Math.abs(hash) % COLORS.length];
    const rotation = ROTATIONS[Math.abs(hash) % ROTATIONS.length];
    return { ...color, rotation };
  };

  const courseDisplayName = subject === 'All' ? 'My Notebook' : `${subject} Notebook`;

  // Gamification teaser
  const MAX_FREE_PINS = 20;
  const pinsUsed = pins.length;

  return (
    <div className="flex-1 flex flex-col pt-4 px-4 pb-24 min-h-screen overflow-y-auto animate-fade-in bg-ground custom-scrollbar" style={{ backgroundImage: 'radial-gradient(circle, #00000005 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      
      <header className="mb-6 pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight leading-none mb-1 flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-amber-500" />
            {courseDisplayName}
          </h1>
          <p className="text-sm font-bold text-tertiary">Your physical sticky board</p>
        </div>
        
        {/* Sticky Note Counter (Marketing Teaser) */}
        <div className="bg-card border-2 border-primary shadow-brutal-sm rounded-[12px] px-3 py-1.5 flex flex-col items-center justify-center rotate-2">
          <span className="text-[10px] font-black text-tertiary uppercase tracking-wider leading-none">Sticky Notes</span>
          <span className={`text-lg font-black leading-none mt-0.5 ${pinsUsed >= MAX_FREE_PINS ? 'text-red-500' : 'text-primary'}`}>
            {pinsUsed}/{MAX_FREE_PINS}
          </span>
        </div>
      </header>

      {pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/20 rounded-[24px] flex items-center justify-center mb-6">
            <Pin className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-black text-primary mb-2">Board is empty</h3>
          <p className="text-sm font-bold text-tertiary max-w-[250px] leading-relaxed">
            While reading Study Notes, highlight text to pin sticky notes to this board!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {pins.map((pin) => {
            const style = getStyle(pin.id);
            return (
              <div 
                key={pin.id} 
                className={`relative ${style.bg} border-2 ${style.border} ${style.rotation} p-3 sm:p-4 shadow-brutal-sm transform transition-transform hover:scale-105 hover:z-10`}
                style={{
                  clipPath: 'polygon(0 0, 100% 0%, 98% 98%, 2% 100%)', // Slight paper imperfection
                }}
              >
                {/* Physical Masking Tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-white/40 border border-black/10 rotate-[-4deg] shadow-sm z-10 backdrop-blur-sm" />
                
                {/* Folded Corner Effect (Bottom Right) */}
                <div className={`absolute bottom-0 right-0 w-4 h-4 bg-black/10`} style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />

                <div className="flex justify-between items-start mb-2 mt-1 gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${style.text} ${style.tag} px-1.5 py-0.5 rounded leading-tight line-clamp-1`}>
                    {pin.chapter_title}
                  </span>
                  <button
                    onClick={() => deletePin(pin.id)}
                    disabled={deletingId === pin.id}
                    className={`p-1 ${style.text} opacity-40 hover:opacity-100 transition-opacity`}
                  >
                    {deletingId === pin.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
                
                <p className={`${style.text} font-medium text-[13px] sm:text-[14px] leading-snug whitespace-pre-wrap font-sans`}>
                  &quot;{pin.content}&quot;
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};
