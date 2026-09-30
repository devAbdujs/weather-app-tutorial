# Temari App - Master Execution Roadmap (Prioritized)

*Last Updated: Sept 2026 (Audit & Hardening Sprint)*  
*Status: Production-Grade. Payments 100% cloud-native on Vercel. Full codebase audit completed across UI/UX, Data Model, API Endpoints, and Recent Commits.*

---

## 🛠️ Codebase Audit & System Hardening (Identified Fixes)

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

---

## 📚 Content Ingestion & Bulk Short Notes
*   **[ ] Bulk Past Papers & Short Notes Digestion**
    *   Batch import Grade 12, Freshman, and Exit exam short notes via `/admin/upload-notes` or local CLI (`scripts/ingest_note_pdf.py`).
    *   Ensure all subjects (Biology, Physics, Chemistry, Math, Aptitude, Economics) have complete chapter notes with KaTeX math rendering.

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
