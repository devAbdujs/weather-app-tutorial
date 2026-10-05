# Architecture — Temari

This document describes the high-level system design, multi-subdomain routing, dual-layer caching, auth flows, and AI pipeline.

---

## System Overview & Multi-Subdomain Architecture

Temari operates a multi-tenant exam platform across dedicated subdomains, sharing a unified database, authentication session, and design tokens:

```
┌────────────────────────────────────────────────────────────────────────┐
│                                CLIENTS                                 │
│                                                                        │
│  ┌──────────────────────┐   ┌────────────────────────────────────────┐ │
│  │  Telegram Mini App   │   │  Web Browsers (Subdomains & PWA)       │ │
│  │  (Android / iOS / PC)│   │  • entrance.temari.top (Grade 12 EUEE) │ │
│  │                      │   │  • freshman.temari.top (University)    │ │
│  │                      │   │  • exit.temari.top (National Exit)     │ │
│  │                      │   │  • temari.top (Hub / Shared Overview)  │ │
│  └──────────┬───────────┘   └───────────────────┬────────────────────┘ │
│             │ initData auth                     │ OIDC / Web Widget    │
└─────────────┼───────────────────────────────────┼──────────────────────┘
              │                                   │
              ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 App Router (Vercel)                       │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Edge Middleware (src/middleware.ts)                             │  │
│  │  • Host-based subdomain extraction (`x-subdomain` header)        │  │
│  │  • Wildcard cookie scoping (`.temari.top`) for SSO auth          │  │
│  │  • Canonical 308 redirects for naked domain / legacy routes      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Route Groups & Server-Rendered Hubs                             │  │
│  │  (app)/(public)/page.tsx     — High-converting Landing + Mockup  │  │
│  │  (app)/(protected)/*         — Auth-guarded student dashboard    │  │
│  │  • /dashboard, /practice, /exam/session, /notes, /mastery        │  │
│  │  /admin/*                    — Scoped sub-admin management       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Dual-Layer Caching & Data Acceleration                          │  │
│  │  • L1 Cache: Upstash Redis (Distributed rate limits & counters)  │  │
│  │  • L2 Cache: Supabase `ai_responses_cache` (Instant AI answers)  │  │
│  │  • Client Cache: IndexedDB via localforage (Offline simulator)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  API Routes & Background Schedulers                              │  │
│  │  POST /api/auth/session       — Mini App + Web Widget auth       │  │
│  │  POST /api/auth/oidc          — Telegram OIDC PKCE exchange      │  │
│  │  POST /api/ai/tutor           — Streaming Gemini tutor           │  │
│  │  POST /api/payments/submit    — CBE / Telebirr receipt OCR       │  │
│  │  GET  /api/payments/status    — Real-time approval polling       │  │
│  │  GET  /api/highlights         — User note highlight sync         │  │
│  │  POST /api/bot/webhook        — Telegram bot event pipeline      │  │
│  │  GET  /api/cron/streak-reminder — 20:00 EAT streak nudge cron    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴────────────────────────┐
          ▼                                                  ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│  Supabase (PostgreSQL + RLS)    │   │  External Cloud Services         │
│  • profiles (streak, AI quota)  │   │  • Google Gemini API (3.8-flash) │
│  • questions (31,000+ bank)     │   │    Vision OCR + Tutoring         │
│  • payment_receipts             │   │  • Upstash Redis (L1 rate limit) │
│  • study_notes (paywall-locked) │   │  • Telegram Bot API              │
│  • user_subject_stats           │   │    Webhooks, deep-links, alerts  │
│  • admin_audit_logs             │   │  • Vercel Edge Network           │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

---

## Caching Hierarchy

To maximize performance under unstable mobile networks (2G/3G in Ethiopia) while capping Gemini API costs:

1. **Client Level (Offline-First):**
   - Questions and chapter drills are cached in browser `IndexedDB` (`localforage`).
   - If internet connectivity drops mid-test, `src/utils/offlineSync.ts` stores answers and synchronizes progress upon reconnection.
2. **Edge L1 Cache (Upstash Redis):**
   - High-frequency rate limits (Auth brute force, AI quota requests, OCR uploads).
   - Instant in-memory counters shared across all serverless Vercel function instances.
3. **Database L2 Cache (`ai_responses_cache`):**
   - When a student asks the AI Tutor to explain, simplify (`eli5`), translate (`amharic`), or hint a popular exam question, the rendered markdown/KaTeX response is saved in `ai_responses_cache(question_id, prompt_type)`.
   - Subsequent students asking the same prompt receive instant (sub-50ms) cached answers without burning Gemini API tokens.

---

## Telegram Bot Pipeline & Webhook Architecture

The Telegram Bot (`@toptemari_bot`) is tightly coupled to the application via `POST /api/bot/webhook`:

1. **Channel Verification & Mandatory Join:**
   - Bot verifies student membership in `@temari_App` using `getChatMember`.
2. **Deep-Linking Engine:**
   - `ref_<telegram_id>` — tracks viral referral signups and grants bonus study days.
   - `track_<exam_type>` — routes new users directly to their target exam track (`entrance`, `freshman`, `exit`).
   - `q_<question_id>` — opens the Mini App directly to an individual question.
3. **Automated Cron Nudges:**
   - Vercel Cron triggers `/api/cron/streak-reminder` daily at 20:00 EAT to alert active students at risk of breaking their streak.
4. **Milestone Celebrations:**
   - Generates ASCII trophy cards for streak milestones (7, 14, 30 days) and questions solved (50, 100, 500 Qs).
5. **AI Quota Telegram Upsell:**
   - When free-tier users exhaust their 15-question weekly AI quota, a friendly conversational bot message guides them to upgrade via Telebirr or CBE.

---

## Security Model & Sub-Admin Delegation

1. **Session Security:**
   - Custom AES-GCM encrypted HTTP-only `es_session` cookie valid for 30 days.
   - OIDC code exchange enforces server-side `redirect_uri` construction to prevent open redirect vulnerabilities.
2. **Row Level Security (RLS):**
   - `anon` access is strictly revoked on `study_notes`, `payment_receipts`, and `profiles`.
   - All mutations run through `createAdminClient()` (Service Role) inside authenticated Server Actions.
3. **4-Tier Sub-Admin Delegation:**
   - `superadmin`: Full unrestricted control across users, payments, and system settings.
   - `financial_admin`: Restricted to `/admin/payments`, Telebirr/CBE verification, and student subscription upgrades.
   - `content_editor`: Restricted to Note Studio (`/admin/upload-notes`) and Question Studio (`/admin/questions`).
   - `reviewer` & `readonly`: Read-only curriculum quality audit.
4. **Audit Logging:**
   - Every administrative mutation (payment approval, question creation/deletion, account deactivation) is logged with timestamp, admin ID, and metadata into `admin_audit_logs`.
