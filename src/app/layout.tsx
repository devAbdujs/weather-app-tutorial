import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import 'katex/dist/katex.min.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EthioExam Master — Ethiopian Entrance & University Exam Prep',
  description: 'The definitive offline-ready exam simulator and study vault for Ethiopian students.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Telegram WebApp Script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white overscroll-none`}>
        {children}
      </body>
    </html>
  );
}
