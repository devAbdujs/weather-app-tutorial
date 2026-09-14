import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Dashboard - Calm & Structural */
        ground:   "hsl(220 15% 96% / <alpha-value>)",
        panel:    "hsl(220 15% 98% / <alpha-value>)",
        card:     "hsl(0 0% 100% / <alpha-value>)",

        /* Typography */
        primary:   "hsl(220 20% 20% / <alpha-value>)",
        secondary: "hsl(220 15% 40% / <alpha-value>)",
        tertiary:  "hsl(220 15% 60% / <alpha-value>)",

        /* Neobrutalist Borders */
        brutal: "#1a1a1a",

        /* Accents */
        "accent-blue":    "hsl(217 89% 61% / <alpha-value>)",
        "accent-amber":   "hsl(38 95% 57% / <alpha-value>)",
        "accent-emerald": "hsl(160 64% 52% / <alpha-value>)",
        "accent-rose":    "hsl(353 86% 64% / <alpha-value>)",

        "error": "#ff0000",

        /* Sticky Notes */
        "sticky-yellow": "hsl(45 90% 85% / <alpha-value>)",
      },
      boxShadow: {
        "brutal-sm": "2px 2px 0px #1a1a1a",
        "brutal-md": "4px 4px 0px #1a1a1a",
        "brutal-lg": "8px 8px 0px #1a1a1a",
      },
      borderRadius: {
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
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        snap:   "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        "fade-in":       "fade-in 0.28s ease both",
        "fade-up":       "fade-up 0.38s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "fade-in-right": "fade-in-right 0.32s ease both",
        "sheet-up":      "sheet-up 0.42s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "scale-bounce":  "scale-bounce 0.48s cubic-bezier(0.34,1.56,0.64,1) both",
        "shake":         "shake 0.4s cubic-bezier(.36,.07,.19,.97) both",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "sheet-up": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-bounce": {
          "0%":   { opacity: "0", transform: "scale(0.80)" },
          "60%":  { opacity: "1", transform: "scale(1.04)" },
          "100%": {               transform: "scale(1.00)" },
        },
        "shake": {
          "10%, 90%":      { transform: "translate3d(-2px, 0, 0)" },
          "20%, 80%":      { transform: "translate3d(4px, 0, 0)" },
          "30%, 50%, 70%": { transform: "translate3d(-6px, 0, 0)" },
          "40%, 60%":      { transform: "translate3d(6px, 0, 0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
