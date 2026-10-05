import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans', display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top'),
  title: 'Temari | AI Exam Prep & Study Partner',
  description: 'The ultimate exam prep app for Ethiopian students. Practice EUEE (Grade 12), University Freshman, and Exit Exams with AI-powered notes and real past papers.',
  keywords: ['Ethiopia', 'EUEE', 'Grade 12 Entrance Exam', 'Ethiopian University Exit Exam', 'Freshman courses', 'Temari App', 'Ethiopian exam prep'],
  authors: [{ name: 'Temari' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/temari_icon_192.png',
    apple: '/assets/temari_icon.png',
  },
  openGraph: {
    title: 'Temari | AI Exam Prep & Study Partner',
    description: 'Practice 31,000+ real exam questions for EUEE, Freshman & Exit Exams with AI.',
    url: 'https://www.temari.top',
    siteName: 'Temari App',
    images: [
      {
        url: '/assets/New_temari_logo.png',
        width: 371,
        height: 219,
        alt: 'Temari Exam Prep & AI Tutor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Temari | AI Exam Prep & Study Partner',
    description: 'Master your Ethiopian National Exams with AI-powered notes and practice papers.',
    images: ['/assets/New_temari_logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

import { Suspense } from 'react';
import Loading from './loading';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from 'sonner';

// Inline script — runs before paint to prevent FOUC.
// Reads localStorage 'theme' or falls back to system preference.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    // Apply Telegram theme colors to CSS variables if in Mini App
    if (window.Telegram && window.Telegram.WebApp) {
      var tg = window.Telegram.WebApp;
      var params = tg.themeParams;
      var doc = document.documentElement;
      var tgBg = tg.backgroundColor || (params && params.bg_color);
      if (tgBg) doc.style.backgroundColor = tgBg;
      if (params) {
        if (params.bg_color) doc.style.setProperty('--tg-theme-bg-color', params.bg_color);
        if (params.secondary_bg_color) doc.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color);
        if (params.text_color) doc.style.setProperty('--tg-theme-text-color', params.text_color);
        if (params.hint_color) doc.style.setProperty('--tg-theme-hint-color', params.hint_color);
        if (params.link_color) doc.style.setProperty('--tg-theme-link-color', params.link_color);
        if (params.button_color) doc.style.setProperty('--tg-theme-button-color', params.button_color);
        if (params.button_text_color) doc.style.setProperty('--tg-theme-button-text-color', params.button_text_color);
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC theme script — must run synchronously before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} font-sans bg-ground text-foreground min-h-screen antialiased overscroll-none`}>
        <Toaster position="top-center" toastOptions={{ className: 'font-sans font-bold shadow-2xl rounded-2xl border-none' }} />
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
