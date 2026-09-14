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
  title: 'Ethio Scholar — Ethiopian Exam Prep',
  description: 'The ultimate exam prep app for Ethiopian students. Practice EUEE, University Freshman, and Exit Exams.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ethio Scholar — Ethiopian Exam Prep',
    description: 'Practice 31,000+ real exam questions for EUEE, Freshman & Exit Exams.',
    type: 'website',
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  let content;
  if (!session) {
    // Show Landing Page or handle Mini App silent login
    content = <ClientAuthDetector />;
  } else {
    // Fast server-side profile fetch for the entire app!
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_streak, target_exam, stream')
      .eq('id', session.profile_id)
      .single();

    const formattedProfile = {
      telegram_id: session.telegram_id,
      first_name: session.first_name,
      target_exam: profile?.target_exam || null,
      stream: profile?.stream || '',
      daily_streak: profile?.daily_streak || 0,
    };

    content = (
      <DashboardShell>
        <StoreInitializer profile={formattedProfile} />
        {children}
      </DashboardShell>
    );
  }

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
        {content}
      </body>
    </html>
  );
}
