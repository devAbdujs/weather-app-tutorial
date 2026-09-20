# Temari — Ethiopian Exam Practice Platform

> AI-powered exam prep for Ethiopian students: EUEE, University Freshman & Exit exams.

Temari is a Telegram Mini App and PWA that helps Ethiopian students practice past-paper questions, track their mastery by subject, and get instant AI explanations — all in a mobile-first interface that feels like a native app.

**Live app:** [temari.top](https://temari.top)  
**Telegram bot:** [@toptemari_bot](https://t.me/toptemari_bot)

---

## What it does

- **31,000+ real past-paper questions** across Grade 12 EUEE, University Freshman, and University Exit exams
- **Timed exam simulator** with full answer reveal, explanations, and a question grid
- **AI Tutor** (Gemini) that explains any question on demand, with per-question rate limiting and key rotation
- **Scholar Tree** — a mastery system that tracks correct answers per subject and levels them up
- **Study Notes** — AI-generated summaries and chapter highlights, pinnable to a personal notebook
- **Daily streak** system and motivational AI tips to keep students consistent
- **Telegram-native auth** via Mini App initData, OIDC flow, or Web Widget — zero passwords

---

## Screenshots

> _Add 2–3 screenshots here. Drag images into this file or use Markdown image syntax._

```
![Home Dashboard](docs/screenshots/home.png)
![Exam Session](docs/screenshots/exam.png)
![Scholar Tree](docs/screenshots/mastery.png)
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Database | [Supabase](https://supabase.com) (Postgres + RLS) |
| Styling | [Tailwind CSS](https://tailwindcss.com) + custom CSS variables |
| AI | [Google Gemini](https://ai.google.dev) via AI SDK |
| Auth | Telegram Mini App initData + OIDC + Web Widget |
| State | [Zustand](https://zustand-demo.pmnd.rs) |
| Math rendering | [KaTeX](https://katex.org) |
| Offline cache | [localforage](https://localforage.github.io/localForage/) (IndexedDB) |
| Deployment | [Vercel](https://vercel.com) |
| Image CDN | [Cloudinary](https://cloudinary.com) |

---

## Run locally

**Prerequisites:** Node.js 18+, npm, a Supabase project, a Telegram bot

### 1. Clone and install

```bash
git clone <repo-url>
cd ethio-exam-app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in every variable in `.env.local` — see the [Environment variables](#environment-variables) section below.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Tip:** Telegram Mini App features (initData auth, haptics, back button) only work inside Telegram. Use the dev mode bypass (`devMode: true`) for local testing — see `src/app/api/auth/session/route.ts`.

### 4. (Optional) Run type checks

```bash
npx tsc --noEmit
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `TELEGRAM_BOT_TOKEN` | ✅ | Bot token from @BotFather |
| `NEXT_PUBLIC_BOT_USERNAME` | ✅ | Bot username without @ |
| `NEXT_PUBLIC_TELEGRAM_CLIENT_ID` | ✅ | Telegram OIDC client ID (bot numeric ID) |
| `TELEGRAM_CLIENT_SECRET` | ✅ | Telegram OIDC client secret |
| `gemini_api_key1` … `gemini_api_keyN` | ✅ | Gemini API keys — add as many as you have |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | optional | Cloudinary API key (admin upload) |
| `CLOUDINARY_API_SECRET` | optional | Cloudinary API secret (admin upload) |
| `NEXT_PUBLIC_SITE_URL` | optional | Production URL (for OIDC redirects) |
| `DATABASE_URL` | optional | Postgres connection string (for CLI migrations) |

See `.env.example` for the full annotated list.

---

## Folder structure

```
ethio-exam-app/
├── public/
│   ├── assets/question_images/   # 200+ question diagram PNGs
│   ├── icons/                    # PWA icons
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
├── src/
│   ├── app/
│   │   ├── (app)/                # Authenticated route group
│   │   │   ├── page.tsx          # Home dashboard
│   │   │   ├── practice/         # Practice hub + session picker
│   │   │   ├── exam/session/     # Live exam session
│   │   │   ├── mastery/          # Scholar Tree page
│   │   │   ├── notes/[subject]/  # Study notes viewer
│   │   │   ├── notebook/[subject]/# Pinned notes viewer
│   │   │   └── profile/          # User profile
│   │   ├── api/
│   │   │   ├── ai/               # Gemini endpoints (tutor, quiz, tip)
│   │   │   ├── auth/             # Auth endpoints (session, telegram, OIDC)
│   │   │   ├── bot/webhook/      # Telegram bot webhook
│   │   │   ├── exam/submit/      # Exam result submission
│   │   │   ├── pins/             # Notebook pin CRUD
│   │   │   └── admin/notes/      # Admin note upload
│   │   ├── admin/                # Admin dashboard (separate auth)
│   │   └── actions/              # Next.js Server Actions
│   ├── components/
│   │   ├── ai/                   # AITutorDrawer
│   │   ├── admin/                # Admin UI components
│   │   ├── auth/                 # ClientAuthDetector, StoreInitializer
│   │   ├── dashboard/            # Home, Mastery, Profile, Notes, Onboarding
│   │   ├── exam/                 # ExamWorkspace, ExamSessionLoader, ExamTimer
│   │   ├── flashcards/           # FlashcardDeck
│   │   ├── layout/               # BottomNav, DashboardShell, TopHeader, PWARegistry
│   │   ├── marketing/            # LandingPage (unauthenticated web view)
│   │   ├── navigation/           # ProductTour
│   │   ├── practice/             # PracticeHub
│   │   └── ui/                   # SkeletonScreen, shared atoms
│   ├── hooks/
│   │   ├── useTelegram.ts        # Telegram WebApp SDK wrapper + haptics
│   │   └── useTheme.ts           # Dark/light/system theme manager
│   ├── lib/
│   │   ├── cache.ts              # IndexedDB question cache (localforage)
│   │   ├── geminiKeyRotation.ts  # Round-robin Gemini key manager
│   │   ├── pkce.ts               # PKCE helpers for OIDC flow
│   │   ├── rateLimiter.ts        # Sliding-window in-memory rate limiter
│   │   ├── session.ts            # AES-GCM encrypted HTTP-only session cookies
│   │   ├── streak.ts             # Daily streak calculation logic
│   │   └── telegramAuth.ts       # Telegram initData + Web Widget validation
│   ├── store/
│   │   └── useAppStore.ts        # Global Zustand store
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   └── utils/
│       ├── cloudinary.ts         # Cloudinary image URL builder
│       └── supabase/
│           ├── client.ts         # Browser Supabase client
│           ├── server.ts         # Server Supabase client (SSR)
│           └── admin.ts          # Service-role Supabase client
├── __tests__/                    # Unit + integration tests (Jest)
├── .env.example                  # Environment variable template
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branch naming, commit conventions, and PR process.

---

## Architecture & data flow

See [ARCHITECTURE.md](ARCHITECTURE.md) for the system design, auth flows, and AI pipeline.

---

## Database

See [docs/database-schema.md](docs/database-schema.md) for all tables and relationships.

---

## API reference

See [docs/api-routes.md](docs/api-routes.md) for every endpoint.

---

## Maintainer

Built by [@abdusalam](https://t.me/abdusalam). Open an issue or DM on Telegram for questions.
