# Temari App - Master Execution Roadmap (Prioritized)

*Last Updated: October 2026 (Exhaustive Codebase Audit Sprint)*  
*Status: Production-Grade. Payments 100% cloud-native on Vercel. Full codebase audit completed across UI/UX, Data Model, API Endpoints, Exam Workspaces, and Recent Commits.*

---

## 🔬 Exhaustive Micro-Level Codebase Audit & Defect Backlog (October 2026)

An exhaustive, end-to-end code audit of every section, subsection, icon, button, tab, exam type (`entrance`, `freshman`, `exit`), route, and API endpoint was conducted. Below is the prioritized defect backlog for phased execution:

### 🔴 Phase 1: Critical P0 Flaws (Payment Fraud Flags, Session Sync & Blocked Workflows)
*   [ ] **Fix Payment OCR Fraud Threshold Mismatch (False-Positive Fraud Flagging):**
    *   **Files:** [`src/app/api/payments/submit/route.ts#L12`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/payments/submit/route.ts#L12), [`L103`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/payments/submit/route.ts#L103) vs [`src/app/(app)/(protected)/upgrade/page.tsx#L524`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/upgrade/page.tsx#L524) and [`src/components/ai/AITutorDrawer.tsx#L147`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L147).
    *   **Flaw:** In `submit/route.ts`, `PAYMENT_AMOUNT_ETB = 200`, and Gemini Vision is instructed: `Set "is_suspicious" to true if amount is less than 200 ETB`. But the UI in `upgrade/page.tsx` and `AITutorDrawer.tsx` directs students to pay **199 ETB**.
    *   **Impact:** 100% of legitimate paying students paying 199 ETB get auto-flagged as `is_suspicious: true` and are told their payment requires manual admin investigation.
    *   **Fix:** Align `PAYMENT_AMOUNT_ETB = 199` in `submit/route.ts`.
*   [ ] **Fix Missing `subscription_status` in Protected Layout Session Hydration:**
    *   **Files:** [`src/app/(app)/(protected)/layout.tsx#L20-L36`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/layout.tsx#L20-L36) & [`src/components/auth/StoreInitializer.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/auth/StoreInitializer.tsx).
    *   **Flaw:** `layout.tsx` only selects `daily_streak` from `profiles` and ignores `subscription_status`, `stream`, and `target_exam`. `formattedProfile` does not include `subscription_status`.
    *   **Impact:** `useAppStore.userProfile.subscription_status` is permanently `undefined` on page loads. Premium subscribers continue to see the `👑 PRO Upgrade` button in [`TopHeader.tsx#L108`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/TopHeader.tsx#L108).
    *   **Fix:** Include `subscription_status`, `stream`, `target_exam`, `ai_weekly_usage`, and `ai_quota_reset_at` in `layout.tsx` profile query and pass them into `formattedProfile`.
*   [ ] **Fix Dead Center FAB Trigger on Practice, Mastery & Profile Tabs:**
    *   **Files:** [`src/components/layout/BottomNav.tsx#L27-L31`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/BottomNav.tsx#L27-L31), [`src/app/(app)/(protected)/dashboard/page.tsx#L13`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/dashboard/page.tsx#L13), [`src/components/layout/DashboardShell.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/DashboardShell.tsx).
    *   **Flaw:** Center orange FAB calls `setSetupModalType('exam')`. However, `<ExamSetupModal />` is only mounted inside `dashboard/page.tsx`.
    *   **Impact:** Tapping the center FAB while on `/practice`, `/mastery`, or `/profile` does nothing.
    *   **Fix:** Move `<ExamSetupModal />` to `DashboardShell.tsx` so the center FAB launches the modal across all tabs.
*   [ ] **Fix Dropped Exam Stats, Streak Updates & Bookmarks for Web Students:**
    *   **Files:** [`src/components/exam/ExamWorkspace.tsx#L179`](file:///home/abdu/scraping/ethio-exam-app/src/components/exam/ExamWorkspace.tsx#L179), [`L227`](file:///home/abdu/scraping/ethio-exam-app/src/components/exam/ExamWorkspace.tsx#L227).
    *   **Flaw:** `toggleBookmark` and `handleFinish` check `if (!user?.id) return;` using `useTelegram()`.
    *   **Impact:** For web/desktop students (authenticated via OTP/OIDC session cookie), `user` is null. Exam results submitted to `/api/exam/submit` and daily streak updates via `updateDailyStreak()` are silently skipped and lost.
    *   **Fix:** Replace `if (!user?.id) return;` with server-session validation or check `userProfile?.telegram_id || user?.id`.

---

### 🟡 Phase 2: High Priority P1 Flaws (Mode Overrides & UI Polish)
*   [ ] **Fix ExamSetupModal Dropping `mode` (Practice Drill Overridden to Timed Simulator):**
    *   **Files:** [`src/components/dashboard/ExamSetupModal.tsx#L119-L128`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/ExamSetupModal.tsx#L119-L128) vs [`src/app/(app)/(protected)/exam/session/page.tsx#L25`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/exam/session/page.tsx#L25).
    *   **Flaw:** `ExamSetupModal` holds mode state (`'practice'`), but `mode` is never added to `params` in `handleStart()`.
    *   **Impact:** In `exam/session/page.tsx`, `mode` defaults to `'exam'`. Students selecting "Quick Drill" are forced into timed simulator mode with an active countdown timer and no instant answer explanations.
    *   **Fix:** Append `params.set('mode', mode)` in `ExamSetupModal.tsx#L124`.
*   [ ] **Fix Flashcards Double Header & Redundant Padding:**
    *   **Files:** [`src/components/layout/TopHeader.tsx#L29-L33`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/TopHeader.tsx#L29-L33) & [`src/components/layout/DashboardShell.tsx#L11-L15`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/DashboardShell.tsx#L11-L15).
    *   **Flaw:** `pathname.startsWith('/flashcards/')` is missing from `isFocusMode` in `TopHeader` and `DashboardShell` (though present in `BottomNav.tsx`).
    *   **Impact:** On `/flashcards/[subject]`, students see two stacked headers (global `TopHeader` + `FlashcardDeck` custom header) plus redundant bottom padding.
    *   **Fix:** Add `pathname.startsWith('/flashcards/')` to `isFocusMode` in `TopHeader.tsx` and `DashboardShell.tsx`.
*   [ ] **Implement Server-Side Highlight Synchronization:**
    *   **Files:** [`src/components/dashboard/StudyNotesView.tsx#L140-L157`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/StudyNotesView.tsx#L140-L157) & [`src/app/api/highlights/route.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/highlights/route.ts).
    *   **Flaw:** `StudyNotesView.tsx` only reads and writes highlights to `localStorage`. The server endpoint `/api/highlights` is never called.
    *   **Impact:** Student highlights do not sync across devices and are lost if Telegram clears browser storage.
    *   **Fix:** Fetch existing highlights from `/api/highlights` on note mount, and persist highlights to the server on add/remove.

---

### 🟢 Phase 3: Medium Priority P2 Flaws (Math Rendering, PostgREST Limits & Housekeeping)
*   [ ] **Fix PostgREST 1,000-Row Truncation in Entrance Year Counts:**
    *   **Files:** [`src/app/actions/practice.ts#L38-L48`](file:///home/abdu/scraping/ethio-exam-app/src/app/actions/practice.ts#L38-L48).
    *   **Flaw:** `getEntranceYearCounts` fetches all rows with `.select('year_ec')`. PostgREST defaults to a limit of 1,000 rows.
    *   **Impact:** In subjects with >1,000 questions, older exam years get truncated and show 0 counts.
    *   **Fix:** Aggregate question counts via Supabase RPC or group-by query.
*   [ ] **Expand KaTeX Regex to Support Standard LaTeX Delimiters `\( ... \)` and `\[ ... \]`:**
    *   **Files:** [`src/components/MathText.tsx#L14`](file:///home/abdu/scraping/ethio-exam-app/src/components/MathText.tsx#L14).
    *   **Flaw:** Regex only matches `$...$` and `$$...$$`.
    *   **Impact:** Questions containing `\( ... \)` or `\[ ... \]` display raw LaTeX code instead of rendered KaTeX formulas.
    *   **Fix:** Update splitting regex in `MathText.tsx` to include `\\([\\s\\S]*?\\)|\\\[[\\s\\S]*?\\\]`.
*   [ ] **Remove Dead Code `ClientAuthDetector.tsx`:**
    *   **Files:** [`src/components/auth/ClientAuthDetector.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/auth/ClientAuthDetector.tsx).
    *   **Flaw:** Component is completely orphaned and unreferenced in the codebase.
    *   **Fix:** Delete `src/components/auth/ClientAuthDetector.tsx`.
*   [ ] **Contextual Subject Navigation from MasteryTree to Practice:**
    *   **Files:** [`src/components/dashboard/MasteryTree.tsx#L534`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/MasteryTree.tsx#L534).
    *   **Flaw:** Tapping "Practice" navigates to `/practice` without subject context.
    *   **Fix:** Pass `subject` param: `router.push('/practice?subject=' + encodeURIComponent(stat.subject))`.
*   [ ] **Harden OTP Verification Against Brute Force & SSR Crashes:**
    *   **Files:** [`src/app/api/auth/verify-otp/route.ts#L23`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/auth/verify-otp/route.ts#L23), [`L45`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/auth/verify-otp/route.ts#L45) and [`src/app/api/payments/status/route.ts#L28`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/payments/status/route.ts#L28).
    *   **Flaw:** `.single()` throws on missing rows, and OTP verification lacks attempt rate limiting.
    *   **Fix:** Replace `.single()` with `.maybeSingle()` and implement rate limiting on OTP attempts.

---

## 🛠️ Prior Sprints - System Hardening (Completed Fixes)

### 🔴 Phase 1: Critical P0 Fixes (Bugs & Security)
*   **[x] Fix `BottomNav` Center FAB Modal Trigger:**
    *   In `src/components/layout/BottomNav.tsx` (`handleCenterFab`), changed `setSetupModalType(target as any)` to `setSetupModalType('exam')`.
    *   Fixed empty modal header/body and ensured "Start Session" button works across all exams.
*   **[x] Fix Admin Cookie Scope for Note Uploads:**
    *   In `src/app/actions/admin.ts` (`loginAdmin` and `logoutAdmin`), changed cookie `path: '/admin'` to `path: '/'`.
    *   Resolved browser cookie scoping issue for `/api/admin/notes` uploads.
*   **[x] Correct Invalid Gemini Model Identifier Across AI Endpoints:**
    *   Replaced non-existent `gemini-3.6-flash` with stable `gemini-1.5-flash` in `route.ts` across tutor, quiz, tip, and payments.
    *   Eliminated 404 API failures and false key rate-limiting cooldown cascades.
*   **[x] Fix AI Cache Table Name Mismatch (`ai_cache` vs `ai_responses_cache`):**
    *   Renamed SQL table references in `src/app/api/ai/tutor/route.ts` and `src/app/actions/admin.ts` to `ai_responses_cache`.
    *   Ensures AI response caching works properly with RLS.
*   **[x] Fix Multi-Turn AI Chat Ordering & First Turn Role:**
    *   In `src/components/ai/AITutorDrawer.tsx`, filtered out the initial assistant greeting message before creating `chatHistory`.
    *   Strictly start multi-turn requests with `role: 'user'` for Gemini API compliance and enable AI cache hits.
*   **[x] Harden / Deprecate Phone Auth PIN Bypass:**
    *   In `src/app/api/auth/phone/route.ts`, permanently hardened against unauthorized bypass by returning 403 Forbidden in favor of secure Telegram authentication.
*   **[x] Remove Duplicate `TopHeader` on `/upgrade` Page:**
    *   In `src/app/(app)/(protected)/upgrade/page.tsx`, removed duplicate `<TopHeader />` calls in the verifying and form phases.
*   **[x] Purge Plaintext Production Credentials in Scripts:**
    *   Sanitized `migrate_to_supabase.py` by reading `os.environ.get("DATABASE_URL")`.

---

### 🟡 Phase 2: High Priority P1 Fixes (Stability, Offline & Performance)
*   **[x] Harden Offline Exam Loading in `ExamSessionLoader.tsx` & `ExamSessionPage`:**
    *   In `src/app/(app)/(protected)/exam/session/page.tsx`, delegated empty initial queries to `ExamSessionLoader`.
    *   In `src/components/exam/ExamSessionLoader.tsx`, render `<SkeletonScreen />` while `isSyncing` and hydrate from IndexedDB cache even when server fails.
*   **[x] Fix CGNAT Rate Limiting in `/api/ai/tip`:**
    *   In `src/app/api/ai/tip/route.ts`, keyed rate limiter on `session.telegram_id` to prevent cellular IP lockouts.
*   **[x] Replace `.single()` with `.maybeSingle()` in `updateDailyStreak()`:**
    *   In `src/app/actions/user.ts`, updated profile query to `.maybeSingle()` to prevent uncaught SSR crashes on profile misses.
*   **[x] Optimize Entrance Exam Year Counts Query in `practice/sessions`:**
    *   Replaced 9 parallel client-to-server action calls with a single batched query action `getEntranceYearCounts`.
*   **[x] Broaden Key Rotation Support for Standard Env Vars:**
    *   In `src/lib/geminiKeyRotation.ts`, added support for `GOOGLE_API_KEY`, `gemini_key`, and deduplicated key list.
*   **[x] Optimize Receipt Image Processing in `/api/payments/submit`:**
    *   In `src/app/api/payments/submit/route.ts`, reused in-memory `fileBuffer` for base64 conversion instead of making a redundant HTTP fetch.

---

### 🟢 Phase 3: Medium Priority P2 Fixes (UI/UX Polish & Type Integrity)
*   **[x] Fix Flashcard Exit Navigation in `FlashcardDeck.tsx`:**
    *   Updated `onExit` in `src/components/flashcards/FlashcardDeck.tsx` to call `router.back()` with fallback to `/practice?mode=flashcards`.
*   **[x] Fix Active Route Highlighting in Admin Layout Sidebar:**
    *   Created `AdminNav.tsx` client component with dynamic `usePathname()` route matching across all admin tabs.
*   **[x] Re-initialize Subject on Modal Type Change in `ExamSetupModal.tsx`:**
    *   Added `useEffect` to re-sync `subject` to `getDefaultSubject()` whenever `setupModalType`, `targetExam`, or `profileStream` changes.
*   **[x] Synchronize `UserProfile` TypeScript Type Definition:**
    *   Updated `src/types/index.ts` to include `stream?: string | null`, `ai_weekly_usage?: number`, and `ai_quota_reset_at?: string | null`.
*   **[x] Replace Remaining Raw `localStorage` Usages:**
    *   Replaced direct `localStorage` calls in `src/lib/sounds.ts` and `src/app/(app)/(protected)/practice/sessions/page.tsx` with `safeLocalStorage`.
*   **[x] Atomic Database Increments for Exam Submissions:**
    *   In `src/app/api/exam/submit/route.ts`, implemented atomic RPC `increment_user_subject_stats` with safe fallback, and added SQL schema `db_schemas/increment_user_subject_stats.sql`.

---

## ✅ Completed & Live in Production
*   **[x] AI Persona Rebranded to "Temari AI":** Renamed from Mr. Helper to Temari AI across prompts, drawers, paywalls, and headers.
*   **[x] 100% Cloud-Native Payment Pipeline:** Serverless Gemini Vision on Vercel (`/api/payments/submit`) + Telegram instant approve/reject webhook callback (`/api/bot/webhook`). Zero laptop dependency, zero tunnels.
*   **[x] Individual Weekly Quota Engine:**
    *   `ai_weekly_usage` (INT) and `ai_quota_reset_at` (TIMESTAMPTZ) integrated in `profiles`.
    *   **Free Tier:** 5 AI questions/week (hook for free students to test Temari AI before upgrade).
    *   **Premium Tier:** 150 AI questions/week (comprehensive exam prep allowance, prevents automated scraping).
    *   7-day rolling auto-reset with real-time validation in `/api/ai/tutor`.
*   **[x] Slick Profile Usage Dashboard & Redesign:**
    *   Interactive visual meter on `/profile` displaying live usage vs weekly cap with dynamic color status.
    *   Countdown to reset date and instant upgrade button for free users.
    *   Modern glassmorphic student hero card, subject mastery progress bars, and unified settings.
*   **[x] Interactive Student Verification Hub:** 5-minute live countdown timer, 3.5s real-time approval polling, and celebratory confetti with heartwarming congratulations screen.
*   **[x] Automatic Supabase Storage Auto-Purge:** Processed receipt screenshots are automatically deleted from Supabase storage bucket upon approval or rejection, keeping storage usage at ~0 MB forever.
*   **[x] Mobile Upload Image Compression:** Client-side canvas compression reduces mobile camera photos from 10MB to ~200KB in 100ms, completely avoiding Vercel's 4.5MB payload limit.
*   **[x] CGNAT Rate Limiter Hardening:** Switched rate limiter keys from shared carrier IP to `session.telegram_id` and expanded AI Tutor conversational allowance to 15 req/min.
*   **[x] Exam Session Empty State:** In-page friendly empty-state card replacing confusing redirect loop when past papers for a specific year are not yet uploaded.
*   **[x] Zero-Hydration-Flash Streaks:** Real server-side fetch from `profiles.daily_streak` in protected layout.
*   **[x] Web Admin Short Notes Portal:** Dedicated admin interface at `/admin/upload-notes` with 100% deterministic exam_type, course, and chapter title metadata.
*   **[x] AI Context Optimization & Model Uniformity Sprint (Oct 2026):**
    *   Standardized all AI endpoints (`tutor`, `quiz`, `tip`, `submit`, `transform`) to `gemini-1.5-flash`, resolving model name bugs and rate-limiting cascades.
    *   Eliminated 4,000-character note truncation bug in `/api/ai/tutor`, expanding context window to 100,000 characters so Gemini receives entire chapter notes.
    *   Implemented "Anchor & Expander" pedagogical grounding prompt: uses study notes as curriculum foundation while drawing on general academic intelligence to explain the *why*, unpack formulas, and provide intuitive analogies.
    *   Integrated **"✨ Ask AI"** action button directly into the floating text highlighter and existing highlight popovers in `StudyNotesView.tsx`.
    *   Enabled note-level response caching in `ai_responses_cache` via `note:${noteId}` prefix for instant chapter takeaways and Amharic summaries with zero redundant API calls.

---

## 🎯 Next High-Impact Product Initiatives (Immediate Execution)

### 🚀 Priority 1: Multi-Format Document Ingestion Pipeline (The Content Engine)
*   **[ ] Multi-File Admin Batch Ingestion (`/admin/upload-notes`):**
    *   Enable drag-and-drop batch upload for PDF, Word (`.doc`, `.docx`), PowerPoint (`.ppt`, `.pptx`), and plain text files.
    *   Pass raw files directly to Gemini 1.5 Flash File API to automatically extract chapter titles, convert fragmented slide bullets into continuous study notes, format tables in Markdown, and render math equations in LaTeX (`$...$`).
    *   Batch persist transformed notes directly to the Supabase `study_notes` table under the selected course and exam category.
    *   Fill missing short note coverage across all 15 freshman university courses and Grade 12 subjects.

### 🧠 Priority 2: "AI Recovery Drill" (Adaptive Practice from Student Mistakes)
*   **[ ] Post-Exam Error Diagnosis & Personalized Drill:**
    *   Analyze student exam results to detect specific topic weaknesses (e.g., *"Missed 3 questions on Elasticity of Demand"*).
    *   Provide one-tap **"Start AI Recovery Drill"**: dynamically generates 3-5 targeted practice questions focusing on the student's exact misconceptions.
    *   Provide step-by-step guidance after each question with gamified bonus XP for mastering previously failed concepts.

### ⚡ Priority 3: Zero-Wait Payment Auto-Approval Engine (Instant Access Unlock)
*   **[ ] High-Confidence Automated Upgrade:**
    *   Enhance `/api/payments/submit` Gemini Vision OCR verification to auto-approve clean, verified receipts:
        *   Receipt amount >= 199 ETB.
        *   Valid, non-duplicate CBE / Telebirr transaction ID.
        *   Screenshot timestamp matches today's date.
    *   Immediately set `subscription_status = 'premium'` without waiting for manual admin approval.
    *   Flag ambiguous, edited, or unrecognized receipts for human admin review.

### 📶 Priority 4: Low-Bandwidth Resilience & Offline Note Study Mode
*   **[ ] IndexedDB Pre-caching for Ethiopian Network Realities:**
    *   Pre-cache read study notes, chapter takeaways, and user highlights in browser IndexedDB/localStorage.
    *   Allow offline note reading and highlight creation in campus dorms and libraries with zero data consumption.
    *   Gracefully synchronize reading progress and XP when internet connection is restored.

---

## 🎨 Completed: Unified Color Scheme & Bespoke Mobile Design Architecture
*   **[x] Elimination of Arbitrary Inline HSL Brackets:**
    *   Purged 150+ raw inline `hsl(...)` brackets across `MasteryTree`, `ProfileView`, `HomeHub`, `ExamWorkspace`, `upgrade`, `AdminAIView`, and `PaymentActions`.
    *   Implemented full RGB CSS variable alpha channel support (`rgb(var(--...-rgb) / <alpha-value>)`) in `globals.css` and `tailwind.config.ts`.
    *   Mapped all semantic colors to the 6-pillar palette: `primary`, `accent-gold` (streaks/warning/tips), `accent-emerald` (success/accuracy), `accent-blue` (telegram/info), `accent-purple` (subject/freshman), and `accent-rose` (urgent/errors).
*   **[x] Purge Raw Hex Codes & Anti-Halation Calibrations:**
    *   Purged hardcoded `#229ED9`, `#1C88BA`, `#1E8CC0` in `TopHeader`, `LandingPage`, etc., into semantic `accent-blue`.
    *   Calibrated dark mode luminance values to prevent dark-mode vibration/halation on midnight slate (`hsl(224, 26%, 7%)`).
*   **[x] Harmonize Neutral Typography & Contrast:**
    *   Standardized text hierarchy on semantic tokens (`text-gray-900 dark:text-gray-100`, `text-gray-500 dark:text-gray-400`).
*   **[x] Remove Lingering Colored Shadows & Legacy Brutalist Config:**
    *   Purged `shadow-primary/*` from `ExamWorkspace`, `LandingPage`, `ClientAuthDetector`, and `PWARegistry` in favor of neutral `shadow-bespoke-sm/md/lg`.
    *   Purged obsolete `brutal-sm/md/lg` from `tailwind.config.ts`.
*   **[x] Native Mobile Card & Surface Depth:**
    *   Enforced 3-tier depth model: `bg-ground` (canvas) → `bg-card` (elevated) → `bg-panel` (recessed segmented controls).

---

## 🔥 Priority 3: Subdomain Architecture (`*.temari.top`)
*   **[ ] Dynamic Routing Setup**
    *   Create `src/middleware.ts` to read hostname subdomain and rewrite routes dynamically.
    *   Add wildcard DNS record on NameSilo/Cloudflare.
    *   Build dedicated landing pages for each exam type (data-driven).

---

## 🚀 Priority 4: Growth & Intelligent CRM
*   **[ ] Intelligent Telegram Bot Engagement**
    *   Automated daily streak retention notifications via bot.
    *   Inbound funnel: post free short note previews (watermarked) into university student groups.
*   **[ ] Advanced AI & RAG (Curriculum Grounding)**
    *   Enable `pgvector` in Supabase to ground Temari AI strictly on official Ethiopian Ministry of Education textbooks.
