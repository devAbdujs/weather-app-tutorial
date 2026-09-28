'use client';

import React from 'react';
import { mascotPalette } from '@/styles/tokens';

export type MascotMood = 
  | 'happy' 
  | 'greeting' 
  | 'studying' 
  | 'celebrating' 
  | 'streak_fire' 
  | 'worried' 
  | 'tutor' 
  | 'proud';

interface TemariMascotProps {
  mood?: MascotMood;
  expression?: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  animate?: boolean;
}

const SIZE_MAP = {
  sm: { width: 52, height: 52 },
  md: { width: 84, height: 84 },
  lg: { width: 120, height: 120 },
  xl: { width: 160, height: 160 },
};

/**
 * Teme (ቴሜ) the Ethiopian Lion Cub Scholar
 * Fully responsive vector SVG character that adapts expressions, poses, and accessories.
 */
export const TemariMascot: React.FC<TemariMascotProps> = ({
  mood,
  expression,
  size = 'md',
  className = '',
  animate = true,
}) => {
  const activeMood = expression || mood || 'happy';
  const { width, height } = typeof size === 'number'
    ? { width: size, height: size }
    : SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div 
      className={`inline-flex items-center justify-center select-none relative ${className}`}
      style={{ width, height }}
      aria-label={`Teme the Scholar (${activeMood} mood)`}
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${animate ? 'transition-transform duration-300 ease-spring' : ''}`}
      >
        <defs>
          {/* Fur Gradient */}
          <linearGradient id="teme-fur" x1="40" y1="20" x2="120" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={mascotPalette.furGradientStart} />    {/* Warm golden amber */}
            <stop offset="100%" stopColor={mascotPalette.lionFur} />  {/* Rich lion honey */}
          </linearGradient>

          {/* Mane Gradient */}
          <linearGradient id="teme-mane" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={mascotPalette.lionManeLight} />
            <stop offset="100%" stopColor={mascotPalette.lionManeDark} />
          </linearGradient>

          {/* Tibeb Collar Pattern */}
          <linearGradient id="teme-tibeb" x1="50" y1="130" x2="110" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={mascotPalette.sparkleEmerald} />
            <stop offset="50%" stopColor={mascotPalette.sparkleGold} />
            <stop offset="100%" stopColor={mascotPalette.torchFlameOuter} />
          </linearGradient>

          {/* Fire Aura */}
          <radialGradient id="teme-flame" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={mascotPalette.sparkleGold} stopOpacity="0.8" />
            <stop offset="60%" stopColor={mascotPalette.torchFlameOuter} stopOpacity="0.4" />
            <stop offset="100%" stopColor={mascotPalette.torchFlameOuter} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── STREAK FIRE AURA BACKGROUND (if streak_fire) ── */}
        {mood === 'streak_fire' && (
          <g className="animate-pulse">
            <circle cx="80" cy="80" r="72" fill="url(#teme-flame)" />
            {/* Flame Sparks */}
            <path d="M75 18 C78 10, 82 10, 85 18 C88 12, 94 15, 90 24 C82 28, 72 26, 75 18 Z" fill={mascotPalette.torchFlameOuter} />
            <path d="M78 22 C80 16, 84 16, 86 22 C82 25, 78 25, 78 22 Z" fill={mascotPalette.torchFlameInner} />
          </g>
        )}

        {/* ── CELEBRATION SPARKLES (if celebrating) ── */}
        {mood === 'celebrating' && (
          <g>
            <path d="M25 40 L28 47 L35 50 L28 53 L25 60 L22 53 L15 50 L22 47 Z" fill={mascotPalette.sparkleGold} className="animate-pulse" />
            <path d="M135 35 L137 41 L143 43 L137 45 L135 51 L133 45 L127 43 L133 41 Z" fill={mascotPalette.sparkleEmerald} className="animate-pulse" />
            <circle cx="30" cy="25" r="3" fill={mascotPalette.sparkleIndigo} />
            <circle cx="130" cy="65" r="3.5" fill={mascotPalette.sparklePink} />
          </g>
        )}

        {/* ── 1. FLUFFY LION MANE (Tufts) ── */}
        <g id="mane">
          <circle cx="80" cy="82" r="54" fill="url(#teme-mane)" opacity="0.95" />
          {/* Mane Puffs */}
          <circle cx="44" cy="52" r="16" fill="url(#teme-mane)" />
          <circle cx="116" cy="52" r="16" fill="url(#teme-mane)" />
          <circle cx="34" cy="82" r="16" fill="url(#teme-mane)" />
          <circle cx="126" cy="82" r="16" fill="url(#teme-mane)" />
          <circle cx="44" cy="112" r="15" fill="url(#teme-mane)" />
          <circle cx="116" cy="112" r="15" fill="url(#teme-mane)" />
        </g>

        {/* ── 2. ROUND LION EARS ── */}
        <g id="ears">
          {/* Left Ear */}
          <circle cx="42" cy="46" r="18" fill="url(#teme-fur)" />
          <circle cx="42" cy="46" r="10" fill={mascotPalette.innerEar} />
          {/* Right Ear */}
          <circle cx="118" cy="46" r="18" fill="url(#teme-fur)" />
          <circle cx="118" cy="46" r="10" fill={mascotPalette.innerEar} />
        </g>

        {/* ── 3. MAIN HEAD ── */}
        <circle cx="80" cy="82" r="44" fill="url(#teme-fur)" />

        {/* ── 4. FOREHEAD TUFT (Scholar tuft) ── */}
        <path 
          d="M74 42 C77 34, 83 34, 86 42 C89 36, 95 38, 92 46 C86 48, 76 48, 74 42 Z" 
          fill={mascotPalette.lionFur} 
        />

        {/* ── 5. ETHIOPIAN TIBEB SCARF / COLLAR ── */}
        <g id="tibeb-collar">
          <path 
            d="M50 118 Q80 134 110 118 C114 125 108 138 80 142 C52 138 46 125 50 118 Z" 
            fill={mascotPalette.white} 
            stroke={mascotPalette.collarBorder}
            strokeWidth="1.5"
          />
          {/* Tibeb Diamond Accents */}
          <path 
            d="M58 124 L63 120 L68 124 L63 128 Z M75 127 L80 122 L85 127 L80 132 Z M92 124 L97 120 L102 124 L97 128 Z" 
            fill="url(#teme-tibeb)" 
          />
        </g>

        {/* ── 6. CHEEKS & BLUSH ── */}
        <circle cx="56" cy="94" r="8" fill={mascotPalette.blush} opacity="0.25" />
        <circle cx="104" cy="94" r="8" fill={mascotPalette.blush} opacity="0.25" />

        {/* ── 7. SNOUT / MUZZLE ── */}
        <ellipse cx="80" cy="95" rx="20" ry="14" fill={mascotPalette.snout} />
        {/* Cute button nose */}
        <path d="M74 88 C76 86, 84 86, 86 88 C85 93, 75 93, 74 88 Z" fill={mascotPalette.lionManeDark} />
        {/* Cat/Lion mouth */}
        <path d="M80 92 L80 97 M80 97 Q74 102 70 98 M80 97 Q86 102 90 98" stroke={mascotPalette.lionManeDark} strokeWidth="2" strokeLinecap="round" />

        {/* ── 8. EYES & EXPRESSIONS ACCORDING TO MOOD ── */}
        {mood === 'celebrating' ? (
          // Joyful closed squinting arcs
          <g>
            <path d="M56 78 Q64 68 72 78" stroke={mascotPalette.lionManeDark} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M88 78 Q96 68 104 78" stroke={mascotPalette.lionManeDark} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        ) : mood === 'worried' ? (
          // Wide concerned eyes with sweat bead
          <g>
            <ellipse cx="64" cy="74" rx="7.5" ry="9" fill={mascotPalette.pupil} />
            <ellipse cx="96" cy="74" rx="7.5" ry="9" fill={mascotPalette.pupil} />
            <circle cx="66" cy="71" r="3" fill={mascotPalette.white} />
            <circle cx="98" cy="71" r="3" fill={mascotPalette.white} />
            {/* Worried Eyebrows */}
            <path d="M58 64 Q66 69 72 65" stroke={mascotPalette.lionManeDark} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M88 65 Q94 69 102 64" stroke={mascotPalette.lionManeDark} strokeWidth="2.5" strokeLinecap="round" />
            {/* Sweat Drop */}
            <path d="M112 62 C114 59, 116 59, 117 62 C118 64, 113 66, 112 62 Z" fill={mascotPalette.tear} />
          </g>
        ) : mood === 'streak_fire' ? (
          // Fiery focused eyes
          <g>
            <ellipse cx="64" cy="74" rx="7" ry="8.5" fill={mascotPalette.pupil} />
            <ellipse cx="96" cy="74" rx="7" ry="8.5" fill={mascotPalette.pupil} />
            {/* Fire Reflection */}
            <circle cx="66" cy="71" r="2.5" fill={mascotPalette.sparkleGold} />
            <circle cx="98" cy="71" r="2.5" fill={mascotPalette.sparkleGold} />
            <path d="M58 65 Q66 62 72 67" stroke={mascotPalette.lionManeDark} strokeWidth="3" strokeLinecap="round" />
            <path d="M88 67 Q94 62 102 65" stroke={mascotPalette.lionManeDark} strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : (
          // Standard happy alert student eyes
          <g>
            <ellipse cx="64" cy="74" rx="7" ry="8.5" fill={mascotPalette.pupil} />
            <ellipse cx="96" cy="74" rx="7" ry="8.5" fill={mascotPalette.pupil} />
            {/* Double Sparkle Reflections */}
            <circle cx="66.5" cy="71.5" r="2.6" fill={mascotPalette.white} />
            <circle cx="62.5" cy="76.5" r="1.2" fill={mascotPalette.white} />
            <circle cx="98.5" cy="71.5" r="2.6" fill={mascotPalette.white} />
            <circle cx="94.5" cy="76.5" r="1.2" fill={mascotPalette.white} />
            {/* Friendly Eyebrows */}
            <path d="M58 64 Q64 61 70 64" stroke={mascotPalette.lionManeDark} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M90 64 Q96 61 102 64" stroke={mascotPalette.lionManeDark} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* ── 9. ACCESSORIES / POSE PROPS ── */}

        {/* Scholar Glasses (Studying or Tutor mood) */}
        {(mood === 'studying' || mood === 'tutor') && (
          <g id="glasses">
            <circle cx="64" cy="74" r="12" stroke={mascotPalette.lionManeDark} strokeWidth="3" fill={mascotPalette.white} fillOpacity="0.1" />
            <circle cx="96" cy="74" r="12" stroke={mascotPalette.lionManeDark} strokeWidth="3" fill={mascotPalette.white} fillOpacity="0.1" />
            <path d="M76 74 Q80 71 84 74" stroke={mascotPalette.lionManeDark} strokeWidth="3" fill="none" />
          </g>
        )}

        {/* Open Study Book (Studying mood) */}
        {mood === 'studying' && (
          <g id="book">
            <path d="M52 126 C64 120 78 122 80 128 C82 122 96 120 108 126 L108 146 C96 140 82 142 80 148 C78 142 64 140 52 146 Z" fill={mascotPalette.bookCover} stroke={mascotPalette.bookBorder} strokeWidth="2" />
            {/* Pages */}
            <path d="M54 128 C64 123 76 124 78 130 L78 146 C76 141 64 140 54 144 Z" fill={mascotPalette.bookPages} />
            <path d="M106 128 C96 123 84 124 82 130 L82 146 C84 141 96 140 106 144 Z" fill={mascotPalette.bookPages} />
            {/* Book Spine Center */}
            <line x1="80" y1="128" x2="80" y2="148" stroke={mascotPalette.bookBorder} strokeWidth="2" />
          </g>
        )}

        {/* Waving Paw (Greeting / Happy mood) */}
        {(mood === 'greeting' || mood === 'happy') && (
          <g id="waving-paw" className="origin-bottom-left animate-bounce">
            <ellipse cx="122" cy="98" rx="8" ry="11" fill="url(#teme-fur)" transform="rotate(-25 122 98)" />
            {/* Paw Pads */}
            <ellipse cx="121" cy="97" rx="4" ry="5" fill={mascotPalette.innerEar} transform="rotate(-25 121 97)" />
            <circle cx="118" cy="90" r="1.5" fill={mascotPalette.innerEar} />
            <circle cx="123" cy="89" r="1.5" fill={mascotPalette.innerEar} />
            <circle cx="127" cy="92" r="1.5" fill={mascotPalette.innerEar} />
          </g>
        )}

        {/* Victory Paws (Celebrating mood) */}
        {mood === 'celebrating' && (
          <g id="celebration-paws">
            <ellipse cx="38" cy="38" rx="9" ry="12" fill="url(#teme-fur)" transform="rotate(-20 38 38)" />
            <circle cx="38" cy="38" r="5" fill={mascotPalette.innerEar} />
            <ellipse cx="122" cy="38" rx="9" ry="12" fill="url(#teme-fur)" transform="rotate(20 122 38)" />
            <circle cx="122" cy="38" r="5" fill={mascotPalette.innerEar} />
          </g>
        )}

        {/* Torch / Flame in Hand (Streak mood) */}
        {mood === 'streak_fire' && (
          <g id="torch">
            <rect x="120" y="80" width="6" height="24" rx="2" fill={mascotPalette.lionManeDark} />
            <path d="M123 78 C120 70 123 64 123 60 C125 65 128 66 128 72 C129 76 126 78 123 78 Z" fill={mascotPalette.torchFlameOuter} />
            <path d="M123 76 C121 72 123 68 123 65 C124 68 126 69 126 73 C126 75 125 76 123 76 Z" fill={mascotPalette.torchFlameInner} />
          </g>
        )}
      </svg>
    </div>
  );
};

interface MascotBubbleProps {
  mood?: MascotMood;
  expression?: MascotMood;
  message?: React.ReactNode;
  subtext?: string;
  mascotSize?: 'sm' | 'md' | 'lg' | 'xl' | number;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: React.ReactNode;
  tailPosition?: 'left' | 'top';
}

/**
 * Speech Bubble with Teme the Scholar
 * Renders mascot alongside a warm tactile comic speech bubble.
 */
export const MascotBubble: React.FC<MascotBubbleProps> = ({
  mood,
  expression,
  message,
  subtext,
  mascotSize = 'md',
  action,
  className = '',
  children,
  tailPosition = 'left',
}) => {
  const activeMood = expression || mood || 'happy';
  return (
    <div className={`flex items-start gap-3.5 p-3.5 rounded-hero bg-card border-2 border-b-bevel-lg border-black/[0.08] dark:border-white/[0.08] shadow-tactile-sm relative ${className}`}>
      <div className="shrink-0 mt-0.5">
        <TemariMascot mood={activeMood} size={mascotSize} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="relative bg-ground/80 dark:bg-panel p-3 rounded-card-sm border border-black/[0.06] dark:border-white/[0.08]">
          {/* Speech bubble arrow pointer */}
          <svg className="absolute -left-2 top-3 w-2 h-3 text-ground/80 dark:text-panel fill-current pointer-events-none" viewBox="0 0 8 12">
            <polygon points="8,0 0,6 8,12" />
          </svg>

          {message ? (
            <div className="text-sm font-black text-gray-900 dark:text-gray-100 leading-snug">
              {message}
            </div>
          ) : null}
          {children}
          {subtext && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {subtext}
            </p>
          )}

          {action && (
            <button
              onClick={action.onClick}
              className="mt-2.5 px-3 py-1.5 rounded-control btn-3d-primary text-xs font-black active:translate-y-[1px] transition-all inline-flex items-center gap-1.5 shadow-tactile-xs"
            >
              <span>{action.label}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
