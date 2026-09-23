# Temari App - Master Execution Roadmap (Prioritized)

*Last Updated: Sept 2026*  
*Status: 7 critical vulnerabilities (M1-M7) fixed. Haptic feedback integrated. Moving to high-impact execution.*

This roadmap has been reorganized based on business impact, engineering severity, and Core Web Vitals.

---

## 🔥 Priority 1: Critical Stability & Core Web Vitals (Do Immediately)
*These tasks directly impact app loading speed, server stability, and exam accuracy. Ethiopia has slow 3G networks; these are mandatory.*

*   **[ ] Render Blocking & Client Waterfalls:** 
    *   Change Telegram SDK `<Script>` in `layout.tsx` from `beforeInteractive` to `afterInteractive`.
    *   Lazy-load `katex.min.css` so it doesn't block the login page.
    *   Move `ExamSessionLoader.tsx` data fetching from a client `useEffect` to the Server Component to eliminate the 4-second TTFB waterfall.
*   **[ ] Database Indexing & Payload Bloat:** 
    *   Add composite B-Tree indexes in Supabase (`CREATE INDEX idx_questions_subject_exam ON questions (subject, exam_type);`) to prevent full table scans.
    *   Replace `.select('*')` in `ExamSessionLoader` with explicit columns.
*   **[ ] Admin Dashboard Scaling Crash:** 
    *   `getUsers()` in `admin.ts` fetches the entire profiles table. Add Supabase `.range()` pagination before the userbase grows and crashes the server.
*   **[ ] Image Optimization:** 
    *   Replace raw HTML `<img>` tags in `ExamWorkspace` and `LandingPage` with Next.js `<Image>` (webp compression) to stop draining mobile data.
*   **[ ] The Mobile Timer Bug:** 
    *   Fix `ExamTimer.tsx`. iOS throttles `setInterval(..., 1000)` when the screen turns off. Use absolute timestamp calculation (`Math.max(0, endTime - Date.now())`).
*   **[ ] Rate Limiting & RLS Security:** 
    *   Migrate the in-memory AI rate limiter to Upstash Redis (Vercel wipes memory on cold starts).
    *   Audit Row Level Security (RLS) so users cannot spoof API requests to max out their mastery tree.

---

## 💰 Priority 2: Revenue & AI Core (Next Sprint)
*These tasks unlock monetization and drastically improve the AI's accuracy and cost-efficiency.*

*   **[ ] AI Response Caching (Cost & Speed):** 
    *   Create an `ai_responses_cache` table. Hash the `questionId + promptType`. If a student asks for a hint that was already generated, return it instantly (50ms) instead of calling Gemini (3000ms).
*   **[ ] The Manual Paywall (Monetization):** 
    *   The "Premium" button in Profile is currently a dead end. Build the UI to display Telebirr/CBE accounts and a form to upload a receipt screenshot to an Admin approval queue.
*   **[ ] Advanced AI & RAG (Curriculum Grounding):** 
    *   Enable `pgvector` in Supabase.
    *   Stop blindly truncating textbook notes (`substring(0, 8000)`).
    *   Ingest PDF chunks into the vector DB and retrieve only the relevant paragraphs so the AI Tutor bases its answers strictly on the Ethiopian curriculum.

---

## 💎 Priority 3: Native App Feel & UX Polish
*These tasks transition Temari from a "web page" to a premium software experience.*

*   **[ ] Telegram Native Immersion (Bot API 8.0):** 
    *   Call `@twa-dev/sdk` `requestFullscreen()` in the Exam Workspace.
    *   Implement `disableVerticalSwipes()` to prevent accidental app closures during exams.
    *   Implement `enableClosingConfirmation()` for active test sessions.
    *   Sync Next.js theme with Telegram via `setHeaderColor()`.
*   **[ ] "Real Paper" Short Notes UI:** 
    *   Implement a CSS-driven ruled paper background (warm cream, 28px lines, red margin) in `StudyNotesView.tsx`.
    *   Standardize AI note generation into a psychological blueprint (TL;DR $\rightarrow$ Core Concepts $\rightarrow$ Sticky Note $\rightarrow$ Self-Test).
*   **[ ] Exam UX Context Loss:** 
    *   When an image is zoomed in the `ExamWorkspace`, the question text is hidden. Add a floating semi-transparent panel with the text inside the lightbox.
*   **[ ] Graceful Error States:** 
    *   Add toast notifications (`sonner`) for when the AI times out.
    *   Disable options in the `ExamSetupModal` dynamically if a combination yields 0 questions (pre-flight check).

---

## 🚀 Priority 4: Offline Growth & Automation (Long Term)
*These tasks scale the business operationally and expand accessibility.*

*   **[ ] Robust PWA & Background Sync:** 
    *   Upgrade the basic Service Worker. Queue exam score submissions in `IndexedDB` if Wi-Fi drops, and push them via Background Sync when internet returns.
    *   Implement Supabase Magic Links for standard web users outside of Telegram.
*   **[ ] n8n Operational Automation:** 
    *   Automated CRM: Ping users on Telegram via n8n if their daily streak is at risk.
    *   Content Ingestion: Admins drop a PDF in a Telegram channel $\rightarrow$ n8n parses via Gemini $\rightarrow$ auto-inserts into Supabase.

*   **[ ] Telegram BotFather Configuration (Marketing & Access):** 
    *   Create a Direct Link Mini App via `/newapp` in BotFather to get a clean, shareable link (e.g., `t.me/temari_bot/app`).
    *   Configure the **Menu Button** via Bot Settings so the app is always pinned at the bottom of the chat.
    *   Enable the **Main Mini App** via Bot Settings so users can launch the app directly from the bot's profile page.
