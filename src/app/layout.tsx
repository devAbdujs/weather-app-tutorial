import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans', display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Temari | AI Exam Prep & Study Partner',
  description: 'The ultimate exam prep app for Ethiopian students. Practice EUEE (Grade 12), University Freshman, and Exit Exams with AI-powered notes and real past papers.',
  keywords: ['Ethiopia', 'EUEE', 'Grade 12 Entrance Exam', 'Ethiopian University Exit Exam', 'Freshman courses', 'Temari App', 'Ethiopian exam prep'],
  authors: [{ name: 'Temari' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Temari | AI Exam Prep & Study Partner',
    description: 'Practice 31,000+ real exam questions for EUEE, Freshman & Exit Exams with AI.',
    url: 'https://www.temari.top',
    siteName: 'Temari App',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Temari | AI Exam Prep & Study Partner',
    description: 'Master your Ethiopian National Exams with AI-powered notes and practice papers.',
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
    // Apply Telegram theme color if in Mini App
    if (window.Telegram && window.Telegram.WebApp) {
      var tgBg = window.Telegram.WebApp.backgroundColor || (window.Telegram.WebApp.themeParams && window.Telegram.WebApp.themeParams.bg_color);
      if (tgBg) document.documentElement.style.backgroundColor = tgBg;
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
        {/* Telegram WebApp SDK */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${geistSans.variable} font-sans bg-ground text-gray-900 dark:text-gray-100 min-h-screen antialiased overscroll-none`}>
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
