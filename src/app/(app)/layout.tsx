import React from 'react';
import Script from 'next/script';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Telegram WebApp SDK — loaded for student and app routes, skipped on /admin (L-08) */}
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
