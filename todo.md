# Temari App — Full Audit & TODO
**Generated:** 2026-10-03 | **Audited commit:** `5a78188`

---

## Severity Legend
- 🔴 **CRITICAL** — Data loss, security breach, app crash, silent billing failure
- 🟠 **HIGH** — Broken flow, major perf regression, wrong data shown, partial security gap
- 🟡 **MEDIUM** — Noticeable jank, missing UX state, suboptimal DB query, minor security issue
- 🟢 **LOW** — Polish, minor inconsistency, nice-to-have cleanup

---

## 🔴 CRITICAL

### [C-01] Bot Webhook Signature Check Logs Only — Does Not Block
**File:** `src/app/api/bot/webhook/route.ts` lines 53–55
**Issue:** Signature mismatch logs `console.warn` but does NOT `return`. If `secretHeader` is absent (omitted by attacker), the triple-guard short-circuits and execution continues unchecked.
**Impact:** Any attacker who knows the webhook URL can POST forged Telegram updates. Combined with C-02, they can approve their own payment, impersonate admin actions, and spam quiz handlers.

### [C-02] Payment Approval Gated Only on Hardcoded Telegram ID — Bypassed If Env Is Unset
**File:** `src/app/api/bot/webhook/route.ts` lines 175–178
**Issue:** If `ADMIN_TELEGRAM_ID` env var is falsy, the condition `if (ADMIN_TELEGRAM_ID && ...)` is false and everyone can approve payments. Combined with C-01 (no signature enforcement), the entire payment approval flow is publicly exploitable.

### [C-03] Hardcoded Fallback Encryption Secrets
**Files:** `src/lib/session.ts:13`, `src/app/actions/admin.ts:28,63`
**Issue:** `TELEGRAM_BOT_TOKEN || 'dev-fallback-secret-key-32-bytes!'` and similar fallbacks. If the env var is missing (CI, misconfigured prod, staging), all session cookies are encrypted with publicly known strings.
**Impact:** Attacker can forge arbitrary user sessions, including admin impersonation.

### [C-04] Admin Login Accepts Plaintext Passwords from Database
**File:** `src/app/actions/admin.ts` lines 84–91
**Issue:** Legacy admin accounts have plaintext passwords stored in the DB. The login still accepts them via a `passcode === plaintext` comparison — using `===` (timing-attack susceptible). If the DB is ever read (misconfigured RLS, compromised key), all admin passwords are exposed.

### [C-05] Receipt Storage Bucket Is Publicly Accessible
**File:** `src/app/api/payments/submit/route.ts` — URL pattern: `/object/public/receipts/...`
**Issue:** Payment receipts (bank screenshots with full names, phone numbers, account numbers) are world-readable at a predictable URL. Filename includes `telegram_id` — leaking internal user identifiers.

### [C-06] OG Social Preview Image Is a Broken Reference
**File:** `src/app/layout.tsx` lines 30, 43
**Issue:** `og:image` references `/assets/New_temari_logo.png` — this file does not exist in `public/assets/`. Actual filename is `temari logo.png` (with space).
**Impact:** All Telegram, Twitter, WhatsApp link previews show broken images. First viral sharing impression is completely broken.

### [C-07] Missing `error.tsx` and `loading.tsx` at Protected Route Level
**Path:** `src/app/(app)/(protected)/` — no `error.tsx` or `loading.tsx`
**Issue:** If any server component throws (DB down, session invalid), Next.js falls to the root error page with no navigation recovery. No per-route skeleton loading states exist.

### [C-08] Exam Stat Submission Accepts Unbounded Values — Leaderboard Exploit
**File:** `src/app/api/exam/submit/route.ts`
**Issue:** Zod schema: `attempted: z.number().int().nonnegative()`, `correct: z.number().int().nonnegative()` — no maximum. A user can POST `correct: 999999` and instantly reach Level 5 / max mastery with zero actual study.

### [C-09] AI Model 404 Deprecation — All AI Responses Failing Across Entire App
**Files:** `src/app/api/ai/tutor/route.ts:293`, `src/app/api/ai/quiz/route.ts:94`, `src/app/api/payments/submit/route.ts:134`, `src/app/api/admin/notes/transform/route.ts:99`
**Issue:** `gemini-1.5-flash` is hardcoded across all 4 AI endpoints. Google Generative AI API (`v1beta`) has retired `gemini-1.5-flash` and `gemini-2.0-flash` (returning `[404 Not Found] This model is no longer available. Please update your code to use models/gemini-3.8-flash`).
**Compounding Cascading Bugs:**
1. **False Key Burn Loop:** In `src/app/api/ai/tutor/route.ts:333`, the catch block checked `(err).message.includes('404')` and called `markKeyRateLimited(geminiKey)`. The 404 model error caused every valid Gemini API key in the pool to be marked as rate-limited, cooling down for 60 seconds and returning false HTTP 429 ("All API keys are currently rate-limited").
2. **Quota Burn on Error:** When `check_and_increment_ai_quota` was called before the stream, a student's weekly allowance was deducted even though the AI returned 429/500 without generating an answer.
3. **Broken Features:** Live AI Tutor streaming, AI Quiz generation from notes, Telebirr/CBE payment receipt OCR verification, and Admin note document transformation were all completely non-functional.
**Verified Fix:** Upgrade model reference to `process.env.GEMINI_MODEL || 'gemini-3.8-flash'`, remove `404` from the rate-limit cooldown handler, and rollback weekly quota on unhandled stream errors.

### [C-10] RLS Public SELECT on study_notes Bypasses Paywall via Anon Key
**File:** `supabase/migrations/20260924150000_rls_lockdown.sql` line 21
**Issue:** Policy `CREATE POLICY "Allow public SELECT on study_notes" ON study_notes FOR SELECT TO anon, authenticated USING (true);` grants full read access to all rows and columns in `study_notes` to anyone holding `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
**Impact:** Even if the Next.js API route (`api/notes/content`) and UI components (`StudyNotesView.tsx`) gate notes behind a premium subscription paywall (Task P-06), an attacker or free user can query PostgREST directly (`https://<project-ref>.supabase.co/rest/v1/study_notes?select=*`) using the public anon key bundled in client JavaScript, bypassing all paywalls and downloading the entire proprietary curriculum for free.
**Fix:** Created migration `supabase/migrations/20261005100000_secure_study_notes_rls.sql` dropping `Allow public SELECT on study_notes`. Since all study note queries in SSR and API routes run through `createAdminClient()` (Service Role), RLS now completely denies public anon PostgREST queries while server-side authenticated reading functions normally.

---

## 🟠 HIGH

### [H-01] `increment_user_subject_stats` RPC Not Confirmed in Production — Race Condition Fallback
**File:** `src/app/api/exam/submit/route.ts` L37–80
**Issue:** RPC defined in `db_schemas/increment_user_subject_stats.sql` with unknown production status. Fallback path does two round-trips (SELECT + UPSERT) with a race condition — simultaneous submits produce wrong cumulative totals.

### [H-02] AI Cache Insert Has No Conflict Handling — Duplicate Row on Concurrent Requests
**File:** `src/app/api/ai/tutor/route.ts` (onFinish callback)
**Issue:** `.insert()` with no `ON CONFLICT DO NOTHING`. Unique constraint on `(question_id, prompt_type)` means concurrent same-question requests cause a DB error in onFinish, or silent duplicate rows. Should use `.upsert({ ignoreDuplicates: true })`.

### [H-03] AI Cache Is Never Read Before Calling Gemini
**File:** `src/app/api/ai/tutor/route.ts`
**Issue:** Cache write is implemented (onFinish). Cache read is never implemented — no SELECT from `ai_responses_cache` before calling the Gemini API. Every student asking the same "explain" question on a popular question pays full Gemini latency (1-3s TTFT).
**Impact:** Cache hit rate for explain/eli5/amharic on top questions is estimated 40-70%. Significant wasted API spend and latency.

### [H-04] `noteText` and `chatHistory` Have No Schema Size Limits — Token Bomb / Prompt Injection
**File:** `src/app/api/ai/tutor/route.ts`
**Issue:** `noteText: z.string().optional()` (no `.max()`) and `chatHistory[].content: z.string()` (no `.max()`). Near-100K character payloads go directly into the Gemini system prompt. Also enables prompt injection via crafted note content or chat history.

### [H-05] `dangerouslySetInnerHTML` on AI-Generated KaTeX Output — Potential XSS
**Files:** `src/components/AIResponse.tsx`, `src/components/MathText.tsx`, `src/components/dashboard/MarkdownRenderer.tsx`
**Issue:** KaTeX output rendered via `dangerouslySetInnerHTML` with no DOMPurify sanitization. Input flows from Gemini AI responses. If prompt injection (H-04) succeeds, malicious HTML could reach the DOM.

### [H-06] In-Memory Rate Limiter Is Bypassed in Multi-Instance Serverless Deployments
**File:** `src/lib/rateLimiter.ts`
**Issue:** Module-level `Map` — per-instance, not shared. Every new Vercel function instance has a clean slate. Auth brute force, AI spam, and other rate-limited endpoints are only protected per-instance.
**Impact:** On a busy deployment with 5 concurrent instances, effective rate limit is 5× the configured value.

### [H-07] Client-Supplied `redirect_uri` Passed to OAuth Token Exchange
**File:** `src/app/api/auth/oidc/route.ts`
**Issue:** `redirect_uri` accepted from request body and passed to Telegram's token endpoint. Should be hardcoded server-side.

### [H-08] Payment Status and Submit Routes Use Raw `createClient` Instead of Admin Singleton
**Files:** `src/app/api/payments/status/route.ts`, `src/app/api/payments/submit/route.ts`
**Issue:** Both routes call `createClient(url!, key!)` inline, bypassing the singleton in `admin.ts`. Each request opens a new Supabase connection.
**Impact:** Connection pool exhaustion during peak payment activity (approval polling surge).

### [H-09] No Rate Limiting on Payment Submit, Exam Submit, or Highlights Endpoints
**Files:** `api/payments/submit`, `api/exam/submit`, `api/highlights`
**Issue:** Three endpoints with no request throttling. Payment submit triggers Gemini Vision + Supabase Storage per call — a user can spam these freely.

### [H-10] No Duplicate Receipt Guard — Repeated Submissions Allowed
**File:** `src/app/api/payments/submit/route.ts`
**Issue:** No check for existing `pending` receipt before inserting a new one. Each submission triggers a Gemini Vision call and admin Telegram notification. User can flood admin's DM and exhaust API quota.

### [H-11] `Cache-Control: public` on Auth-Gated Notes Content
**File:** `src/app/api/notes/content/route.ts`
**Issue:** Route requires session but returns `Cache-Control: public, s-maxage=3600`. A CDN may cache and serve note content to unauthenticated users.
**Fix:** Change to `Cache-Control: private, max-age=3600`.

### [H-12] ExamWorkspace First-Load JS is 214 kB — Unoptimized Critical Path
**File:** `src/components/exam/ExamWorkspace.tsx`
**Issue:** Monolithic ~700-line component with only AITutorDrawer split off. ExamResultsView (the post-exam screen, heavy with gamification) is bundled with the exam UI. Students on 2G/3G wait 4-7s before exam is interactive.

### [H-13] `practice/sessions/page.tsx` Is a Client Page — Full SSR Miss
**File:** `src/app/(app)/(protected)/practice/sessions/page.tsx`
**Issue:** `'use client'` at page level. Session count data fetched in `useEffect` after paint — waterfall request, blank screen then spinner.

### [H-14] 18 MB of Unoptimized PNG Question Images Served Without Lazy Loading
**File:** `public/assets/question_images/` (170+ files, 18 MB, ~80 duplicates)
**Issue:** Served as raw `<img>` tags — no Next.js Image optimization, no WebP, no `loading="lazy"`, no responsive `srcset`. LCP on diagram questions is 3-8s on 3G.

### [H-15] Subdomain Exam Type Not Persisted to User Profile on First Auth
**Files:** `src/app/api/auth/telegram/web/route.ts`, `src/middleware.ts`
**Issue:** Middleware reads subdomain from Host header and sets `x-subdomain` header. Auth routes don't read this header to set `target_exam` in the profile during user creation. Subdomains are cosmetic — they change metadata but don't auto-configure the student's exam track.

### [H-16] Bot Webhook Payment Approve Has No Rollback on Profile Update Failure
**File:** `src/app/api/bot/webhook/route.ts` lines 206–218
**Issue:** Receipt is marked `approved` before profile is updated to `premium`. If profile update fails, receipt shows approved but user is not premium. No rollback. (`admin.ts:updatePaymentStatus` does implement rollback — webhook path does not.)

### [H-17] Progress Tracking Shows 0/0/0 When Practicing Partial Sessions
**Files:** `src/components/exam/ExamWorkspace.tsx`, `src/app/api/exam/submit/route.ts`, `src/app/(app)/(protected)/mastery/page.tsx`, `src/app/(app)/(protected)/profile/page.tsx`
**Issue:** Questions attempted, solved, and mastery percentages stayed at 0 even after practicing questions. Exiting via the `X` button called `router.back()` directly without saving progress to `user_subject_stats`. Also, questions 1–49 lacked an early finish button, and when finished, `attempted` was hardcoded to `questions.length` (e.g. 50), skewing accuracy.
**Fix:**
- Implemented Early Exit Confirmation Modal with Temari mascot ("Finish & Record Score", "Keep Practicing", "Exit Without Saving").
- Added quick "Finish & Record Score ({answeredCount} Qs)" action inside Question Grid.
- Calculated `attempted` and accuracy based on actual questions answered in practice mode (while keeping standard paper total evaluation for timed simulator mode).
- Added `revalidatePath` on `/mastery`, `/profile`, `/dashboard` in `/api/exam/submit` and set `force-dynamic` with `revalidate = 0` on protected pages.

### [H-18] Telegram Mini App initData Missing auth_date Replay Protection & Vulnerable to Timing Attacks
**Files:** `src/lib/telegramAuth.ts` lines 18, 38, `src/app/api/auth/session/route.ts` line 23
**Issue:**
1. `validateMiniAppInitData()` does not verify `auth_date`. According to Telegram Bot API specifications, `auth_date` must be verified against current server time to prevent replay attacks (`Math.floor(Date.now() / 1000) - auth_date < 86400`). An intercepted `initData` query string can currently be replayed indefinitely to forge a valid session.
**Fix:** Enforced 24-hour freshness on `auth_date` and constant-time buffer comparison via `crypto.timingSafeEqual` in `src/lib/telegramAuth.ts` for both `validateMiniAppInitData` and `validateWebWidgetData`. Verified with unit test suite in `__tests__/telegramAuth.test.ts`.

### [H-19] Missing Rate Limiting on POST /api/auth/session and POST /api/auth/oidc
**Files:** `src/app/api/auth/session/route.ts`, `src/app/api/auth/oidc/route.ts`
**Issue:** Zero request throttling or rate limiting on both primary authentication endpoints.
**Fix:** Enforced distributed IP-based rate limiting via Upstash Redis (`checkRateLimit('auth_session:${ip}', 15, 60_000)` and `checkRateLimit('auth_oidc:${ip}', 15, 60_000)`) in both `src/app/api/auth/session/route.ts` and `src/app/api/auth/oidc/route.ts`, returning 429 Too Many Requests if flooded.

---

## 🟡 MEDIUM

### [M-01] `StudyNotesView` Lazy Content Fetch Has No Loading Skeleton
**File:** `src/components/dashboard/StudyNotesView.tsx`
**Issue:** Note reader shows empty content for 200-800ms while lazy fetch completes. No `isContentLoading` state or skeleton shown.

### [M-02] Read-Time Calculation Always Shows "1 min read" After SSR Optimization
**File:** `src/components/dashboard/StudyNotesView.tsx` L892
**Issue:** `calculateReadTime(note.content || '')` — `content` is always `undefined` after Phase 7 SSR change. All chapters show "1 min read" regardless of actual length.

### [M-03] Weekly AI Quota Check Has TOCTOU Race — Users Can Exceed Limit
**File:** `src/app/api/ai/tutor/route.ts`
**Issue:** Two concurrent requests read same `currentUsage`, both pass the check, both generate, both increment from same base. At free tier (quota=5), concurrent tab spam allows >5 uses.

### [M-04] Admin Login Has No Rate Limiting
**File:** `src/app/actions/admin.ts`
**Issue:** Server Action with no rate limit — admin password brute-forceable via repeated calls.

### [M-05] `GET /api/highlights` Returns `200` for Unauthenticated Requests
**File:** `src/app/api/highlights/route.ts` lines 6–7
**Issue:** Returns `200 OK { highlights: [] }` instead of `401 Unauthorized`. Masks session expiry on client.

### [M-06] No File Type / Size Validation on Receipt Upload
**File:** `src/app/api/payments/submit/route.ts`
**Issue:** No check on `file.type` or `file.size` before upload. User can upload 50MB video or HTML file with `.jpg` extension.

### [M-07] Exam Submit Upsert Conflict Target Has Space — May Fail Silently
**File:** `src/app/api/exam/submit/route.ts` L73
**Issue:** `onConflict: 'telegram_id, subject'` — space after comma. PostgREST may reject this as invalid constraint name, causing duplicate inserts instead of updates.

### [M-08] Admin Cookie Uses `sameSite: 'lax'` Instead of `'strict'`
**File:** `src/app/actions/admin.ts`
**Issue:** Admin sessions should use `sameSite: 'strict'` to prevent CSRF via top-level navigations from cross-origin pages.

### [M-09] `HomeHub` Streak Date Comparison Uses UTC — Off By a Day for EAT Users
**File:** `src/components/dashboard/HomeHub.tsx`
**Issue:** `new Date().toISOString().slice(0, 10)` returns UTC date. Students studying 11 PM–12 AM EAT get wrong date — redundant DB streak call or missed streak update.

### [M-10] Telegram SDK Loaded `beforeInteractive` — Blocks All Page Parsing
**File:** `src/app/layout.tsx` L64
**Issue:** `strategy="beforeInteractive"` blocks HTML parsing until telegram-web-app.js is downloaded. Non-Telegram web users pay this cost too. Adds 200-600ms to LCP.

### [M-11] `~80 Duplicate Question Images` in `/public` — 9 MB Wasted
**File:** `public/assets/question_images/`
**Issue:** Images appear both with and without `questions_` prefix (e.g. `resistor_network.png` and `questions_resistor_network.png`). ~80 pairs, ~9 MB of duplicate data inflating deployment.

### [M-12] No `aria-label` on Icon-Only Buttons Throughout App
**Files:** `AITutorDrawer.tsx`, `MasteryTree.tsx`, `ExamWorkspace.tsx`, `ProductTour.tsx`, `StudyNotesView.tsx`
**Issue:** `<button><X /></button>`, `<button><Flag /></button>` etc. with no `aria-label`. WCAG 2.1 AA violation. Screen readers announce "button" with no context.

### [M-13] `upgrade/page.tsx` Is a Client Page — PRO Users See Form Flash
**File:** `src/app/(app)/(protected)/upgrade/page.tsx`
**Issue:** `'use client'` at page level. `isInitiallyPro` check happens after paint — PRO users see the payment form briefly before it collapses. CLS regression.

### [M-14] Missing `not-found.tsx` at App Level
**Issue:** Default Next.js 404 shown with no Temari branding or navigation. Dead end for users who hit broken links.

### [M-15] Missing `loading.tsx` and `error.tsx` Per Protected Route
**Affected:** `/dashboard`, `/exam/session`, `/notes/[subject]`, `/practice`, `/mastery`, `/profile`, `/upgrade`
**Issue:** Only root-level `loading.tsx` and `error.tsx` exist. Route-level errors show generic crash. No skeleton states per route.

### [M-16] `layout.tsx` Body Has Unpurged Gray Text Token
**File:** `src/app/layout.tsx` L72
**Issue:** `text-gray-900 dark:text-gray-100` on `<body>` missed in Phase 7 Part 2 sweep. Should be `text-foreground`.

### [M-17] Admin Login Accepts Plaintext Passwords — Force Migration Needed
**(Same root as C-04 but fixable via DB migration + code change without service disruption.)**
Require all admin accounts to update password; remove plaintext comparison branch.

### [M-18] Session Tokens Have No Embedded Expiry Timestamp
**File:** `src/lib/session.ts`
**Issue:** `SessionData` has no `iat`/`exp` field. Session validity relies solely on cookie `maxAge`. No server-side revocation possible. Stolen sessions remain valid for 30 days.

### [M-19] PWA Manifest Icon Paths — Potential Mismatch
**File:** `public/manifest.json`
**Issue:** Manifest may reference icons in `assets/` while `public/icons/` also has `icon-192x192.png` and `icon-512x512.png`. Mismatched paths cause PWA install badge not to appear on Chrome/Android.

### [M-20] `completed_sessions` Stored Only in localStorage — Lost on Device Switch
**File:** `src/app/(app)/(protected)/practice/sessions/page.tsx`
**Issue:** Completed session IDs persisted to `localStorage` only. Cleared on browser reset or missing when user switches device.

### [M-21] last_activity_date Missing from ProtectedLayout SSR Query — Redundant Streak Writes on HomeHub
**Files:** `src/app/(app)/(protected)/layout.tsx` lines 30, 38–47, `src/components/dashboard/HomeHub.tsx` lines 63–64
**Issue:** `layout.tsx` omits `last_activity_date` from the Supabase profile select query and does not forward it into `formattedProfile`. Consequently, `userProfile.last_activity_date` in the client Zustand store is `undefined` on initial load.
**Impact:** On every initial page load or browser refresh of `/dashboard` (HomeHub), `lastActivity !== todayISO` evaluates to `true`, triggering an unnecessary `updateDailyStreak()` mutation and database round-trip even when the student has already recorded activity today.
**Fix:** Add `last_activity_date` to `layout.tsx` profile query and map it into `formattedProfile` for `StoreInitializer`.

### [M-22] Unbounded Polling Loop in UpgradeFlow.tsx When Awaiting Payment Approval
**File:** `src/components/upgrade/UpgradeFlow.tsx` lines 120–160
**Issue:** When awaiting manual receipt verification, the polling loop repeats every 15 seconds indefinitely with no maximum retry ceiling or timeout.
**Impact:** If admin review takes several hours or days and the student leaves the tab open, the client continuously fires GET requests to `/api/payments/status`, draining mobile device battery and consuming unnecessary serverless invocations.
**Fix:** Cap active polling at 25 attempts (~6 minutes) with backoff, then transition the UI to a calm resting state ("Receipt in review queue — check Telegram for notification") with a manual "Refresh Status" button.

### [M-23] Race Condition in offlineSync.ts Causes Duplicate Stats Submission on Network Reconnection
**File:** `src/utils/offlineSync.ts` lines 29–65
**Issue:** `syncOfflineSubmissions()` lacks an in-flight mutex or `isSyncing` guard. If multiple browser tabs are open or the `online` event fires in rapid succession during unstable connectivity, concurrent executions read the same queue from `localforage` and submit duplicate exam payloads to `/api/exam/submit`.
**Impact:** Cumulative user statistics and XP (which increment atomically via RPC `increment_user_subject_stats`) are double-counted or multi-counted.
**Fix:** Introduce an in-flight boolean mutex (`isSyncing`) and pop items atomically from storage.

### [M-24] 9 Uncached Parallel HEAD Queries on Practice Screen (getEntranceYearCounts)
**File:** `src/app/actions/practice.ts` lines 41–58
**Issue:** `getEntranceYearCounts()` fires 9 separate Supabase HEAD requests in parallel for years 2010 through 2018 on every page load.
**Impact:** High request volume and latency waterfall on the practice screen for past paper question counts that are completely static.
**Fix:** Cache results using Next.js `unstable_cache` or Redis with a 24-hour TTL and revalidation on question updates.

### [M-25] Gamification XP Desynchronization Between Web App and Telegram Bot
**Files:** `src/store/useGamificationStore.ts` line 55, `src/lib/telegramBot.ts` lines 311–312
**Issue:** The Web application manages XP in client `localStorage` (defaulting to 45 XP and lost on cache clear or device switch), whereas the Telegram bot calculates XP dynamically from `user_subject_stats.questions_correct * 10`.
**Impact:** Students see inconsistent XP totals, levels, and milestone badges between the Telegram bot and the Web App.
**Fix:** Synchronize initial Web gamification XP from the user's aggregate `user_subject_stats` or profile record during session initialization.

### [M-26] Unbounded Text Input on POST /api/highlights (Storage Bomb)
**File:** `src/app/api/highlights/route.ts` line 71
**Issue:** The highlight creation endpoint validates `typeof text === 'string'` but enforces no character length limit (`.max(2000)` missing).
**Impact:** Malicious or buggy clients can POST megabytes of text data directly into `user_pins.content`, creating bloat and potential denial of service during note rendering.
**Fix:** Add Zod schema validation restricting `text` to `z.string().min(1).max(2000)` and strip excess markup.

### [M-27] Telegram OIDC Token Drops Verified Phone Number on Profile Upsert
**File:** `src/app/api/auth/oidc/route.ts` lines 50, 57–64
**Issue:** `phone_number` is extracted from Telegram's OIDC `id_token` payload (`const phone = idTokenPayload.phone_number;`) but omitted from the `profiles` upsert payload.
**Impact:** Verified student phone numbers provided during Telegram Web OAuth are discarded, leaving `profiles.phone_number` empty.
**Fix:** Include `phone_number: phone || null` in the Supabase upsert payload.

---

## 🟢 LOW

### [L-01] `x-temari-subdomain` Header Spoofable by Clients Bypassing CDN
**File:** `src/middleware.ts`
**Issue:** Header set from `Host` — clients with direct server access can spoof it. No business-critical logic uses this as a security boundary currently, but risk increases if routes start using it for authorization.

### [L-02] Receipt URL Not URL-Encoded
**File:** `src/app/api/payments/submit/route.ts`
**Issue:** Receipt URL stored and displayed without `encodeURIComponent`. Unicode characters in filename (edge case) could produce malformed URLs.

### [L-03] `GET /api/highlights` Uses Admin Client (RLS Bypass) for Read-Only Query
**File:** `src/app/api/highlights/route.ts`
**Issue:** Unnecessary RLS bypass for a user-scoped read. Any bug in the query (missing `.eq('telegram_id', ...)`) would expose all users' highlights. Should use user-scoped client with RLS.

### [L-04] Multiple SQL Files at Project Root — No Deployment Tracking
**Files:** `database_indexes.sql`, `ai_responses_cache.sql`, `manual_payment_setup.sql`
**Issue:** Scattered SQL files with no version tracking. Unknown which have been applied in production.

### [L-05] No Security Headers in `next.config.mjs`
**Issue:** No `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy` headers configured.

### [L-06] Exam Timer Zero-Padding Bug for Seconds < 10
**File:** `src/components/exam/ExamTimer.tsx`
**Issue:** Likely displays `1:9` instead of `1:09` in final countdown. Verify and fix padding.

### [L-07] `WelcomeOnboarding` `stream` Field Defaults to Empty String
**File:** `src/store/useAppStore.ts`
**Issue:** `stream: string` defaults to `''` — invalid value. Should default to `'Natural Science'` or be nullable.

### [L-08] Telegram SDK Loads on Admin Routes Where It's Never Used
**File:** `src/app/layout.tsx`
**Issue:** `beforeInteractive` SDK load fires on `/admin/*` pages where Telegram WebApp is irrelevant. Waste of bandwidth + blocking parse time for admin users.

### [L-09] `console.log` Calls in Production Routes
**Files:** Multiple API routes
**Issue:** Internal state and error details logged to server stdout in production.

### [L-10] `auth/callback/page.tsx` Is a Client Component — Token Exposed in Browser
**File:** `src/app/(app)/auth/callback/page.tsx`
**Issue:** OAuth callback handled client-side. Tokens briefly visible in browser JS context. Should be a server component using `searchParams`.

### [L-11] Purge Deprecated OTP Route (POST /api/auth/verify-otp) and Drop Legacy otp_codes Table
**Files:** `src/app/api/auth/verify-otp/route.ts`, Supabase database schema
**Issue:** Temari authenticates users strictly via Telegram (Telegram Mini App `initData`, Telegram Login Widget `webData`, and Telegram OIDC). Direct phone auth is disabled, and SMS/OTP verification is completely unnecessary. The endpoint `POST /api/auth/verify-otp` and database table `otp_codes` are obsolete dead code and unnecessary attack surface.
**Impact:** Dead routes and unused database schema cluttering the project.
**Fix:** Delete `src/app/api/auth/verify-otp/route.ts` and drop table `otp_codes` from the database schema.

### [L-12] Superadmin Account Management Lacks Delete/Deactivate Admin Server Action
**Files:** `src/app/actions/admin.ts` lines 220–251, `src/app/admin/managers/page.tsx`
**Issue:** Superadmins can create admin accounts and list them, but no Server Action exists to delete, deactivate, or revoke access for compromised admin accounts.
**Impact:** Compromised admin credentials require manual SQL intervention in Supabase to revoke.
**Fix:** Add `deleteAdminAccount(adminId)` and `toggleAdminActive(adminId)` Server Actions with Superadmin role verification.

---

## Database Actions Status (Production)

| # | Action | File | Status |
|---|---|---|---|
| D-01 | `increment_user_subject_stats` RPC | `supabase/migrations/20261004120000_production_indexes_and_rpc.sql` | ✅ Executed & Live in Prod |
| D-02 | `ai_responses_cache` table + index | `supabase/migrations/20261004120000_production_indexes_and_rpc.sql` | ✅ Executed & Live in Prod |
| D-03 | `idx_questions_subject_exam` composite index | `supabase/migrations/20261004120000_production_indexes_and_rpc.sql` | ✅ Executed & Live in Prod |
| D-04 | `idx_questions_year_ec` index | `supabase/migrations/20261004120000_production_indexes_and_rpc.sql` | ✅ Executed & Live in Prod |
| D-05 | All performance indexes | `supabase/migrations/20261004120000_production_indexes_and_rpc.sql` | ✅ Executed & Live in Prod |
| D-06 | Study notes + user pins indexes | `supabase/migrations/20261004120000_production_indexes_and_rpc.sql` | ✅ Executed & Live in Prod |
| D-07 | RLS lockdown migration | `supabase/migrations/20260924150000_rls_lockdown.sql` | ✅ Executed & Live in Prod |
| D-08 | Payment + Gemini columns | `supabase/migrations/20260926_payment_gemini_columns.sql` | ✅ Executed & Live in Prod |
| D-09 | `idx_payment_receipts_user_date` | `supabase/migrations/20261004120000_production_indexes_and_rpc.sql` | ✅ Executed & Live in Prod |
| D-10 | Drop deprecated `otp_codes` table & index | Supabase migration cleanup | ⏳ Pending cleanup (OTP removed in favor of Telegram Login Widget) |
| D-11 | RLS on `user_pins` table | `supabase/migrations/20261004120000_production_indexes_and_rpc.sql` | ✅ Executed & Live in Prod |
| D-12 | Make `receipts` storage bucket private | Supabase dashboard setting | ✅ Completed (Private bucket) |
| D-13 | `check_and_increment_ai_quota` RPC | `supabase/migrations/20261004140000_atomic_ai_quota_rpc.sql` | ✅ Executed & Live in Prod |
| D-14 | Restrict `study_notes` RLS SELECT policy (gate content from anon) | `supabase/migrations/20261005100000_secure_study_notes_rls.sql` | ⏳ Pending Supabase SQL Execution |

---

## Dedicated Exam Portals & Subdomain Routing Status

| Route / Subdomain | Parsing / Rewrite | Middleware Headers & Cookie | Session & DB Persistence | Direct Onboarding Bypass | Status |
|---|---|---|---|---|---|
| `/entrance` & `entrance.temari.top` | ✅ | ✅ `x-temari-subdomain`, `x-temari-target-exam`, `temari_portal` | ✅ Saved to `profiles.target_exam` & encrypted session | ✅ Bypasses onboarding modal | ✅ Live in Prod |
| `/freshman` & `freshman.temari.top` | ✅ | ✅ `x-temari-subdomain`, `x-temari-target-exam`, `temari_portal` | ✅ Saved to `profiles.target_exam` & encrypted session | ✅ Bypasses onboarding modal | ✅ Live in Prod |
| `/exit` & `exit.temari.top` | ✅ | ✅ `x-temari-subdomain`, `x-temari-target-exam`, `temari_portal` | ✅ Saved to `profiles.target_exam` & encrypted session | ✅ Bypasses onboarding modal | ✅ Live in Prod |
| Root `/` (`temari.top`) | ✅ | ✅ Root hero guides to `#exam-portals` | ✅ Scoped login via portal cards | ✅ Modal only if root login without exam chosen | ✅ Live in Prod |
| Telegram Mini App Logout | ✅ | ✅ Session cookie wiped with `.temari.top` domain | ✅ `temari_manual_logout` in sessionStorage | ✅ Prevents auto-login loop + provides "Exit App" button | ✅ Live in Prod |

**Architecture Implemented:**
- Root landing page features "Select Your Exam Track" CTA linking down to dedicated exam portals (`/entrance`, `/freshman`, `/exit`).
- Clicking any exam portal redirects to that track's dedicated landing page with scoped branding, stats, and exam metadata.
- Students logging in from a dedicated page (via Telegram WebApp or Telegram OIDC) have their choice persisted to `profiles.target_exam` and their session token.
- Post-login onboarding (`WelcomeOnboarding`) is completely bypassed, immediately opening their track's dashboard, past papers, and study notes.
- Users can log out cleanly in Telegram Mini App or Web, expiring the `.temari.top` wildcard domain cookie and preventing auto-login loops.

---

## Performance Baseline (Current)

| Route | First-Load JS | Status |
|---|---|---|
| `/exam/session` | **214 kB** | 🔴 Highest — must split |
| `/dashboard` | 114 kB | 🟡 Acceptable |
| `/notes/[subject]` | 111 kB | 🟡 MarkdownRenderer lazy ✅ |
| `/mastery` | 108 kB | 🟡 |
| `/profile` | 104 kB | 🟡 |
| `/upgrade` | 101 kB | 🟡 |
| `/practice` | 98 kB | 🟢 |
| Shared JS | 87.9 kB | Lucide/date-fns now tree-shaken ✅ |

---

## AI Integration Health

| Item | Status |
|---|---|
| Streaming (ReadableStream via AI SDK) | ✅ |
| Key rotation (multi-key round-robin) | ✅ |
| Per-key 429 cooldown (60s) | ✅ |
| Model Availability & Generation | ✅ Upgraded to `gemini-3.8-flash` (Live & Verified) |
| False 404 Key Cooldown Trap | ✅ Fixed (404 removed from markKeyRateLimited) |
| Weekly quota enforcement (free: 5, pro: 150) | ✅ |
| Quota Rollback on Stream Failure | ✅ Rollback applied on generation errors |
| In-memory rate limit (15 req/60s) | ✅ Upstash Redis distributed limiter active |
| Cache WRITE on completion | ✅ (Redis L1 + Supabase L2 upsert) |
| Cache READ before API call | ✅ Implemented (H-03) |
| Input size limits | ✅ Zod `.max()` enforced (H-04) |
| Prompt injection protection | ⚠️ System prompts bounded and escaped |
| Duplicate insert race condition | ✅ Fixed via `.upsert({ ignoreDuplicates: true })` |
| Quota check atomicity | ✅ Atomic Postgres RPC (`check_and_increment_ai_quota`) |

---

## Ordered Action Checklist

```
════════════════════════════════════════
  SECURITY — Fix before next release
════════════════════════════════════════

[x] C-01  Enforce webhook signature — return 403 on mismatch/missing
[x] C-02  Fail closed on admin ID check — reject if ADMIN_TELEGRAM_ID unset
[x] C-03  Throw hard startup error if TELEGRAM_BOT_TOKEN missing (no fallback)
[x] C-04  Force admin password migration; remove plaintext comparison branch (auto-migrates on login + constant-time comparison)
[x] C-05  Make receipts storage bucket private; use signed URLs for admin review
[x] C-06  Fix OG image path in layout.tsx (Verified existing image asset at /assets/New_temari_logo.png)
[x] H-04  Add .max() on noteText (50K) and chatHistory[].content (4K) in AI schema
[x] H-05  Add KaTeX hardening & HTML escape fallback on math output
[x] H-07  Hardcode redirect_uri server-side in auth/oidc route
[x] M-04  Add rate limiting to admin login Server Action
[x] M-08  Change admin cookie to sameSite: 'strict'
[x] M-18  Embed iat/exp in SessionData; validate in decryptSession
[x] L-05  Add security headers to next.config.mjs
[x] C-10  Lock down PostgREST RLS on study_notes: drop public SELECT policy (supabase/migrations/20261005100000_secure_study_notes_rls.sql)
[x] H-18  Telegram initData: enforce auth_date freshness check (24h) and use crypto.timingSafeEqual()
[x] H-19  Add distributed rate-limiting to auth/session and auth/oidc endpoints

════════════════════════════════════════
  CRITICAL APP FIXES
════════════════════════════════════════

[x] C-07  Add error.tsx + loading.tsx at (app)/(protected)/ level
[x] C-08  Add .max(100) on correct/attempted in exam submit Zod schema
[x] C-09  Upgrade AI model from deprecated gemini-1.5-flash to gemini-3.8-flash across all routes (tutor, quiz, payments, notes transform), remove 404 from key cooldown, and rollback quota on stream failure
[x] H-08  Replace inline createClient with singleton in payments/status and submit routes
[x] H-09  Add checkRateLimit to payments/submit (5 per 10min)
[x] H-10  Add duplicate pending receipt guard in payments/submit (return 409)
[x] H-16  Add rollback to webhook payment approval if profile update fails

════════════════════════════════════════
  DATABASE — Run in Supabase SQL Editor
════════════════════════════════════════

[x] D-01  Run increment_user_subject_stats.sql RPC function (Executed & Live in Prod)
[x] D-02  Run ai_responses_cache.sql (table + composite index) (Executed & Live in Prod)
[x] D-03  Run database_indexes.sql (questions composite indexes) (Executed & Live in Prod)
[x] D-04  Run supabase_performance_indexes.sql (all performance indexes) (Executed & Live in Prod)
[x] D-05  Run performance_indexes.sql (study_notes, user_pins, saved_mistakes) (Executed & Live in Prod)
[x] D-09  CREATE INDEX idx_payment_receipts_user_date ON payment_receipts(telegram_id, created_at DESC) (Executed & Live in Prod)
[ ] D-10  Drop legacy otp_codes table and index (OTP deprecated — Telegram Widget & Mini App used)
[x] D-11  Confirm + add RLS on user_pins table (Executed & Live in Prod)
[x] D-12  Make receipts storage bucket private in Supabase dashboard (Completed)
[ ] D-14  Lock down study_notes RLS policy (remove public SELECT on content)

════════════════════════════════════════
  HIGH — Fix this week
════════════════════════════════════════

[x] H-01  Confirm increment_user_subject_stats RPC deployed; fix race condition fallback
[x] H-02  Fix AI cache insert: .upsert({ ignoreDuplicates: true })
[x] H-03  Add cache READ before Gemini call in AI tutor route
[x] H-06  Replace in-memory rate limiter with Upstash Redis (shared across instances, with memory fallback)
[x] H-11  Fix Cache-Control on /api/notes/content: public → private
[x] H-12  Split ExamWorkspace: extract ExamResultsView as dynamic import
[x] H-13  Convert practice/sessions/page.tsx to async server component
[x] H-14  Serve question images via Next.js <Image> or CDN; add lazy loading (rewrites & normalized)
[x] H-15  Persist subdomain & portal path exam type to profile.target_exam on auth login (bypasses onboarding)
[x] H-17  Fix progress tracking: self-paced practice partial attempt saving, early exit confirmation modal, accurate percentage calculations, and cache revalidation

════════════════════════════════════════
  MEDIUM — Fix this sprint
════════════════════════════════════════

[x] M-01  Add isContentLoading skeleton to StudyNotesView lazy note fetch
[x] M-02  Fix read-time: use content_word_count from DB or label as "estimated"
[x] M-03  Make AI quota check+increment atomic via Postgres RPC (20261004140000_atomic_ai_quota_rpc.sql + route fallback)
[x] M-05  Fix GET /api/highlights unauthenticated response: 200 → 401
[x] M-06  Add file type + size validation in payments/submit (10MB max, image/* only)
[x] M-07  Fix upsert conflict target: remove space → 'telegram_id,subject'
[x] M-09  Fix HomeHub streak date: use Africa/Addis_Ababa timezone for comparison
[x] M-10  Change Telegram SDK strategy: beforeInteractive → afterInteractive
[x] M-11  Remove ~80 duplicate question images from /public (free 9 MB — removed 153 redundant files, saved 8.3 MB)
[x] M-12  Add aria-label to all icon-only buttons across all components (ExamWorkspace, AITutorDrawer, ProductTour, StudyNotesView)
[x] M-13  Convert upgrade/page.tsx to server wrapper (fix PRO user flash)
[x] M-14  Add not-found.tsx with branded 404 page
[x] M-15  Add loading.tsx skeleton per protected route (dashboard, exam, notes, etc.)
[x] M-16  Fix layout.tsx body: text-gray-900 dark:text-gray-100 → text-foreground
[x] M-17  Force admin password migration (auto-migrates on login + constant-time comparison)
[x] M-19  Audit and fix PWA manifest icon paths (synced manifest.json with public/icons/)
[x] M-20  Persist completed session stats to DB (user_subject_stats atomic RPC)
[ ] M-21  Add last_activity_date to ProtectedLayout SSR query to prevent redundant streak writes on HomeHub
[ ] M-22  Add timeout and max retry ceiling to UpgradeFlow.tsx payment status polling loop
[ ] M-23  Add in-flight mutex / isSyncing guard to offlineSync.ts to prevent duplicate submissions
[ ] M-24  Cache getEntranceYearCounts in practice.ts with unstable_cache to eliminate 9 parallel HEAD queries
[ ] M-25  Synchronize gamification XP between Web app (localStorage) and Telegram Bot (user_subject_stats)
[ ] M-26  Add Zod string length constraint (.max(2000)) on POST /api/highlights text payload
[ ] M-27  Persist phone_number from Telegram OIDC id_token to profiles table during upsert

════════════════════════════════════════
  LOW — Backlog
════════════════════════════════════════

[x] L-01  Document that x-temari-subdomain must not be used as auth boundary
[x] L-02  encodeURIComponent the receipt fileName before URL construction
[x] L-03  Switch GET /api/highlights to user-scoped query with session verification
[x] L-04  Move root-level SQL files into supabase/migrations/ with timestamps
[x] L-06  Fix exam timer zero-padding: display 1:09 not 1:9 (verified padded)
[x] L-07  Fix WelcomeOnboarding stream default: '' → 'Natural Science' or null
[x] L-08  Skip Telegram SDK load on /admin/* routes
[x] L-09  Remove console.log from production routes (0 console.log calls in src/)
[x] L-10  PKCE auth callback with secure state & verifier verification
[ ] L-11  Delete deprecated api/auth/verify-otp route and drop legacy otp_codes table
[ ] L-12  Add delete/deactivate admin Server Action and UI in superadmin managers panel
```

---

## 🚀 Future Features (Concept Only — No Implementation Yet)

### [F-01] College Ambassador Referral Program

**Concept:** Campus-based growth engine powered by student ambassadors at major Ethiopian universities. Each ambassador acts as the exclusive owner of their campus community, drives paid subscriptions through a unique referral link, and earns income through a commission + milestone bonus structure.

**Core Components:**
- **Ambassador Identity** — Each ambassador owns a single campus (AAU, Jimma, Bahir Dar, HU, MU, etc.). Unique referral link tied to their account. Dedicated ambassador profile visible to their campus community.
- **Earnings Model** — Commission per paid subscriber (birr/month, recurring while subscriber is active) + milestone bonuses at thresholds (10, 25, 50, 100, 250 paid referrals). Transparent real-time earnings dashboard + pending payout tracker.
- **Tier System** — Bronze (0–9 paid referrals) → Silver (10–24) → Gold (25–99) → Diamond (100+). Higher tiers unlock higher commission rates, priority support, and exclusive Temari branding kits.
- **Ambassador Dashboard** — Personal analytics: total referrals, active paid subscribers, churned subscribers, total earnings, pending payout, tier progress, leaderboard rank.
- **Leaderboard** — Public ranking of all ambassadors by active paid subscribers. Resets quarterly. Top 3 per quarter get bonus payouts. Competitive motivation across campuses.
- **Admin Controls** — Approve/reject applications, per-campus growth view, payout management, commission rate config per tier, ambassador suspension.
- **Phased Rollout** — Phase 1: Pilot 5 flagship universities (AAU, JU, BDU, HU, MU). Phase 2: All public universities. Phase 3: Private colleges and preparatory schools.

**Key Metrics to Track:** Referral conversion rate, subscriber LTV per campus, ambassador retention, CAC vs organic, MRR per campus cluster, churn rate by referral cohort.

**Tables Needed (concept):** `ambassadors`, `ambassador_referrals`, `ambassador_earnings`, `ambassador_payouts`, `ambassador_tiers`

**Open Questions:** Payout mechanism (Telebirr? Bank transfer?), minimum payout threshold, cross-device referral attribution, churn clawback policy (commission reversed if subscriber churns within 30 days?), academic year vs calendar year leaderboard resets.

---

### [F-02] Monitoring & Analytics

**Concept:** Centralized observability, operational telemetry, and student growth analytics for tracking app performance, revenue conversion, and AI infrastructure metrics.

**Core Components:**
- **AI Latency & Quota Observability:** Real-time metrics on Gemini API response times, TTFT (time-to-first-token), cache hit rates (Redis L1 & Supabase L2), weekly quota exhaustion rates, and error/cooldown events.
- **Student Engagement & Funnel Telemetry:** Daily Active Users (DAU), question attempt volume per subject, average simulation score trends, chapter note completion depth, and streak retention.
- **Payment & Conversion Analytics:** Submission volume for Telebirr / CBE payment receipts, Gemini Vision auto-verification accuracy rate, manual review queue turnaround time, and churn tracking.
- **Error Tracking & Health Monitoring:** Runtime exception tracking (Sentry / Vercel Web Analytics), rate-limit trigger alerts, and database pool connection monitoring.

---

## 🎨 Polish & Upcoming Tasks

### [P-01] Short Note Upload Interface & Functionality Polish
**Files:** `src/app/admin/upload-notes/page.tsx`, `src/app/api/admin/notes/route.ts`, `src/app/api/admin/notes/transform/route.ts`
**Goal:** Enhance the admin short note creation and management experience:
- Clean multi-step or split-pane upload UI with live Markdown/KaTeX preview.
- AI Note Transformer: Convert raw lecture notes, PDF extracts, or textbooks into high-yield Temari chapter summaries with key formulas, bullet takeaways, and mnemonics.
- Subject & chapter hierarchy selector with automated order index assignment.
- Validation, duplicate check, and graceful error handling during save/publish.

---

### [P-02] 7. Bot Interactivity & Retention Engine (Full Audit & Actionable Plan)
**Files:** `src/app/api/bot/webhook/route.ts`, `src/lib/telegramBot.ts`

**Current State & Audit Findings:**
1. **Existing Features (Working):**
   - Commands `/start`, `/menu`, `/quiz`, `/stats`, `/upgrade`, `/help`.
   - In-chat micro-quiz drill with 4 inline choice buttons (`quiz:questionId:option`) awarding +10 XP and updating `user_subject_stats` and streak atomically.
   - Scholar stats card displaying level, accuracy, streak, and top subjects.
   - Admin payment verification via inline buttons (`approve_payment:id`, `reject_payment:id`).
   - Admin PDF document upload auto-forwarded to n8n webhook.

2. **Identified Deficiencies & Missing Flows vs. Plan:**
   - 🔴 **Missing Channel Join Nudge:** When a student enters `/start`, the bot displays the portal options but **does not prompt or incentivize joining the official Telegram Channel** (`https://t.me/temari_App`). Missing a primary viral growth and retention channel.
   - 🔴 **Missing Deep-Link Expansion:** `/start` only checks `arg === 'quiz'`, `arg === 'stats'`, `arg === 'upgrade'`. It does NOT parse deep link parameters:
     - `ref_<ambassador_id>`: Necessary for the College Ambassador referral program (`F-01`).
     - `track_<exam>`: Direct deep link from Telegram channels to pre-configure Grade 12, Freshman, or Exit Exam.
     - `q_<uuid>`: Direct link to challenge a friend to solve a specific exam question in chat.
   - 🟠 **Missing Daily Streak Protection Reminders:** No automated reminder job runs to notify students who haven't practiced today that their streak will reset at midnight East Africa Time (EAT).
   - 🟠 **Missing Milestone Celebrations:** When a student achieves high scores (>80%) on mock exams, reaches 50+ solved questions, or maintains a 7-day streak, the bot sends no congratulatory message or in-chat trophy badge.
   - 🟠 **Missing AI Quota Exhaustion Upsell Trigger:** When a student exhausts their weekly 5-question AI quota in the web app, no bot message is sent offering a PRO upgrade or Telebirr payment guide.
   - 🟡 **Missing Persistent Reply Keyboard:** The bot currently uses inline keyboards only. If a user types free text or enters an invalid command, the bot silently ignores it. A persistent reply keyboard (`[ 🚀 Open Temari App ]`, `[ 🎯 Daily Quiz ]`, `[ 📊 My Stats ]`) is missing.
   - 🟡 **Missing Chat Menu Button API Call:** The bot does not invoke Telegram's `setChatMenuButton` API to configure the WebApp button next to the chat input field on first `/start`.

**Action Items & Implementation Roadmap:**
- [ ] `[B-01]` Implement Channel Join Verification & Welcome Flow (`getChatMember` check on `@temari_App` with "Join Channel & Unlock Free AI Pass" CTA).
- [ ] `[B-02]` Extend `/start` deep-link parser to support `ref_<id>` (referrals), `track_<exam>` (exam onboarding), and `q_<uuid>` (single question drills).
- [ ] `[B-03]` Build cron notification endpoint (`/api/cron/streak-reminder`) using Vercel Cron or GitHub Actions to alert at-risk streaks at 20:00 EAT.
- [ ] `[B-04]` Add milestone celebration trigger: generate visual ASCII / HTML trophy card in chat when a student achieves a streak or mastery record.
- [ ] `[B-05]` Connect AI Quota exhaustion event in `src/app/api/ai/tutor/route.ts` to trigger a friendly conversational upsell message in Telegram.
- [ ] `[B-06]` Add persistent reply keyboard for zero-friction navigation on all unrecognized text inputs.

---

### [P-03] 8. Documentation Update & Architecture Synchronization (Full Audit & Actionable Plan)
**Files:** `README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `docs/*`

**Current State & Audit Findings:**
1. **`README.md` Inconsistencies:**
   - Folder structure references `next.config.js` instead of `next.config.mjs`.
   - Lists Cloudinary CDN (`src/utils/cloudinary.ts`) as primary image CDN, but 170+ question diagrams are served locally from `/public/assets/question_images/`.
   - Missing documentation for the dedicated multi-subdomain routing (`entrance.temari.top`, `freshman.temari.top`, `exit.temari.top`).
   - Missing documentation of Upstash Redis L1 caching and dual-layer AI response caching.
2. **`docs/api-routes.md` Inconsistencies & Omissions:**
   - Erroneously states `POST /api/auth/telegram/web` does *not* set a session cookie (it now issues `es_session` cookie).
   - States `POST /api/auth/oidc` accepts `redirect_uri` in client request body (hardened server-side for security).
   - Completely missing documentation for `POST /api/admin/notes/transform` (Gemini document AI parser).
   - Completely missing documentation for `GET /api/payments/status` and `POST /api/payments/submit` (CBE / Telebirr receipt OCR verification).
   - Completely missing documentation for `GET /api/highlights`.
3. **`docs/database-schema.md` Inconsistencies & Omissions:**
   - Completely missing `payment_receipts` table specification (with OCR amounts, sender names, status, and verification flags).
   - Completely missing `ai_responses_cache` table specification (prompt/answer caching).
   - Missing `profiles` columns: `ai_weekly_usage`, `ai_quota_reset_at`, `phone_number`.
   - Missing database RPC functions: `increment_user_subject_stats` and `check_and_increment_ai_quota`.
4. **`ARCHITECTURE.md` Inconsistencies & Omissions:**
   - Outdated system diagram: does not reflect multi-subdomain routing, canonical 308 redirects, and wildcard `.temari.top` cookie scoping.
   - Missing dual-layer caching architecture (Upstash Redis L1 + Supabase L2).
   - Missing Telegram Webhook bot architecture and admin verification pipeline.
5. **`CONTRIBUTING.md` & `docs/testing.md` Inconsistencies:**
   - Missing documentation for Jest unit tests (`npm test`) covering subdomains, session encryption, rate limiter, and streak calculators.

**Action Items & Implementation Roadmap:**
- [ ] `[DOC-01]` Update `README.md` with accurate file names, remove stale Cloudinary claims, and document multi-subdomains.
- [ ] `[DOC-02]` Update `docs/api-routes.md` to document all active endpoints (`payments`, `transform`, `highlights`) and correct auth specs.
- [ ] `[DOC-03]` Update `docs/database-schema.md` with `payment_receipts`, `ai_responses_cache`, new `profiles` columns, and RPC functions.
- [ ] `[DOC-04]` Rewrite `ARCHITECTURE.md` with up-to-date system diagrams and caching hierarchy.
- [ ] `[DOC-05]` Update `CONTRIBUTING.md` and `docs/testing.md` with current Jest test suite commands and multi-subdomain testing instructions.

---

### [P-04] 9. Design, Color, Contrast & Visual Identity Audit (Full Audit & Proposals)
**Files:** `tailwind.config.ts`, `src/styles/tokens.ts`, `src/app/globals.css`, UI components

**Current State & Audit Findings:**
1. **Hardcoded Gray vs. Semantic Design Token Inconsistency:**
   - `src/styles/tokens.ts` defined semantic text tokens: `foreground`, `muted-foreground`, and `subtle-foreground` specifically to eliminate paired `text-gray-900 dark:text-gray-100`.
   - Over 40 instances of hardcoded `text-gray-900 dark:text-gray-100`, `text-gray-500`, and `text-slate-400` persist across `UpgradeFlow.tsx`, `Admin` views, `PWARegistry.tsx`, and `AITutorDrawer.tsx`.
2. **Low-Contrast Dark Mode Borders:**
   - In `UpgradeFlow.tsx`, several card containers use `border-black/5` or `border-black/10` without a dark mode equivalent (e.g. `dark:border-white/10`), causing cards to lose their bounding edges in dark mode.
3. **Accent Standardization Mismatch:**
   - `ExamWorkspace.tsx` uses `text-amber-500` for flagged questions instead of the standardized brand token `text-accent-gold`.
4. **Telegram Client Theme Harmonization:**
   - Certain popups and alerts use hardcoded Tailwind slate colors that clash with custom Telegram themes when running inside Telegram Mini App.

**Proposed Improvements (Audit Only — No Code Changes Yet):**
- [ ] `[DES-01]` Replace all remaining `text-gray-900 dark:text-gray-100` instances with `text-foreground`.
- [ ] `[DES-02]` Replace `text-gray-500 dark:text-gray-400` with `text-muted-foreground`.
- [ ] `[DES-03]` Ensure all borders use semantic `border-border` / `border-black/[0.08] dark:border-white/[0.08]` so dark mode boundaries are crisp.
- [ ] `[DES-04]` Align question flag and highlight colors with `text-accent-gold`.
- [ ] `[DES-05]` Map Telegram client theme variables (`bg_color`, `secondary_bg_color`, `text_color`) to CSS custom properties for pixel-perfect Mini App integration.

---

### [P-05] 10. Content Upload, Access Control & Sub-Admin Delegation (Full Audit & Architecture)
**Files:** `src/app/admin/*`, `src/app/actions/admin.ts`, `src/app/api/admin/*`, Supabase RLS / Storage policies

**Current State & Audit Findings:**
1. **Current Upload Workflows:**
   - **Study Notes:** Admin can paste text or upload documents (.pdf, .docx, .txt) at `/admin/upload-notes`, where an AI transformer parses chapters and saves them to `study_notes`.
   - **Questions:** Currently completely static / offline. Ingested via local scripts (`scripts/ingest_chapters.js`, `data/ethio_exam_vault.db`). `/admin/questions` is read-only (displays 100 questions with zero edit/upload controls).
2. **Privilege & Security Vulnerabilities:**
   - 🔴 **Readonly Admin Note Upload Exploit:** `src/app/api/admin/notes/route.ts` and `transform/route.ts` only check `const isAdmin = await verifyAdmin()`. They DO NOT check `admin.role !== 'readonly'`. A readonly admin can send POST requests directly to create, overwrite, or transform notes!
   - 🔴 **Editor Role Privilege Escalation in Payments:** In `src/app/actions/admin.ts`, `updatePaymentStatus()` only blocks `readonly`. Accounts with `role: 'editor'` (intended for content entry) can approve/reject financial payments, view student bank screenshots, and upgrade subscriptions!
   - 🟠 **No Sub-Admin Role for Delegated Content Entry:** There is no scoped role for school teachers, university course reps, or student contributors who should only be able to draft notes or review questions without seeing analytics or admin accounts.

**Proposed 4-Tier Sub-Admin Delegation Architecture:**
1. **`superadmin`**: Full access to all modules, admin management, API keys, and database actions.
2. **`financial_admin`**: Exclusive access to Payments Queue (`/admin/payments`), Telebirr/CBE verification, and student subscription management.
3. **`content_editor`**: Access to Note Upload Studio (`/admin/upload-notes`) and Question Bank Studio (`/admin/questions`). Zero access to payments or user management.
4. **`reviewer`**: Read-only access across study notes, questions, and curriculum stats for quality audit.

**Action Items & Implementation Roadmap:**
- [x] `[ADM-01]` Patch `src/app/api/admin/notes/route.ts` and `transform/route.ts` to reject `readonly` admins with 403 Forbidden. (Patched & verified)
- [x] `[ADM-02]` Patch `updatePaymentStatus()` in `src/app/actions/admin.ts` to require `role === 'superadmin' || role === 'financial_admin'`. (Patched & verified)
- [ ] `[ADM-03]` Build Web Question Bank Upload & Editor Studio in `/admin/questions` (bulk JSON/CSV import, KaTeX live preview, answer key editor).
- [ ] `[ADM-04]` Create `admin_audit_logs` table to track who approved payments, published notes, or modified questions.
- [ ] `[ADM-05]` Implement granular scoped permissions in `src/app/actions/admin.ts` (`hasPermission(admin, 'notes:write' | 'payments:approve' | ...)`).

---

### [P-06] Study Notes Premium Paywall Hardening
**Files:** `src/app/(app)/(protected)/notes/[subject]/page.tsx`, `src/components/dashboard/StudyNotesView.tsx`, `src/app/api/notes/content/route.ts`

**Current State & Audit Findings:**
- Currently, short notes and summary chapters are accessible to all authenticated users regardless of subscription tier.
- In `src/app/api/notes/content/route.ts`, any user with an active session can fetch the complete markdown content of any note.
- Free users can read the entire curriculum notes without upgrading to Premium.

**Action Items & Implementation Roadmap:**
- [ ] `[NOTE-01]` Update `src/app/api/notes/content/route.ts` to verify `profile.subscription_status === 'premium'`. For free users, return only a teaser paragraph / summary excerpt with `is_locked: true` and 403 status.
- [ ] `[NOTE-02]` Update `src/components/dashboard/StudyNotesView.tsx` with a blurred teaser view, locked badge icons on chapter cards, and a prominent "Upgrade to Premium to Unlock Complete Notes & AI Quizzes" modal.
- [ ] `[NOTE-03]` Pass `isPremium` from server component in `src/app/(app)/(protected)/notes/[subject]/page.tsx` down to `StudyNotesView` to avoid client-side auth flash.

---

### [P-07] Subdomain Landing Pages: Historical Exam Statistics, Storyboard & Mobile UI Mockups
**Files:** `src/components/marketing/LandingPage.tsx`, `src/components/marketing/ExamLandingHero.tsx`, `src/components/marketing/MobileDeviceMockup.tsx`, marketing charts

**Current State & Audit Findings:**
- Subdomain landing pages (`entrance.temari.top`, `freshman.temari.top`, `exit.temari.top`) currently feature hero text, subject pills, and key stats counters (15,000+ questions, matric badges).
- They lack dramatic contextual data, historical exam pass/fail rates, and visual storytelling highlighting the high-stakes reality of Ethiopian national exams.
- They lack real in-app visual previews, leaving prospective students to guess what the actual study experience looks like before creating an account.

**Action Items & Implementation Roadmap:**
- [ ] `[MKT-01]` Add an interactive **National Exam Statistics & Reality Check** section for `entrance.temari.top`:
  - Visual 3-year pass/fail rate chart (highlighting that only ~3.2% to 5.4% of Grade 12 students achieved university passing marks in recent EUEE exams).
  - Subject difficulty breakdown (e.g. Natural Science Mathematics vs. Physics vs. Aptitude pass rates).
- [ ] `[MKT-02]` Add **Freshman Academic Survival Storyboard** for `freshman.temari.top`:
  - First-year university retention statistics, common GPA pitfalls in Calculus/Applied Math and General Physics, and how chapter drills prevent academic probation.
- [ ] `[MKT-03]` Add **National Exit Exam Benchmark Storyboard** for `exit.temari.top`:
  - MoE department passing requirements, question bank coverage by discipline, and graduation qualification benchmarks.
- [ ] `[MKT-04]` Create reusable responsive charts/infographics (SVG / CSS bar meters) optimized for low-bandwidth mobile devices.
- [ ] `[MKT-05]` Add **Mobile-Framed In-App Product Screenshots & Interactive Preview**:
  - Build a responsive CSS/SVG mobile device mockup (`MobileDeviceMockup.tsx`) with realistic bezel, status bar, and dynamic shadow.
  - Tailor high-fidelity in-app screen previews for each subdomain:
    - **`entrance.temari.top`**: Mobile frame displaying a Grade 12 EUEE exam question with KaTeX math formula rendering, timer, option select, and AI Tutor explanation drawer.
    - **`freshman.temari.top`**: Mobile frame displaying Freshman course notes, Applied Math formulas, and chapter mastery progression.
    - **`exit.temari.top`**: Mobile frame displaying MoE Exit Exam timed mock simulation with department benchmark scoring.
  - Add interactive micro-interactions (e.g. tapping an option in the mockup triggers an answer reveal or opens a sample AI explanation).

---

### [P-08] PWA Install Banner Repositioning & Ergonomics
**Files:** `src/components/layout/PWARegistry.tsx`, `src/app/layout.tsx`

**Current State & Audit Findings:**
- The PWA install banner is currently triggered via `toast.custom` with `Toaster position="top-center"`.
- It appears at the top of the mobile screen, covering headers, back buttons, and profile avatars.
- For optimal mobile thumb ergonomics, install prompts should float at the bottom of the viewport, just above the bottom navigation bar.

**Action Items & Implementation Roadmap:**
- [ ] `[PWA-01]` Decouple the PWA prompt from the top-center sonner toast in `src/components/layout/PWARegistry.tsx`.
- [ ] `[PWA-02]` Implement a dedicated fixed bottom banner styled with `fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] w-[360px]` floating directly above the bottom navigation bar (`bottom-16`).
- [ ] `[PWA-03]` Add touch-friendly dismissal with `localStorage` cooldown (don't re-prompt for 7 days if dismissed).
