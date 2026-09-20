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
│  │  Route Group: (app)/   — requires valid es_session       │  │
│  │  • / (Home + Dashboard)                                  │  │
│  │  • /practice → /practice/sessions → /exam/session        │  │
│  │  • /mastery     /notes/:subject    /notebook/:subject     │  │
│  │  • /profile                                              │  │
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
│  • otp_codes         │   │  Cloudinary CDN                      │
│  • admin_users       │   │  Question diagram images             │
│  • flashcards        │   │  f_auto + q_auto transformations      │
└─────────────────────┘   └──────────────────────────────────────┘
```

---

## Main folders and their purpose

| Path | Purpose |
|---|---|
| `src/app/(app)/` | Authenticated page routes — all protected by `AppLayout` which checks the session cookie server-side |
| `src/app/api/` | API route handlers — REST endpoints consumed by client components |
| `src/app/actions/` | Next.js Server Actions — called directly from client components, run on the server |
| `src/app/admin/` | Admin dashboard — separate auth system using base64-encoded admin session cookie |
| `src/components/` | All React components, organized by feature domain |
| `src/hooks/` | Reusable client-side hooks (`useTelegram`, `useTheme`) |
| `src/lib/` | Pure server-side utilities: session encryption, rate limiting, Gemini key management |
| `src/store/` | Global Zustand state: user profile, modal state, dev mode flag |
| `src/types/` | Shared TypeScript interfaces mirroring Supabase table shapes |
| `src/utils/supabase/` | Three Supabase client factories: `client` (browser), `server` (SSR), `admin` (service role) |
| `public/assets/question_images/` | 200+ static PNG diagrams referenced by question records |

---

## Data flow: user → question → result

```
User opens app
    │
    ▼
AppLayout (server component)
    │  reads encrypted es_session cookie
    │  no session → renders ClientAuthDetector
    │  session found → renders DashboardShell + StoreInitializer
    ▼
Home → Practice → Sessions page
    │  calls getSessionCounts() server action
    │  counts questions in Supabase matching filters
    ▼
ExamSessionLoader (client component)
    │  checks IndexedDB cache (localforage) for this exact session slice
    │  cache miss → queries Supabase questions table with range()
    │  writes result to IndexedDB for 7-day offline use
    ▼
ExamWorkspace
    │  renders questions one by one
    │  tracks answers, flagged questions, bookmarks
    │  on finish → POST /api/exam/submit → upserts user_subject_stats
    │
    └── Ask AI button → AITutorDrawer
            │  POST /api/ai/tutor
            │  getNextGeminiKey() → round-robin key selection
            │  streams response via Vercel AI SDK
            ▼
        AIResponse renders streamed markdown with KaTeX math
```

---

## Auth flow: Telegram Mini App

```
User opens Temari via Telegram bot
    │
    ▼
Telegram injects window.Telegram.WebApp.initData
    │
    ▼
ClientAuthDetector (client component)
    │  detects initData present
    │  POST /api/auth/session { initData }
    │
    ▼
/api/auth/session (server)
    │  validates HMAC-SHA256 signature of initData
    │  using HMAC("WebAppData", BOT_TOKEN)
    │  extracts user object from initData
    │  upserts profile into Supabase
    │  creates AES-GCM encrypted session payload
    │  sets HttpOnly cookie: es_session (30 days)
    │
    ▼
window.location.replace('/') → App loads authenticated
```

## Auth flow: Web browser (OIDC)

```
User visits temari.top → no session → LandingPage
    │
    ▼
"Login with Telegram" button
    │  generates PKCE code_verifier + code_challenge
    │  stores verifier in sessionStorage
    │  redirects to oauth.telegram.org with code_challenge
    │
    ▼
User authorizes on Telegram
    │  Telegram redirects to /auth/callback?code=...&state=...
    │
    ▼
/auth/callback page (client component)
    │  POST /api/auth/oidc { code, code_verifier, redirect_uri }
    │
    ▼
/api/auth/oidc (server)
    │  exchanges code at oauth.telegram.org/token with Basic auth
    │  decodes id_token JWT payload (no signature check needed — TLS)
    │  extracts telegram_id, name, phone
    │  upserts profile in Supabase
    │  creates encrypted session cookie
    │
    ▼
window.location.replace('/') → App loads authenticated
```

---

## AI flow: Gemini integration + key rotation

```
Client: POST /api/ai/tutor { messages, question }
    │
    ▼
getServerSession() — verify auth
checkRateLimit(ip, 3, 60000) — 3 req/min per IP
    │
    ▼
getNextGeminiKey()
    │  round-robin across all gemini_api_key* env vars
    │  skips keys in 60s cooldown window (after 429)
    │  returns null if all keys exhausted
    │
    ▼
createGoogleGenerativeAI({ apiKey }) → streamText()
    │  on 429 error: markKeyRateLimited(key) → retry with next key
    │  max 3 attempts (or number of keys, whichever is smaller)
    │
    ▼
stream.toTextStreamResponse() → client receives chunked text
    │
    ▼
AIResponse component renders streamed markdown incrementally
```

---

## Security model

| Concern | Approach |
|---|---|
| Telegram auth | HMAC-SHA256 validation of initData or Web Widget hash |
| Session tokens | AES-GCM encrypted, stored in HttpOnly + SameSite cookie |
| Database access | Service role key only on server; anon key on client with RLS |
| Admin access | Separate base64 session checked against `admin_users` table |
| AI abuse | Per-IP sliding-window rate limiter + Gemini's own quota |
| Replay attacks | initData auth_date checked (rejects if > 24h old) |

---

## Known constraints and technical debt

| Issue | Impact | Notes |
|---|---|---|
| In-memory rate limiter | Rate limiting resets on cold start; ineffective across multiple Vercel instances | Replace `src/lib/rateLimiter.ts` Map with Upstash Redis when scaling |
| `ignoreBuildErrors: true` in next.config.js | TypeScript errors don't fail production builds | Remove once all type errors are resolved |
| Phone auth route (`/api/auth/phone`) | PIN verification is bypassed (comment in code) — route is experimental | Either complete or remove |
| Admin auth is base64 | Not production-grade for high-security admin | Replace with proper JWT or Supabase Auth admin role |
| No question image alt text | Accessibility gap for screen readers | Add descriptive alt text to question images |
| Flashcard deck has no spaced repetition | Cards repeat randomly | Implement SM-2 or similar algorithm |
| E2E tests are sparse | Only one Playwright test exists | Expand coverage across auth, exam, and AI flows |
