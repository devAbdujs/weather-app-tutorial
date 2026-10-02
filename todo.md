# Temari App - Master Execution Roadmap (Prioritized)

*Last Updated: October 2026 (Exhaustive Codebase Audit Sprint)*  
*Status: Production-Grade. Payments 100% cloud-native on Vercel. Full codebase audit completed across UI/UX, Data Model, API Endpoints, Exam Workspaces, and Recent Commits.*

---

## 🔬 Exhaustive Micro-Level Codebase Audit & Defect Backlog (October 2026)

An exhaustive, end-to-end code audit of every section, subsection, icon, button, tab, exam type (`entrance`, `freshman`, `exit`), route, and API endpoint was conducted. Below is the prioritized defect backlog for phased execution:

### 🔴 Phase 1: Critical P0 Flaws (Payment Fraud Flags, Session Sync & Blocked Workflows)
*   [x] **Fix Payment OCR Fraud Threshold Mismatch (False-Positive Fraud Flagging):**
    *   **Files:** [`src/app/api/payments/submit/route.ts#L12`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/payments/submit/route.ts#L12), [`L103`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/payments/submit/route.ts#L103) vs [`src/app/(app)/(protected)/upgrade/page.tsx#L524`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/upgrade/page.tsx#L524) and [`src/components/ai/AITutorDrawer.tsx#L147`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L147).
    *   **Flaw:** In `submit/route.ts`, `PAYMENT_AMOUNT_ETB = 200`, and Gemini Vision is instructed: `Set "is_suspicious" to true if amount is less than 200 ETB`. But the UI in `upgrade/page.tsx` and `AITutorDrawer.tsx` directs students to pay **199 ETB**.
    *   **Impact:** 100% of legitimate paying students paying 199 ETB get auto-flagged as `is_suspicious: true` and are told their payment requires manual admin investigation.
    *   **Fix:** Align `PAYMENT_AMOUNT_ETB = 199` in `submit/route.ts`.
*   [x] **Fix Missing `subscription_status` in Protected Layout Session Hydration:**
    *   **Files:** [`src/app/(app)/(protected)/layout.tsx#L20-L36`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/layout.tsx#L20-L36) & [`src/components/auth/StoreInitializer.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/auth/StoreInitializer.tsx).
    *   **Flaw:** `layout.tsx` only selects `daily_streak` from `profiles` and ignores `subscription_status`, `stream`, and `target_exam`. `formattedProfile` does not include `subscription_status`.
    *   **Impact:** `useAppStore.userProfile.subscription_status` is permanently `undefined` on page loads. Premium subscribers continue to see the `👑 PRO Upgrade` button in [`TopHeader.tsx#L108`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/TopHeader.tsx#L108).
    *   **Fix:** Include `subscription_status`, `stream`, `target_exam`, `ai_weekly_usage`, and `ai_quota_reset_at` in `layout.tsx` profile query and pass them into `formattedProfile`.
*   [x] **Fix Dead Center FAB Trigger on Practice, Mastery & Profile Tabs:**
    *   **Files:** [`src/components/layout/BottomNav.tsx#L27-L31`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/BottomNav.tsx#L27-L31), [`src/app/(app)/(protected)/dashboard/page.tsx#L13`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/dashboard/page.tsx#L13), [`src/components/layout/DashboardShell.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/DashboardShell.tsx).
    *   **Flaw:** Center orange FAB calls `setSetupModalType('exam')`. However, `<ExamSetupModal />` is only mounted inside `dashboard/page.tsx`.
    *   **Impact:** Tapping the center FAB while on `/practice`, `/mastery`, or `/profile` does nothing.
    *   **Fix:** Move `<ExamSetupModal />` to `DashboardShell.tsx` so the center FAB launches the modal across all tabs.
*   [x] **Fix Dropped Exam Stats, Streak Updates & Bookmarks for Web Students:**
    *   **Files:** [`src/components/exam/ExamWorkspace.tsx#L179`](file:///home/abdu/scraping/ethio-exam-app/src/components/exam/ExamWorkspace.tsx#L179), [`L227`](file:///home/abdu/scraping/ethio-exam-app/src/components/exam/ExamWorkspace.tsx#L227).
    *   **Flaw:** `toggleBookmark` and `handleFinish` check `if (!user?.id) return;` using `useTelegram()`.
    *   **Impact:** For web/desktop students (authenticated via OTP/OIDC session cookie), `user` is null. Exam results submitted to `/api/exam/submit` and daily streak updates via `updateDailyStreak()` are silently skipped and lost.
    *   **Fix:** Replace `if (!user?.id) return;` with server-session validation or check `userProfile?.telegram_id || user?.id`.

---

### 🟡 Phase 2: High Priority P1 Flaws (Mode Overrides & UI Polish)
*   [x] **Fix Jumpy Text Selection, Snippet Highlighting & "Ask AI" Menu in Notes:**
    *   **Files:** [`src/components/dashboard/StudyNotesView.tsx#L233-L270`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/StudyNotesView.tsx#L233-L270), [`#L272-L281`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/StudyNotesView.tsx#L272-L281), [`#L363`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/StudyNotesView.tsx#L363), and [`tailwind.config.ts#L87-L91`](file:///home/abdu/scraping/ethio-exam-app/tailwind.config.ts#L87-L91).
    *   **Flaws & Root Causes:**
        1. *CSS Transform Collision:* The toolbar container pairs `-translate-x-1/2` with `animate-scale-bounce`. The `scale-bounce` keyframe specifies `transform: scale(...)`, which overrides Tailwind's `translateX(-50%)` during animation, causing the toolbar to violently jump horizontally by 50% width on mount.
        2. *Zero-Hysteresis Flip Boundary (130px Jump):* `const top = rect.top < 130 ? rect.bottom + 10 : rect.top - 54;` creates a harsh flip threshold. Any slight drag of the selection handle or minor scroll near the fold causes the toolbar to violently jump 150px back and forth between above and below the text.
        3. *Viewport vs Scroll Container Desync:* `#main-scroll-area` is the scrollable container. When scrolling during selection, static `{ top, left }` state does not update with scroll position, freezing the toolbar until the scroll stops and then snapping erratically.
        4. *Handle Drag Erases Coordinates:* `handlePointerDown` immediately wipes `setSelectionCoords(null)` and `setSelectedText('')` on any touch outside the toolbar, interpreting native mobile selection handle touches as "outside clicks".
        5. *Native Mobile Callout Menu Occlusion:* Native iOS/Android context menus popup directly above the selection, clashing with Temari's floating menu in the exact same coordinates.
    *   **Technical Fix:**
        - Remove conflicting `scale-bounce` transform or isolate centering via a wrapper div (`left: 50%` wrapper).
        - Add scroll listener to `#main-scroll-area` to sync toolbar position during active scrolling with `requestAnimationFrame`.
        - Add 40px hysteresis buffer to the flip threshold (flip down when `< 110px`, flip up when `> 160px`).
        - Don't clear selection on `pointerdown` if the touch is within `#note-content` while selection is active.
        - Alternatively implement a docked mobile action pill above the bottom footer (`[ 🎨 Colors | ✨ Ask AI | ✕ ]`) when text is selected, matching Kindle/Medium mobile UX for 100% stable, zero-jump interaction.

*   [x] **Fix ExamSetupModal Dropping `mode` (Practice Drill Overridden to Timed Simulator):**
    *   **Files:** [`src/components/dashboard/ExamSetupModal.tsx#L119-L128`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/ExamSetupModal.tsx#L119-L128) vs [`src/app/(app)/(protected)/exam/session/page.tsx#L25`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/exam/session/page.tsx#L25).
    *   **Flaw:** `ExamSetupModal` holds mode state (`'practice'`), but `mode` is never added to `params` in `handleStart()`.
    *   **Impact:** In `exam/session/page.tsx`, `mode` defaults to `'exam'`. Students selecting "Quick Drill" are forced into timed simulator mode with an active countdown timer and no instant answer explanations.
    *   **Fix:** Append `params.set('mode', mode)` in `ExamSetupModal.tsx#L124`.
*   [x] **Purge and Remove Flashcard System Entirely (Routes, Components, Navigation & DB):**
    *   **Files to Remove/Update:**
        - Route: [`src/app/(app)/(protected)/flashcards/[subject]/page.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/flashcards/[subject]/page.tsx) (delete entire route directory).
        - Component: [`src/components/flashcards/FlashcardDeck.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/flashcards/FlashcardDeck.tsx) (delete component).
        - Modal: [`src/components/dashboard/ExamSetupModal.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/ExamSetupModal.tsx) (remove `'flashcards'` from `setupModalType`, mode tabs, titles, and routing).
        - Practice Hub: [`src/components/practice/PracticeHub.tsx#L196-L198`](file:///home/abdu/scraping/ethio-exam-app/src/components/practice/PracticeHub.tsx#L196-L198) (remove `mode === 'flashcards'` navigation and triggers).
        - Home Hub: [`src/components/dashboard/HomeHub.tsx#L258`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/HomeHub.tsx#L258) (remove flashcard hero button).
        - Shells & Nav: [`src/components/layout/BottomNav.tsx#L22`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/BottomNav.tsx#L22) (remove `/flashcards/` focus mode check).
        - Product Tour: [`src/components/navigation/ProductTour.tsx#L29`](file:///home/abdu/scraping/ethio-exam-app/src/components/navigation/ProductTour.tsx#L29) (remove flashcard tour step).
        - State & Types: [`src/store/useAppStore.ts#L3`](file:///home/abdu/scraping/ethio-exam-app/src/store/useAppStore.ts#L3) (update `SetupModalType = 'exam' | 'notes' | null`), [`src/types/index.ts`](file:///home/abdu/scraping/ethio-exam-app/src/types/index.ts) (remove `Flashcard` interface), and [`src/store/useGamificationStore.ts#L30`](file:///home/abdu/scraping/ethio-exam-app/src/store/useGamificationStore.ts#L30) (remove `'deck_completed'`).
        - Bot Webhook: [`src/app/api/bot/webhook/route.ts#L81`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/bot/webhook/route.ts#L81) (clean up copy).
    *   **Rationale:** Flashcards are being sunset in favor of deep Chapter Note study and Exam Practice questions, eliminating redundant route maintenance and client bundle overhead.
*   [x] **Implement Server-Side Highlight Synchronization:**
    *   **Files:** [`src/components/dashboard/StudyNotesView.tsx#L140-L157`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/StudyNotesView.tsx#L140-L157) & [`src/app/api/highlights/route.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/highlights/route.ts).
    *   **Flaw:** `StudyNotesView.tsx` only reads and writes highlights to `localStorage`. The server endpoint `/api/highlights` is never called.
    *   **Impact:** Student highlights do not sync across devices and are lost if Telegram clears browser storage.
    *   **Fix:** Fetch existing highlights from `/api/highlights` on note mount, and persist highlights to the server on add/remove.

---

### 🟢 Phase 3: Medium Priority P2 Flaws (Math Rendering, PostgREST Limits & Housekeeping)
*   [x] **Fix PostgREST 1,000-Row Truncation in Entrance Year Counts:**
    *   **Files:** [`src/app/actions/practice.ts#L38-L48`](file:///home/abdu/scraping/ethio-exam-app/src/app/actions/practice.ts#L38-L48).
    *   **Flaw:** `getEntranceYearCounts` fetches all rows with `.select('year_ec')`. PostgREST defaults to a limit of 1,000 rows.
    *   **Impact:** In subjects with >1,000 questions, older exam years get truncated and show 0 counts.
    *   **Fix:** Replaced full-row select with parallel `{ count: 'exact', head: true }` HEAD queries per exam year, completely bypassing the 1,000-row PostgREST payload limit.
*   [x] **Expand KaTeX Regex to Support Standard LaTeX Delimiters `\( ... \)` and `\[ ... \]`:**
    *   **Files:** [`src/components/MathText.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/MathText.tsx), [`src/lib/latex.ts`](file:///home/abdu/scraping/ethio-exam-app/src/lib/latex.ts), [`src/components/ai/AITutorDrawer.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx), [`src/components/AIResponse.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/AIResponse.tsx), and [`src/components/dashboard/MarkdownRenderer.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/MarkdownRenderer.tsx).
    *   **Flaw:** Regex only matched `$...$` and `$$...$$`, and failed on `\( ... \)`, `\[ ... \]`, double-escaped backslashes, unescaped JSON control characters (`\x0crac`), and bare math commands without delimiters.
    *   **Impact:** Questions, options, official explanations, and AI responses containing `\( ... \)` or bare LaTeX displayed raw LaTeX code.
    *   **Fix:** Built `@/lib/latex.ts` engine with full normalization, multi-delimiters (`$$`, `\[`, `\(`, `$`, environments), KaTeX memoization cache, currency preservation, and integrated it across MathText, AI Tutor, and Study Notes.
*   [x] **Remove Dead Code `ClientAuthDetector.tsx`:**
    *   **Files:** [`src/components/auth/ClientAuthDetector.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/auth/ClientAuthDetector.tsx).
    *   **Flaw:** Component is completely orphaned and unreferenced in the codebase.
    *   **Fix:** Deleted orphaned `src/components/auth/ClientAuthDetector.tsx`.
*   [x] **Contextual Subject Navigation from MasteryTree to Practice:**
    *   **Files:** [`src/components/dashboard/MasteryTree.tsx#L534`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/MasteryTree.tsx#L534) and [`src/components/practice/PracticeHub.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/practice/PracticeHub.tsx).
    *   **Flaw:** Tapping "Practice" navigates to `/practice` without subject context.
    *   **Fix:** Passed `subject` query param from `MasteryTree.tsx`, and updated `PracticeHub.tsx` to automatically route incoming subject queries straight into the subject's practice sessions.
*   [x] **Harden OTP Verification Against Brute Force & SSR Crashes:**
    *   **Files:** [`src/app/api/auth/verify-otp/route.ts#L23`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/auth/verify-otp/route.ts#L23), [`L45`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/auth/verify-otp/route.ts#L45) and [`src/app/api/payments/status/route.ts#L28`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/payments/status/route.ts#L28).
    *   **Flaw:** `.single()` throws on missing rows, and OTP verification lacks attempt rate limiting.
    *   **Fix:** Replaced `.single()` with `.maybeSingle()` across `verify-otp/route.ts` and `payments/status/route.ts`, and implemented IP-based rate limiting (5 attempts/min) using `checkRateLimit`.

---

### 🌐 Phase 4: Dedicated Subdomain Architecture & Exam-Specific Portals
*   [x] **Multi-Subdomain Routing (`entrance.temari.top`, `freshman.temari.top`, `exit.temari.top`) & Root Pitch Landing Page:**
    *   **Files Updated/Created:**
        - Next.js Middleware: [`src/middleware.ts`](file:///home/abdu/scraping/ethio-exam-app/src/middleware.ts) (detect host, parse subdomains, forward `x-temari-subdomain` and `x-temari-target-exam`, set `temari_portal` cookie, and auto-route authenticated users).
        - Subdomain Utility: [`src/lib/subdomains.ts`](file:///home/abdu/scraping/ethio-exam-app/src/lib/subdomains.ts) (`parseSubdomain`, `SUBDOMAIN_CONFIGS`, `getSubdomainUrl`).
        - Root Landing Page & Marketing: [`src/app/(app)/(public)/page.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(public)/page.tsx) and [`src/components/marketing/LandingPage.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/marketing/LandingPage.tsx) (subdomain-scoped SEO metadata, schema.org JSON-LD educational organization structured data, dynamic hero messaging, and 3 interactive exam path cards with portal switching & exam pre-seeding).
        - Session & SSO Cookies: [`src/lib/session.ts`](file:///home/abdu/scraping/ethio-exam-app/src/lib/session.ts), [`src/utils/supabase/server.ts`](file:///home/abdu/scraping/ethio-exam-app/src/utils/supabase/server.ts), [`src/utils/supabase/client.ts`](file:///home/abdu/scraping/ethio-exam-app/src/utils/supabase/client.ts), [`src/app/actions/user.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/actions/user.ts), [`src/app/api/auth/session/route.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/auth/session/route.ts), [`src/app/api/auth/verify-otp/route.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/auth/verify-otp/route.ts), [`src/app/api/auth/oidc/route.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/auth/oidc/route.ts), [`src/app/api/auth/telegram/web/route.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/auth/telegram/web/route.ts) (cross-subdomain cookie domain `.temari.top` with automatic localhost fallback).
        - Unit Tests: [`__tests__/subdomains.test.ts`](file:///home/abdu/scraping/ethio-exam-app/__tests__/subdomains.test.ts) (verifying hostname parsing and subdomain configs).
    *   **Strategy & Rationale:**
        1. *SEO Dominance:* Ethiopian student search queries are strictly segmented by persona ("Grade 12 EUEE past papers", "University freshman remedial courses", "Ethiopian university exit exam questions"). Dedicated subdomains maximize search engine rankings for each keyword group.
        2. *Zero-Friction Conversion:* When a Grade 12 student visits `entrance.temari.top`, the entire interface, subjects, and study materials are pre-filtered to Grade 12 EUEE without cognitive overload from university departments.
        3. *Root Hub (`temari.top`):* Acts as the high-impact brand pitch showcasing 31,000+ questions, Temari AI Tutor, and Chapter Notes with 3 hero CTA buttons:
           - 🎓 **Grade 12 Entrance (EUEE)** -> `entrance.temari.top`
           - 🏛️ **University Freshman** -> `freshman.temari.top`
           - 🏆 **University Exit Exam** -> `exit.temari.top`

---

### 🤖 Phase 5: Interactive Telegram Bot & Navigation Architecture
*   [x] **Multi-Button Telegram Bot Hub & Deep-Link Navigators:**
    *   **Files:** [`src/app/api/bot/webhook/route.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/bot/webhook/route.ts), [`src/lib/telegramBot.ts`](file:///home/abdu/scraping/ethio-exam-app/src/lib/telegramBot.ts), and [`__tests__/telegramBot.test.ts`](file:///home/abdu/scraping/ethio-exam-app/__tests__/telegramBot.test.ts).
    *   **Completed Implementation:**
        1. *Direct Deep-Link Navigation Grid (Inline Buttons):*
           - `[ 🎓 Matric / Grade 12 EUEE ]` → Deep-link Mini App launch to Grade 12 entrance portal.
           - `[ 🏛️ University Freshman ]` → Deep-link Mini App launch to freshman remedial portal.
           - `[ 🏆 University Exit Exam ]` → Deep-link Mini App launch to university exit exam portal.
           - `[ ⚡ My Stats & Streak ]` → Instant in-chat profile card (XP, level 1-7, streak, questions solved, accuracy %, top subject breakdown).
           - `[ 🔄 Change Track ]` → In-chat interactive exam stream selector (Entrance, Freshman, Exit).
           - `[ 👑 PRO Upgrade ]` → In-chat Telebirr and CBE payment instructions + direct app link.
        2. *Interactive Callback Queries (`callback_query`):*
           - Handled inline button clicks without leaving Telegram chat (`nav:menu`, `nav:stats`, `nav:quiz`, `nav:tracks`, `track:<exam>`, `nav:upgrade`).
           - Dynamic in-place message updates (`editMessageText`) with plain-text fallback on entity parser errors.
        3. *Daily Question of the Day / Morning Micro-Drill:*
           - Random question fetching by user's exam track with clean Telegram HTML formatting.
           - 4 inline choice buttons (`[A]`, `[B]`, `[C]`, `[D]`).
           - Instant answer key verification, awarding +10 XP and updating daily streak in DB.
           - Includes `[ 🧠 Ask Temari AI in App ]` deep-link button straight into practice mode.
        4. *Rich Slash Commands:*
           - `/menu` or `/start` (with deep-link argument support: `/start quiz`, `/start stats`, `/start upgrade`).
           - `/quiz` → Instant single question drill.
           - `/stats` → Display user rank, streak, total XP, level, and scholar tree progress.
           - `/upgrade` → Display subscription status and Telebirr/CBE instructions.
           - `/help` → Command index and learning guide.
        5. *Resilience & Auto-Registration:*
           - Auto-creates student profile upon Telegram bot interaction.
           - Complete test coverage in `__tests__/telegramBot.test.ts` (11 suites, 89/89 tests passing).

---

### 🎨 Phase 6: Brand Identity, New Logo & Global UI/Color Scheme Refresh (Final Polish)
*   [x] **Migrate to New Brand Logo (`public/assets/New_temari_logo.png`) & Harmonize Theme Palette:**
    *   **Files Updated:**
        - Header & Brand: [`src/components/layout/TopHeader.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/TopHeader.tsx) (migrated to `/assets/temari_icon.png` with pixel-perfect containment, padding, and subtle primary border).
        - Landing Page & Navigation: [`src/components/marketing/LandingPage.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/components/marketing/LandingPage.tsx) (replaced placeholder boxes with high-res `/assets/temari_icon.png` across header navbar and footer).
        - PWA & Manifest: [`public/manifest.json`](file:///home/abdu/scraping/ethio-exam-app/public/manifest.json) (updated to high-res `temari_icon_192.png`, `temari_icon.png`, and brand theme color `#1155A5`).
        - Layout & Metadata: [`src/app/layout.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/app/layout.tsx) & [`src/app/(app)/(public)/page.tsx`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(public)/page.tsx) (configured `metadataBase`, icons, OpenGraph image cards, Twitter cards, and Schema.org JSON-LD with new brand assets).
        - Color Tokens & Theme: [`src/app/globals.css`](file:///home/abdu/scraping/ethio-exam-app/src/app/globals.css) (harmonized `--accent-blue` and `--accent-blue-rgb` with the new Temari logo academic royal blue `#1155A5` in light mode and `#549EF7` in dark mode).
    *   **Result:**
        - High-resolution, lightweight SVG/PNG brand identity with zero distortion across devices, complete PWA maskable icons, and full social sharing preview support.

---

## 🧠 Temari AI Integration Deep-Dive: Grounding, Context, Logic & UX Audit

A forensic analysis of the AI integration across short notes, questions, exams, prompt grounding, context payloads, and user interface workflows was conducted. Below are the critical logical flaws, grounding gaps, and UX defects identified:

### 🔴 Critical AI Logic & Grounding Flaws
*   [x] **Critical User Query Overwrite Bug on First Turn:**
    *   **Files:** [`src/app/api/ai/tutor/route.ts#L120`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L120), [`#L223-L225`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L223-L225).
    *   **Flaw:** In `route.ts`, `isFollowUpChat = cleanedHistory.length > 1`. On the very first user message (whether a custom question typed in the box or "✨ Explain Highlighted Text"), `cleanedHistory.length === 1`. Because `1 > 1` is false, `finalMessages` drops the student's actual text and sends `[{ role: 'user', content: defaultUserPrompt }]` (`"Hello! I need help with this."`).
    *   **Impact:** Any custom query typed into the drawer on turn 1 is silently erased! Gemini responds with a generic *"Hello! What can I help you with?"* instead of answering the student's question.
    *   **Technical Fix:** If `cleanedHistory.length > 0`, use `cleanedHistory`. Only fall back to `defaultUserPrompt` if `cleanedHistory` is empty.

*   [x] **Drawer Chat History Not Reset Across Question Navigations:**
    *   **Files:** [`src/components/ai/AITutorDrawer.tsx#L70-L88`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L70-L88).
    *   **Flaw:** `useEffect` only resets messages if `messages.length === 0`. When a student finishes asking about Question 1, closes the drawer, moves to Question 2, and taps AI Tutor, `messages` retains Question 1's chat!
    *   **Impact:** When the student asks a question on Question 2, `chatHistory` from Question 1 is submitted alongside Question 2's context, causing severe model confusion, hallucinated explanations, and mismatched answers.
    *   **Technical Fix:** Add `question?.id` and `noteId` to a reset `useEffect`: clear `messages` and re-seed the welcome card whenever the active question or note changes.

*   [x] **Purge AI "Hint" Functionality Across Codebase (ExamWorkspace, AITutorDrawer, /api/ai/tutor):**
    *   **Files to Update:**
        - Exam Workspace: [`src/components/exam/ExamWorkspace.tsx#L88-L133`](file:///home/abdu/scraping/ethio-exam-app/src/components/exam/ExamWorkspace.tsx#L88-L133) (remove `handleGetHint`, `inlineHint`, `isHintLoading`, and the inline hint button/card).
        - AI Drawer: [`src/components/ai/AITutorDrawer.tsx#L98-L111`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L98-L111) & [`#L224-L233`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L224-L233) (remove `'hint'` from `sendMessage` types and the "Get a Guiding Hint" quick prompt card).
        - AI Route: [`src/app/api/ai/tutor/route.ts#L21`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L21), [`#L72`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L72), [`#L79`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L79) (remove `'hint'` from `RequestSchema`, `userPrompts.hint`, and related logic).
    *   **Rationale:** The hint feature adds unnecessary complexity and superficial suggestions. Removing hints streamlines the interface and focuses Temari AI on deep interactive tutoring, full concept explanations, and contextual question assistance.

*   [x] **Diagram-Based Questions Fail AI Explanations (Missing Multimodal Vision):**
    *   **Files:** [`src/components/exam/ExamWorkspace.tsx#L100`](file:///home/abdu/scraping/ethio-exam-app/src/components/exam/ExamWorkspace.tsx#L100) & [`src/app/api/ai/tutor/route.ts#L62-L68`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L62-L68).
    *   **Flaw:** Questions featuring diagrams store `currentQ.image_url`, but this URL is never forwarded to `/api/ai/tutor`, and `buildPrompt` only handles text strings.
    *   **Impact:** In physics (circuit diagrams, pulleys, vectors) and biology (cell structures, anatomy), Gemini cannot see the diagram and responds with *"I cannot see the diagram you are referring to."*
    *   **Technical Fix:** Forward `imageUrl` to `/api/ai/tutor` and pass the image as a multimodal `image` part to Gemini 1.5 Flash.

---

### 🟡 AI UI/UX Defects & Interaction Friction
*   [x] **Dead / Placeholder Camera & Microphone Buttons in AI Drawer:**
    *   **Files:** [`src/components/ai/AITutorDrawer.tsx#L486-L502`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L486-L502).
    *   **Flaw:** Tapping the Camera or Mic icons in the input bar executes: `toast.info("Photo scan: Upload question image for Gemini analysis")` and `toast.info("Voice query: Speak your question to Teme")`.
    *   **Impact:** High student frustration when discovering prominent input controls are non-functional mockups.
    *   **Technical Fix:** Either connect real image upload (OCR via Gemini Vision) and Web Speech API, or hide these buttons until functionality is deployed.

*   [x] **Socratic Guard Bypass in Timed Exam Simulator:**
    *   **Files:** [`src/app/api/ai/tutor/route.ts#L70-L75`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L70-L75).
    *   **Flaw:** During timed simulator sessions, Temari AI lacks an explicit guard against revealing answers to students who ask directly in chat before submitting the exam.
    *   **Impact:** During timed exam simulation mode, a student can simply ask *"What is the answer?"* in chat, and Temari AI will reveal the answer immediately.
    *   **Technical Fix:** Enforce Socratic non-disclosure rules whenever `isSimulator === true` or mode is `'exam'` until the student has submitted the exam.

*   [x] **Mobile Virtual Keyboard Drawer Occlusion:**
    *   **Files:** [`src/components/ai/AITutorDrawer.tsx#L315`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L315).
    *   **Flaw:** Drawer container has fixed `max-h-[92vh] h-[92vh]` without dynamic viewport units (`dvh`) or visual viewport resize handlers.
    *   **Impact:** On iOS Safari and Android Chrome, opening the software keyboard covers the chat input bar or pushes the drawer header off-screen.
    *   **Technical Fix:** Use `max-h-[90dvh]` and bind `interactive-widget=resizes-content` with smooth viewport scrolling.

---

## ⚡ Speed, Latency & Bandwidth Optimization Roadmap (Low-Data Mobile Realities)

A deep-dive profiling audit of network payloads, streaming latencies, database roundtrips, and client bundle sizes was conducted for the Temari platform, focusing specifically on Ethiopian cellular constraints (high RTT to edge servers, 2G/3G/4G bandwidth caps, and lower-end mobile CPU constraints). Below is the prioritized execution roadmap:

### 🚀 Track 1: AI Latency, Token Streaming & Bandwidth Reductions
*   [x] **Eliminate React Main-Thread Jank During Token Streaming:**
    *   **Files:** [`src/components/ai/AITutorDrawer.tsx#L200-L207`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L200-L207) and [`#L450-L455`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L450-L455).
    *   **Root Cause:** Synchronous `setMessages(prev => prev.map(...))` on every stream chunk read forces `AITutorDrawer` to re-render 60-100 times per second. Inside each render, `<ReactMarkdown>` with `remarkMath` and `rehypeKatex` re-parses the entire markdown syntax tree and re-renders KaTeX DOM synchronously.
    *   **Impact:** 100% CPU lockup and severe UI jank on typical Ethiopian student Android devices (Tecno, Infinix, Samsung A-series) while Temari AI responds.
    *   **Technical Fix:** Buffer incoming stream chunks and update React state via a throttled animation frame (`requestAnimationFrame` or ~120ms debounce), or render plain text during active streaming and switch to full Markdown/KaTeX upon stream completion.

*   [x] **Strip 100 KB Payload Overhead on Multi-Turn Note Inquiries:**
    *   **Files:** [`src/components/ai/AITutorDrawer.tsx#L147-L161`](file:///home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx#L147-L161) and [`src/app/api/ai/tutor/route.ts#L44`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L44).
    *   **Root Cause:** In note mode, the client uploads the entire 100,000-character `noteText` in the JSON request body on **every follow-up question**.
    *   **Impact:** On 2G/3G connections with <200 kbps upload speeds, uploading ~100 KB takes 2-4 seconds *before* the server can even initiate the Gemini prompt.
    *   **Technical Fix:** Send `noteText` only on the initial turn. For follow-up turns, pass `noteId` and rely on existing conversational history in `chatHistory`, saving ~100 KB of cellular upload bandwidth per question.

*   [x] **Parallelize AI Database Overhead & Pre-Gemini Verification:**
    *   **Files:** [`src/app/api/ai/tutor/route.ts#L126-L219`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tutor/route.ts#L126-L219).
    *   **Root Cause:** The tutor route executes 3 sequential roundtrips to Supabase before calling Gemini: (1) `profiles` lookup for weekly quota, (2) `profiles` update if reset timestamp expired, (3) `ai_responses_cache` lookup for cache hit.
    *   **Impact:** Cross-continental RTT between Ethiopian mobile clients, Vercel Edge, and Supabase Postgres is ~150-250ms per roundtrip. 3 sequential queries add 450-750ms of pure latency before the first AI token is requested.
    *   **Technical Fix:** Run profile quota check and cache check concurrently with `Promise.all([fetchProfile, checkCache])`, or combine into a single PostgreSQL RPC `check_ai_quota_and_cache(telegram_id, question_id, prompt_type)`.

*   [x] **Cache Generated AI Quizzes & Eliminate Blocking Spinner:**
    *   **Files:** [`src/app/api/ai/quiz/route.ts#L77-L86`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/quiz/route.ts#L77-L86).
    *   **Root Cause:** `/api/ai/quiz` uses `generateObject` which blocks for 4-8 seconds while Gemini generates 3 questions in JSON mode. Furthermore, generated quizzes are never stored in `ai_responses_cache`.
    *   **Impact:** If 50 students open Chapter 1 Quiz, the server pays the 5-second latency and Gemini API tokens 50 times.
    *   **Technical Fix:** Key AI quizzes by `quiz:note:${noteId}` in `ai_responses_cache`. The first generation saves to cache; subsequent students get instant ~50ms quiz loads with zero Gemini tokens consumed.

*   [x] **Purge Orphaned `/api/ai/tip` Route:**
    *   **Files:** [`src/app/api/ai/tip/route.ts`](file:///home/abdu/scraping/ethio-exam-app/src/app/api/ai/tip/route.ts).
    *   **Root Cause:** The UI calling `/api/ai/tip` was deleted from `HomeHub.tsx` in commit `ea3c810`, but the API route, rate limiter, and prompt still exist in the repository.
    *   **Technical Fix:** Delete or formally archive `src/app/api/ai/tip/route.ts` to reduce cold-start bundles and attack surface.

---

### 📦 Track 2: Bundle Size Splitting & Critical Path Asset Optimization
*   [x] **Enable Service Worker for Telegram Mini App Users:**
    *   **Files:** [`src/components/layout/PWARegistry.tsx#L16-L17`](file:///home/abdu/scraping/ethio-exam-app/src/components/layout/PWARegistry.tsx#L16-L17).
    *   **Root Cause:** `PWARegistry.tsx` contains `if (isTelegram) return;` which prematurely aborts before registering `/sw.js`.
    *   **Impact:** Telegram Mini App accounts for >90% of students. Because the Service Worker is aborted, Telegram users never cache JavaScript chunks, CSS, or question data offline. Every session re-downloads Next.js static assets over cellular data.
    *   **Technical Fix:** Separate the install banner prompt from the Service Worker registration so `navigator.serviceWorker.register('/sw.js')` runs regardless of whether the user is inside Telegram or on standalone web.

*   [x] **Allow Cross-Origin Caching in Service Worker for Cloudinary Diagrams:**
    *   **Files:** [`public/sw.js#L43`](file:///home/abdu/scraping/ethio-exam-app/public/sw.js#L43).
    *   **Root Cause:** In `sw.js`, the caching rule checks `networkResponse.type !== 'basic'`. Cross-origin images from Cloudinary (`res.cloudinary.com`) return `type === 'cors'`, causing the service worker to reject caching them.
    *   **Impact:** Ethiopian students viewing questions with diagrams re-download 50-200 KB images on every single exam attempt.
    *   **Technical Fix:** Allow `networkResponse.type === 'cors'` (with status 200) for image assets in `sw.js` cache-first strategy.


*   [ ] **Dynamic Import of `canvas-confetti` from `CelebrationModal.tsx`:**
    *   **Files:** [`src/components/gamification/CelebrationModal.tsx#L7`](file:///home/abdu/scraping/ethio-exam-app/src/components/gamification/CelebrationModal.tsx#L7).
    *   **Root Cause:** `CelebrationModal` statically imports `canvas-confetti`, and `CelebrationModal` is mounted in the root `DashboardShell`.
    *   **Impact:** All protected routes (`/dashboard`, `/practice`, `/mastery`, `/profile`) download the canvas confetti library on initial load, even if no celebration occurs.
    *   **Technical Fix:** Dynamically import `canvas-confetti` inside `fireConfetti()` only when a celebration is actively triggered.

*   [ ] **Eliminate Global KaTeX CSS Render-Blocking Bloat:**
    *   **Files:** [`src/app/globals.css#L1`](file:///home/abdu/scraping/ethio-exam-app/src/app/globals.css#L1).
    *   **Root Cause:** `@import 'katex/dist/katex.min.css';` is placed at the very top of `globals.css`.
    *   **Impact:** Forces every page (landing page, dashboard, login, settings) to download the 30 KB KaTeX CSS stylesheet and declare web fonts, delaying First Contentful Paint (FCP).
    *   **Technical Fix:** Remove `@import` from `globals.css` and only load KaTeX styles in math-rendering views (`MathText`, `MarkdownRenderer`, `AITutorDrawer`).

*   [ ] **Enable Next.js Package Import Optimization:**
    *   **Files:** [`next.config.mjs`](file:///home/abdu/scraping/ethio-exam-app/next.config.mjs).
    *   **Root Cause:** `next.config.mjs` is missing `experimental.optimizePackageImports: ['lucide-react', 'date-fns']`.
    *   **Impact:** Hundreds of unused Lucide icons risk being compiled into bundle chunks.
    *   **Technical Fix:** Add `experimental: { optimizePackageImports: ['lucide-react', 'date-fns'] }` and `compress: true` in `next.config.mjs`.

---

### 🗄️ Track 3: Database Query Optimization & Network Waterfall Elimination
*   [ ] **Stop Eager-Loading 200 Full Note Markdown Bodies in SSR:**
    *   **Files:** [`src/app/(app)/(protected)/notes/[subject]/page.tsx#L42`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/notes/[subject]/page.tsx#L42).
    *   **Root Cause:** `supabase.from('study_notes').select('*').limit(200)` fetches the entire markdown text of all chapters in the course during initial page SSR.
    *   **Impact:** If a subject has 15 chapters, up to 1-2 MB of markdown text is serialized into the initial HTML and RSC payload just to show a list of chapter titles!
    *   **Technical Fix:** Change initial query to `.select('id, title, department, exam_type, created_at')`. Fetch note markdown content only when the student taps a chapter card, or cache on client.

*   [ ] **Replace Aggressive 3.5s Polling with Exponential Backoff:**
    *   **Files:** [`src/app/(app)/(protected)/upgrade/page.tsx#L131`](file:///home/abdu/scraping/ethio-exam-app/src/app/(app)/(protected)/upgrade/page.tsx#L131).
    *   **Root Cause:** `setInterval(pollStatus, 3500)` fires every 3.5 seconds unconditionally for up to 5 minutes.
    *   **Impact:** Up to 85 serverless invocations and 170 database queries per user. Multiple students submitting receipts will cause Supabase connection pool exhaustion.
    *   **Technical Fix:** Implement exponential backoff: start at 3s, increase to 5s, 8s, 15s after 30s, and provide an explicit "Check Status" button.

*   [ ] **Reuse Supabase Admin Client via Singleton:**
    *   **Files:** [`src/utils/supabase/admin.ts#L6-L19`](file:///home/abdu/scraping/ethio-exam-app/src/utils/supabase/admin.ts#L6-L19).
    *   **Root Cause:** `createAdminClient()` calls `createClient()` on every call, instantiating new HTTP connection agents every time.
    *   **Impact:** Forfeits TCP/TLS connection reuse and HTTP keep-alive, adding 50-150ms handshake latency on every server action.
    *   **Technical Fix:** Export a persistent singleton `supabaseAdmin` instance.

*   [ ] **Add Missing Composite Indexes for Hot Query Paths:**
    *   **Files:** Supabase Database Migrations / Schema.
    *   **Root Cause:** `payment_receipts` is repeatedly queried by `telegram_id` and ordered by `created_at DESC` during verification polling. `otp_codes` is looked up by `code` and `used`. Neither has a composite index in Supabase migrations.
    *   **Impact:** Full table sequential scans as the tables grow with more student signups and payments.
    *   **Technical Fix:** Add `CREATE INDEX idx_payment_receipts_user ON payment_receipts(telegram_id, created_at DESC);` and `CREATE INDEX idx_otp_codes_lookup ON otp_codes(code, used);`.

*   [ ] **Memoize KaTeX Formulas in `MathText.tsx`:**
    *   **Files:** [`src/components/MathText.tsx#L10`](file:///home/abdu/scraping/ethio-exam-app/src/components/MathText.tsx#L10).
    *   **Root Cause:** `MathText` is an unmemoized functional component that runs KaTeX regex splitting and string compilation on every render.
    *   **Impact:** During exam sessions, option clicks, flag toggles, or timer updates cause `ExamWorkspace` to re-render, re-running KaTeX for all 5 math formulas (question + 4 options) unnecessarily.
    *   **Technical Fix:** Wrap `MathText` in `React.memo` with string comparison props.

*   [ ] **Eliminate Redundant Streak Database Action on Every Dashboard Mount:**
    *   **Files:** [`src/components/dashboard/HomeHub.tsx#L57`](file:///home/abdu/scraping/ethio-exam-app/src/components/dashboard/HomeHub.tsx#L57).
    *   **Root Cause:** `HomeHub.tsx` invokes `updateDailyStreak()` on every mount, even though `layout.tsx` already resolved the streak from Supabase.
    *   **Impact:** Triggers a redundant Server Action + Supabase read/write on every internal route navigation back to Home.
    *   **Technical Fix:** Check if `last_activity_date` in the store is already today before dispatching `updateDailyStreak()`.

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
