# Architecture — Temari

This document describes the high-level system design, data flows, and key technical decisions.

---

## System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│                                                                 │
│  ┌───────────────────┐       ┌─────────────────────────────┐   │
│  │  Telegram Mini App │       │  Web browser (temari.top)   │   │
│  │  (iOS / Android)   │       │  (PWA-installable)          │   │
│  └────────┬──────────┘       └──────────────┬──────────────┘   │
│           │ initData auth                    │ OIDC or Widget   │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            ▼                                  ▼
┌───────────────────────────────────────────────────────────────┐
│                   Next.js App (Vercel)                         │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Route Groups                                           │  │
│  │  (app)/(public)/page.tsx     — High-converting Landing  │  │
│  │  (app)/(protected)/*         — Protected authenticated  │  │
│  │  • /dashboard, /practice, /exam/session, /profile       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  API Routes                                              │  │
│  │  POST /api/auth/session       — Mini App + Web Widget    │  │
│  │  POST /api/auth/oidc          — Telegram OIDC code flow  │  │
│  │  GET /auth/callback           — OIDC redirect handler    │  │
│  │  POST /api/ai/tutor           — Streaming AI explanation │  │
│  │  POST /api/ai/quiz            — AI quiz generation       │  │
│  │  POST /api/ai/tip             — Daily motivational tip   │  │
│  │  POST /api/exam/submit        — Save exam stats          │  │
│  │  GET|POST|DELETE /api/pins    — Notebook pin CRUD        │  │
│  │  POST /api/bot/webhook        — Telegram bot handler     │  │
│  │  POST /api/admin/notes        — Admin note upload        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────┐   ┌──────────────────────────────┐  │
│  │   Server Actions     │   │   Lib / Utilities            │  │
│  │ • updateProfilePrefs │   │ • session.ts (AES-GCM)       │  │
│  │ • toggleSavedMistake │   │ • geminiKeyRotation.ts       │  │
│  │ • updateDailyStreak  │   │ • rateLimiter.ts             │  │
│  │ • getSavedMistakes   │   │ • telegramAuth.ts            │  │
│  │ • logout             │   │ • cache.ts (IndexedDB)       │  │
│  └──────────────────────┘   └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
            │                        │
            ▼                        ▼
┌─────────────────────┐   ┌──────────────────────────────────────┐
│  Supabase (Postgres) │   │  Google Gemini API                   │
│  • profiles          │   │  Multiple keys, round-robin rotation │
│  • questions         │   │  Models: gemini-1.5-flash-8b         │
│  • study_notes       │   │          gemini-3.6-flash            │
│  • user_subject_stats│   └──────────────────────────────────────┘
│  • saved_mistakes    │
│  • user_pins         │   ┌──────────────────────────────────────┐
│  • otp_codes         │   │  n8n Backend (Local / Cloudflare)    │
│  • admin_users       │   │  Automates PDF Ingestion via Gemini  │
│  • flashcards        │   │  and Telegram CRM workflows          │
└─────────────────────┘   └──────────────────────────────────────┘
```

---

## Main folders and their purpose

| Path | Purpose |
|---|---|
| `src/app/(app)/(protected)/` | Authenticated page routes — all protected by `layout.tsx` which checks the session cookie server-side |
| `src/app/(app)/(public)/` | Unauthenticated / Landing pages. |
| `src/app/api/` | API route handlers — REST endpoints consumed by client components |
| `src/app/actions/` | Next.js Server Actions — called directly from client components, run on the server |
| `src/app/admin/` | Admin dashboard — separate auth system using base64-encoded admin session cookie |
| `src/components/` | Reusable React components (UI, Auth, Exam, Practice, Dashboard) |
| `src/lib/` | Core backend utilities (encryption, session, cache, gemini rotation) |

---

## Security (RLS) & Auth
Auth is heavily customized. Temari uses a custom AES-GCM encrypted HTTP-only session cookie (`es_session`) instead of standard Supabase Auth to seamlessly bridge the Telegram Mini App and Web environments.

Because `es_session` hides user identity from the Supabase client, the Postgres database is completely locked down using strict **Row Level Security (RLS)**. 
- The `anon` role is explicitly DENIED from all `INSERT`/`UPDATE`/`DELETE` operations.
- All mutations are handled securely by Next.js Server Actions and API routes running with the Supabase Service Role key.

---

## Offline PWA architecture

To combat unstable Ethiopian network conditions:
1. `ExamSessionLoader.tsx` heavily leverages Next.js Server Components for instantaneous initial loads.
2. `IndexedDB` (`localforage`) is used to store fetched exam questions.
3. If the user disconnects mid-exam, the offline Service Worker serves the cached app shell, and `utils/offlineSync.ts` queues the score submission until a network connection is re-established.
