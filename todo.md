# Temari App - Comprehensive Product, QA & Engineering Roadmap

*Prepared by: Product, QA, and Engineering Leads*
*Last Updated: Sept 2026*

This document outlines the rigorous audit of the Temari application, exposing underlying logical flaws, UI/UX gaps, and incomplete features, followed by a strategic roadmap for PWA conversion and n8n operational automation.

---

## 🛑 Phase 1: Critical Logical & Functional Flaws (QA / Engineering)

### 1. The Mobile `setInterval` Timer Bug
*   **The Flaw:** In `ExamTimer.tsx`, the countdown relies on a standard JavaScript `setInterval(..., 1000)`. On iOS Safari and Chrome Android, when the phone screen turns off or the app goes to the background, the browser aggressively throttles or pauses JavaScript intervals to save battery. A 60-minute exam could report only 40 minutes passed.
*   **The Fix:** Store an absolute `endTime = Date.now() + duration` in a React ref or state. In the `setInterval`, calculate `Math.max(0, endTime - Date.now())` instead of blindly subtracting 1.

### 2. Fake Rate Limiting (Serverless Cold Start Issue)
*   **The Flaw:** We implemented strict 1-per-minute AI rate limiting using an in-memory sliding window map (`api/ai/...`). If the app is deployed on a serverless provider (Vercel/AWS Lambda), the container spins down between requests, wiping the in-memory map. Users can bypass limits by just refreshing or hitting a different server instance.
*   **The Fix:** Migrate rate limiting to Upstash Redis or a Supabase `rate_limits` table to ensure persistent, global throttling.

### 3. Silent AI Failures (Error Handling)
*   **The Flaw:** If Gemini completely fails, times out, or the API keys exhaust, the UI might show infinite loading spinners or crash silently without user feedback.
*   **The Fix:** Implement a global Toast notification system (e.g., `sonner` or `react-hot-toast`). Add a hard 15-second timeout to AI requests with a fallback UI: "Mr. Helper is currently overwhelmed. Please try again."

### 4. Supabase RLS (Row Level Security) Audit
*   **The Flaw:** Ensure that a malicious student cannot intercept the API request and update their `questions_correct` to 10,000 to max out their Mastery Tree instantly.
*   **The Fix:** Lock down Supabase `UPDATE` policies so that exam scores are validated, or handled strictly via secure backend server actions.

---

## 🎨 Phase 2: UI/UX Gaps & Incomplete Features (Product)

### 1. The "Premium" Dead End (Manual Paywall)
*   **The Flaw:** The `ProfileView` shows "Free Tier", but there is no upgrade path. 
*   **The Fix:** Build a **manual payment paywall**. The UI will display manual payment instructions (e.g., Telebirr or CBE account details) and provide a form for the user to submit their transaction ID and a screenshot of the receipt. This submission will go to an Admin queue for manual verification and approval to unlock Premium.

### 2. Missing Empty States for Search/Filter
*   **The Flaw:** If a user selects a combination in `ExamSetupModal` (e.g., 2010 + Civics + Exit Exam) that yields 0 questions, the app might throw a generic session empty error.
*   **The Fix:** Add pre-flight checks. Disable years or subjects in the setup modal dynamically if the database count for that combination is 0.

### 3. Image Zoom Context Loss
*   **The Flaw:** When an image is zoomed in the `ExamWorkspace` (`zoomImage` overlay), the user cannot see the question text. If they are solving a complex math problem, they have to constantly open and close the image.
*   **The Fix:** Add a semi-transparent floating panel at the bottom of the lightbox overlay containing the question text.

### 4. "Real Paper" Short Notes UI & Blueprint Standardization
*   **The Flaw:** Short notes currently render as generic digital text blocks without a standardized learning structure, which limits knowledge retention and lacks a focused, premium academic feel.
*   **The Fix:** 
    *   **UI/UX:** Implement a CSS-driven "Real Paper" background in `StudyNotesView.tsx` (warm cream with 28px repeating ruled lines and a red margin). Update `MarkdownRenderer.tsx` so line heights snap perfectly to the ruled lines, and style blockquotes to look like yellow sticky notes.
    *   **Content Blueprint:** Standardize note creation (via Admin/AI) to strictly follow a psychological template: TL;DR $\rightarrow$ Core Concepts $\rightarrow$ Golden Rule (Sticky Note) $\rightarrow$ Memory Anchor $\rightarrow$ Quick Self-Test.

### 5. Admin Dashboard Robustness & Scaling
*   **The Flaw:** The admin dashboard is currently a read-only prototype. Functions like `getUsers()` fetch the entire database table at once (critical scaling flaw), and there is no way to search, edit, or track high-level metrics.
*   **The Fix:** 
    *   **Pagination & Search:** Implement server-side pagination (using Supabase `.range()`) and search filtering via URL parameters (e.g., `?page=1&search=telegram_id`).
    *   **Data Mutation (CRUD):** Add an "Actions" column to tables allowing admins to Edit/Delete questions (to fix typos) and manage users (manually grant premium, reset streaks, or ban).
    *   **Analytics Overview:** Add KPI cards to the main dashboard route (Total Users, Daily Active Users, Premium Accounts, Question Count).

---

## 📱 Phase 3: PWA & Offline Support (Growth & Engineering)

**Goal:** Break free from the Telegram constraint, eliminate App Store fees, and support Ethiopian students with unstable internet.

*   **Task 1: Standard Web Authentication**
    *   Implement Supabase Magic Links & Google OAuth for users accessing `temari.top` outside of Telegram.
    *   Link Web and Telegram identities in the `profiles` table.
*   **Task 2: Service Worker & Installability**
    *   Install `serwist` (modern `next-pwa` replacement).
    *   Create `manifest.json` (icons, theme colors, standalone display mode).
    *   Cache global CSS, fonts, and static layout shells.
*   **Task 3: Local-First Exam Caching**
    *   When an exam session starts, fetch all questions and images and store them in `IndexedDB`.
    *   Allow the user to complete the exam perfectly even if Wi-Fi drops.
    *   Queue the final score submission in a Background Sync task to push to Supabase once the internet returns.
*   **Task 4: Graceful AI Degradation**
    *   Detect `navigator.onLine`. If false, disable the "Ask AI" button with a tooltip: "Internet required for AI Tutor."

---

## 🤖 Phase 4: n8n Integration & Operational Automation (Product Ops)

**Goal:** Automate marketing, retention, and content ingestion with zero recurring software costs using a self-hosted n8n instance on a cheap VPS.

*   **Task 1: Automated CRM / Streak Rescue (Telegram Bot API)**
    *   *Trigger:* n8n Cron node runs daily at 5:00 PM.
    *   *Action:* Queries Supabase for users who haven't studied today but have a `daily_streak > 0`.
    *   *Output:* n8n hits the Telegram API to send a personalized push message: *"Your streak is at risk! Do a quick 5-min drill."*
*   **Task 2: Content Ingestion Pipeline (Admin Side)**
    *   *Trigger:* Admin uploads a PDF of a past exam to a private Telegram channel.
    *   *Action:* n8n catches the webhook -> extracts PDF text -> sends to Gemini API with strict JSON schema instructions -> parses JSON.
    *   *Output:* n8n executes a bulk `INSERT` into the Supabase `questions` table.
*   **Task 3: Infrastructure Alerts**
    *   *Trigger:* Supabase Edge Functions or Next.js API catch a 500 error or 429 Rate Limit.
    *   *Action:* Sends payload to n8n webhook.
    *   *Output:* n8n sends an immediate alert to the Developer Telegram Group.
*   **Task 4: Manual Payment Processing Workflow**
    *   *Trigger:* A user hits "Submit" on the manual paywall after uploading a receipt screenshot. Next.js triggers an n8n webhook.
    *   *Action:* n8n receives the transaction ID, username, and screenshot URL. It instantly sends a message to the Admin Telegram Group.
    *   *Output:* Admins receive a clean Telegram message with the receipt attached and inline buttons for [Approve] or [Deny]. Clicking "Approve" triggers another n8n workflow that updates the user's `is_premium` status in Supabase.

---

## 🚀 Phase 5: Telegram Native Mini App (TMA) Optimizations

**Goal:** Fully utilize Telegram's latest Bot API (8.0+) features to make the web app feel like a seamless, premium native mobile application, minimizing friction and accidental exits.

*   **Task 1: Exam Safety & Retention**
    *   Implement `Telegram.WebApp.disableVerticalSwipes()` globally to prevent users from accidentally closing the app while scrolling through long reading passages or notes.
    *   Implement `Telegram.WebApp.enableClosingConfirmation()` strictly during active exam sessions so users receive a warning if they try to close the app, preventing lost progress.
*   **Task 2: Native App Immersion**
    *   Call `Telegram.WebApp.requestFullscreen()` when entering the `ExamWorkspace` to hide the Telegram chat header and give the user maximum screen real estate.
    *   Trigger `Telegram.WebApp.addToHomeScreen()` after a user finishes their first exam to prompt them to install the Mini App directly to their phone's home screen.
*   **Task 3: Tactile UX (Haptic Feedback)**
    *   Integrate `Telegram.WebApp.HapticFeedback.impactOccurred('medium')` for selecting multiple-choice answers and interacting with the Mastery Tree.
    *   Integrate `notificationOccurred('success')` for flipping flashcards or submitting exams to provide physical, tactile satisfaction.
*   **Task 4: Seamless UI Blending**
    *   Dynamically sync the Next.js Tailwind theme state with Telegram using `Telegram.WebApp.setHeaderColor()` and `setBottomBarColor()` to eliminate harsh UI borders between the app and the Telegram wrapper.
*   **Task 5: Low-End Android Optimization**
    *   Parse the Telegram Android `User-Agent` to detect the `{performance_class}` (LOW, AVERAGE, HIGH).
    *   If `LOW`, automatically disable heavy CSS animations (e.g., confetti on level up, heavy box-shadows) to guarantee a smooth 60fps experience and prevent battery drain on budget devices.

---

## 🧠 Phase 6: Advanced AI & RAG (Retrieval-Augmented Generation)

**Goal:** Eliminate AI hallucinations, bypass the current "blind truncation" flaws (`substring(0, 8000)`), and ground the AI Tutor strictly in the official Ethiopian curriculum using Supabase `pgvector`.

*   **Task 1: Supabase Vector Infrastructure**
    *   Enable the `pgvector` extension in the Supabase database.
    *   Create a `curriculum_embeddings` table to store `content` (textbook paragraphs) and `embedding` (vector(768) mathematical representations).
    *   Write the `match_documents` PostgreSQL RPC (Remote Procedure Call) for cosine similarity searches.
*   **Task 2: Document Ingestion Pipeline (Admin)**
    *   Build an admin upload pipeline for official textbook PDFs.
    *   Script the backend to parse the PDFs, chunk the text into 300-500 word contextual blocks, generate vector embeddings via the AI SDK, and upsert them into Supabase.
*   **Task 3: RAG-Powered AI Tutor**
    *   Rewrite the `/api/ai/tutor` endpoint logic.
    *   When a student asks a localized question (e.g., "Explain the Axumite Empire"), convert the query to a vector, query Supabase for the top 3 most relevant textbook chunks, and inject those exact chunks into the Gemini `systemPrompt`.
    *   Instruct the AI to *only* answer using the provided Ethiopian curriculum context.


---

## ⚡ Phase 7: Performance & Latency Overhaul (Core Web Vitals)

**Goal:** Eliminate client-side waterfalls, optimize bandwidth, and ensure sub-second Time-to-Interactive (TTI) for users on poor 3G networks (common in Ethiopia).

*   **Task 1: Render Blocking & Bundle Bloat**
    *   **Telegram SDK:** Move `<Script src="...telegram-web-app.js" />` in `src/app/layout.tsx` from `strategy="beforeInteractive"` to `afterInteractive` or `lazyOnload` to prevent it from blocking the First Contentful Paint.
    *   **KaTeX CSS:** Remove `import 'katex/dist/katex.min.css';` from the global `layout.tsx`. Move it into `src/components/dashboard/MarkdownRenderer.tsx` so it only loads when math is actually rendered.
*   **Task 2: Image Optimization**
    *   Replace all raw HTML `<img>` tags (e.g., in `ExamWorkspace.tsx` and `LandingPage.tsx`) with Next.js `<Image />` components.
    *   Configure `next.config.mjs` with `images.remotePatterns` to serve compressed `webp` files automatically and stop draining user data with multi-megabyte raw uploads.
*   **Task 3: Client-Fetch Waterfalls**
    *   Refactor `ExamSessionLoader.tsx`. Currently, it uses `useEffect` to fetch questions, causing a 3-4 second delay on mobile as the browser waits for JS to boot before fetching data.
    *   Move the initial Supabase fetch to the React Server Component (`ExamSessionPageContent`) and pass the `questions` array down as a prop.
*   **Task 4: Database Indexing & Payload Size**
    *   Create a composite B-Tree index in Supabase: `CREATE INDEX idx_questions_subject_exam ON questions (subject, exam_type);` to prevent full table scans when users filter exams.
    *   Refactor `supabase.from('questions').select('*')` inside the exam loader to explicitly fetch only needed columns (`id, question_text, options, correct_answer, image_url`) to shrink the JSON network payload.
*   **Task 5: AI Response Caching**
    *   Implement an `ai_responses_cache` table in Supabase.
    *   Before calling Gemini in `/api/ai/tutor/route.ts`, hash the `questionId` + `promptType` (e.g., `bio_142_hint`). Check the cache and return it instantly if it exists, saving AI tokens and reducing latency from ~3s to ~50ms for duplicate questions.
