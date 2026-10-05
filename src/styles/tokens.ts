/**
 * Temari Centralized Design Token System
 * Single source of truth for colors, typography scale, radii, spacing, and shadows.
 * Imported directly into tailwind.config.ts and consumed across all components.
 */

export const tokens = {
  colors: {
    // Semantic surfaces (CSS variables adapt automatically between light/dark mode)
    ground: 'var(--background)',
    card: 'var(--surface)',
    panel: 'var(--surface-2)',

    // ── Semantic Text Tokens ──────────────────────────────────────────
    // Use these instead of paired `text-gray-900 dark:text-gray-100` patterns.
    // They adapt automatically to light/dark mode via CSS variables.
    foreground: 'var(--foreground)',          // Primary body text (replaces text-gray-900 dark:text-gray-100)
    'muted-foreground': 'var(--text-secondary)', // Secondary / label text (replaces text-gray-500 dark:text-gray-400)
    'subtle-foreground': 'var(--text-tertiary)', // Tertiary / hint text (replaces text-gray-400 dark:text-gray-500)

    // Brand Primary (Academic Royal Blue)
    primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
    'primary-foreground': 'var(--primary-foreground, #ffffff)',
    'primary-border': 'var(--primary-border-bottom)',

    // Semantic Accents
    'accent-gold': 'rgb(var(--accent-gold-rgb) / <alpha-value>)',
    'accent-emerald': 'rgb(var(--accent-emerald-rgb) / <alpha-value>)',
    'accent-rose': 'rgb(var(--accent-rose-rgb) / <alpha-value>)',
    'accent-blue': 'rgb(var(--accent-blue-rgb) / <alpha-value>)',
    'accent-purple': 'rgb(var(--accent-purple-rgb) / <alpha-value>)',

    // Semantic Status Aliases
    success: 'rgb(var(--accent-emerald-rgb) / <alpha-value>)',
    warning: 'rgb(var(--accent-gold-rgb) / <alpha-value>)',
    info: 'rgb(var(--accent-blue-rgb) / <alpha-value>)',
    danger: 'rgb(var(--accent-rose-rgb) / <alpha-value>)',
    error: 'rgb(var(--accent-rose-rgb) / <alpha-value>)',
    'sticky-yellow': 'hsl(48, 100%, 96%)',

    // Semantic Borders
    'border-subtle': 'var(--border)',
    'border-default': 'var(--border)',
    'border-strong': 'var(--border-strong)',

    // Telegram Mini App Client Theme Tokens
    'tg-bg': 'var(--tg-theme-bg-color, var(--background))',
    'tg-secondary-bg': 'var(--tg-theme-secondary-bg-color, var(--surface-2))',
    'tg-text': 'var(--tg-theme-text-color, var(--foreground))',
    'tg-hint': 'var(--tg-theme-hint-color, var(--text-secondary))',
    'tg-link': 'var(--tg-theme-link-color, var(--primary))',
    'tg-button': 'var(--tg-theme-button-color, var(--primary))',
    'tg-button-text': 'var(--tg-theme-button-text-color, var(--primary-foreground))',

    // Colorful Card & Pill Tints (Inspiration: Lavender, Mint, Peach, Sky, Rose, Cream)
    'tint-purple': 'var(--tint-purple)',
    'tint-purple-fg': 'var(--tint-purple-fg)',
    'tint-purple-border': 'var(--tint-purple-border)',

    'tint-green': 'var(--tint-green)',
    'tint-green-fg': 'var(--tint-green-fg)',
    'tint-green-border': 'var(--tint-green-border)',

    'tint-peach': 'var(--tint-peach)',
    'tint-peach-fg': 'var(--tint-peach-fg)',
    'tint-peach-border': 'var(--tint-peach-border)',

    'tint-sky': 'var(--tint-sky)',
    'tint-sky-fg': 'var(--tint-sky-fg)',
    'tint-sky-border': 'var(--tint-sky-border)',

    'tint-rose': 'var(--tint-rose)',
    'tint-rose-fg': 'var(--tint-rose-fg)',
    'tint-rose-border': 'var(--tint-rose-border)',

    'tint-cream': 'var(--tint-cream)',
    'tint-cream-fg': 'var(--tint-cream-fg)',
    'tint-cream-border': 'var(--tint-cream-border)',
  },

  spacing: {
    'touch': '44px',
    'safe-bottom': 'env(safe-area-inset-bottom, 16px)',
    'safe-top': 'env(safe-area-inset-top, 0px)',
  },

  fontSize: {
    // Micro badge, streak day tag, XP pill counter (10px / 14px)
    micro: ['0.625rem', { lineHeight: '0.875rem' }],
    // Section overlines, metadata, timestamps (11px / 16px)
    caption: ['0.6875rem', { lineHeight: '1rem' }],
    // Secondary card labels, compact body text (13px / 18px)
    compact: ['0.8125rem', { lineHeight: '1.125rem' }],
    // Primary card titles, question option text (15px / 22px)
    regular: ['0.9375rem', { lineHeight: '1.375rem' }],
    // Modal titles, subsection headers (17px / 24px)
    'display-sm': ['1.0625rem', { lineHeight: '1.5rem' }],
    // Page headers, prominent stat counters (22px / 28px)
    'display-md': ['1.375rem', { lineHeight: '1.75rem' }],
  },

  borderRadius: {
    // Sub-controls, small badges, thumbnail icons (12px)
    control: '12px',
    // Compact buttons, header toggles, inputs (14px)
    btn: '14px',
    // Grid question tiles, bento tiles (16px)
    'card-sm': '16px',
    // Standard interactive cards & list items (20px)
    card: '20px',
    // Chunky cards, mascot bubbles, profile identity cards (22px)
    'card-lg': '22px',
    // Hero launchpads, featured exam cards (24px)
    hero: '24px',
    // Bottom sheets, action modals (32px)
    modal: '32px',
  },

  borderWidth: {
    // 3D tactile button and card bottom bevel
    bevel: '3px',
    // Prominent hero card bottom bevel
    'bevel-lg': '4px',
  },

  boxShadow: {
    // Tactile micro-shadows
    'tactile-xs': '0 1px 2px rgba(15, 23, 42, 0.04)',
    'tactile-sm': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
    'tactile-md': '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.05)',
    'tactile-lg': '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
    'tactile-nav': '0 -2px 14px 0 rgba(15, 23, 42, 0.04)',
  },
} as const;

export type DesignTokens = typeof tokens;

// Type helper for Tailwind config compatibility
export const tailwindTokens = {
  ...tokens,
  fontSize: tokens.fontSize as unknown as Record<string, [string, { lineHeight: string }]>,
};

// Raw hex palette for environments requiring raw color strings (e.g. Telegram WebApp setHeaderColor)
export const surfaceHex = {
  groundLight: '#F8FAFC',
  groundDark: '#0C0F14',
  panelLight: '#EBF0F5',
  panelDark: '#1E2530',
  cardLight: '#FFFFFF',
  cardDark: '#151A22',
} as const;

// Mascot illustration color constants (centralized vector color palette)
export const mascotPalette = {
  lionFur: '#D97706',
  lionManeLight: '#B45309',
  lionManeDark: '#78350F',
  snout: '#FEF3C7',
  innerEar: '#FED7AA',
  blush: '#F43F5E',
  pupil: '#1E293B',
  sparkleGold: '#F59E0B',
  sparkleEmerald: '#10B981',
  sparkleIndigo: '#6366F1',
  sparklePink: '#EC4899',
  tear: '#38BDF8',
  bookCover: '#047857',
  bookBorder: '#065F46',
  bookPages: '#F8FAFC',
  furGradientStart: '#FBBF24',
  torchFlameOuter: '#EF4444',
  torchFlameInner: '#FBBF24',
  collarBorder: '#E2E8F0',
  white: '#FFFFFF',
} as const;

// Gamification celebration confetti particle palette
export const celebrationConfettiPalette = [
  '#F59E0B',
  '#10B981',
  '#1E3B8A',
  '#8B5CF6',
  '#EF4444',
] as const;

