import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",   // Toggle via .dark class on <html>
  theme: {
    extend: {
      colors: {
        /* ── Semantic surfaces (CSS vars — auto dark/light) ── */
        ground:  "var(--background)",
        panel:   "var(--surface-2)",
        card:    "var(--surface)",

        /* ── Brand — one accent, used sparingly ── */
        primary: "var(--primary)",
        accent:  "hsl(43, 78%, 50%)",  /* Warm gold — slightly desaturated */

        /* ── Semantic accent palette — desaturated, bespoke ── */
        /* These are used for subject color theming across the app */
        "accent-amber":   "hsl(43, 78%, 50%)",   /* Warm gold */
        "accent-emerald": "hsl(158, 45%, 42%)",  /* Muted teal-green — NOT neon */
        "accent-rose":    "hsl(350, 55%, 55%)",  /* Dusty rose — NOT harsh red */
        "accent-yellow":  "hsl(43, 78%, 50%)",
        "accent-blue":    "hsl(199, 65%, 46%)",  /* Telegram blue — slightly muted */
        "accent-gold":    "hsl(43, 78%, 50%)",

        /* ── Utility ── */
        error:          "hsl(0, 72%, 51%)",       /* Not pure #EF4444 — slightly muted */
        "sticky-yellow": "hsl(48, 100%, 96%)",   /* Warm parchment for sticky notes */
      },
      boxShadow: {
        /* Neutral-only shadows — no colored shadows per design system */
        "bespoke-sm": "0 1px 2px hsla(222, 20%, 15%, 0.06)",
        "bespoke-md": "0 4px 12px hsla(222, 20%, 15%, 0.08)",
        "bespoke-lg": "0 8px 24px hsla(222, 20%, 15%, 0.10)",
        /* Kept for legacy compatibility — use bespoke-* for new work */
        "brutal-sm": "2px 2px 0px hsl(224, 36%, 25%)",
        "brutal-md": "4px 4px 0px hsl(224, 36%, 25%)",
        "brutal-lg": "8px 8px 0px hsl(224, 36%, 25%)",
      },
      borderRadius: {
        /* 4px base grid system */
        "4":  "4px",
        "8":  "8px",
        "12": "12px",
        "16": "16px",
        "24": "24px",
        "32": "32px",
        "40": "40px",
        "48": "48px",
      },
      transitionTimingFunction: {
        /* Quadratic and quintic curves — not default ease/linear */
        bespoke:        "cubic-bezier(0.16, 1, 0.3, 1)",
        spring:         "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        snap:           "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-quint":    "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out-quad":  "cubic-bezier(0.45, 0, 0.55, 1)",
      },
      animation: {
        "fade-in":       "fade-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-up":       "fade-up 0.38s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-right": "fade-in-right 0.32s cubic-bezier(0.16, 1, 0.3, 1) both",
        "sheet-up":      "sheet-up 0.44s cubic-bezier(0.16, 1, 0.3, 1) both",
        "drawer-up":     "drawer-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-bounce":  "scale-bounce 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "shake":         "shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
        "pulse-soft":    "pulse-soft 2s cubic-bezier(0.45, 0, 0.55, 1) infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-right": {
          from: { opacity: "0", transform: "translateX(14px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "sheet-up": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "drawer-up": {
          from: { opacity: "0", transform: "translateY(12%)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-bounce": {
          "0%":   { opacity: "0", transform: "scale(0.82)" },
          "60%":  { opacity: "1", transform: "scale(1.03)" },
          "100%": {               transform: "scale(1.00)" },
        },
        "shake": {
          "10%, 90%":      { transform: "translate3d(-2px, 0, 0)" },
          "20%, 80%":      { transform: "translate3d(4px, 0, 0)" },
          "30%, 50%, 70%": { transform: "translate3d(-5px, 0, 0)" },
          "40%, 60%":      { transform: "translate3d(5px, 0, 0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.65" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
