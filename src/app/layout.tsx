import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';
import 'katex/dist/katex.min.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Temari | Ethiopian Exam Prep & AI Tutor',
  description: 'The ultimate exam prep app for Ethiopian students. Practice EUEE (Grade 12), University Freshman, and Exit Exams with AI-powered notes and real past papers.',
  keywords: ['Ethiopia', 'EUEE', 'Grade 12 Entrance Exam', 'Ethiopian University Exit Exam', 'Freshman courses', 'Temari App', 'Ethiopian exam prep'],
  authors: [{ name: 'Temari' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Temari | Ethiopian Exam Prep',
    description: 'Practice 31,000+ real exam questions for EUEE, Freshman & Exit Exams with AI.',
    url: 'https://www.temari.top',
    siteName: 'Temari App',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Temari | Ethiopian Exam Prep',
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

import { getServerSession } from '@/lib/session';
import { createClient } from '@/utils/supabase/server';
import { ClientAuthDetector } from '@/components/auth/ClientAuthDetector';
import { StoreInitializer } from '@/components/auth/StoreInitializer';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PWARegistry } from '@/components/layout/PWARegistry';

import { Suspense } from 'react';
import Loading from './loading';

async function AppContent({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  
  if (!session) {
    return <ClientAuthDetector />;
  }
  
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_streak, target_exam, stream')
    .eq('telegram_id', session.telegram_id)
    .single();

  const formattedProfile = {
    telegram_id: session.telegram_id,
    first_name: session.first_name,
    target_exam: profile?.target_exam || null,
    stream: profile?.stream || '',
    daily_streak: profile?.daily_streak || 0,
  };

  return (
    <DashboardShell>
      <StoreInitializer profile={formattedProfile} />
      {children}
    </DashboardShell>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Telegram WebApp Script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (window.Telegram && window.Telegram.WebApp) {
                  const tgBg = window.Telegram.WebApp.backgroundColor || window.Telegram.WebApp.themeParams.bg_color;
                  if (tgBg) {
                    document.documentElement.style.backgroundColor = tgBg;
                    document.documentElement.style.setProperty('--background', tgBg);
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${geistSans.className} bg-ground text-primary min-h-screen antialiased selection:bg-accent-blue selection:text-white overscroll-none`}>
        <PWARegistry />
        <Suspense fallback={<Loading />}>
          <AppContent>{children}</AppContent>
        </Suspense>
      </body>
    </html>
  );
}
