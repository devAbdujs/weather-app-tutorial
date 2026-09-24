# Temari App - Master Execution Roadmap (Prioritized)

*Last Updated: Sept 2026*  
*Status: 7 critical vulnerabilities (M1-M7) fixed. Haptic feedback integrated. PWA Offline features added. RLS Secured.*

This roadmap has been reorganized based on business impact, engineering severity, and Core Web Vitals.

---

## ✅ Completed (Recent Sprints)
*   **[x] Render Blocking & Client Waterfalls:** Move data fetching to Server Components to eliminate TTFB waterfall.
*   **[x] Image Optimization:** Replaced raw HTML `<img>` tags with Next.js `<Image>` with priority tags.
*   **[x] Rate Limiting & RLS Security:** Row Level Security (RLS) enabled on all 11 Supabase tables to prevent spoofing.
*   **[x] Telegram Native Immersion (Bot API 8.0):** Call `requestFullscreen()` and implement `disableVerticalSwipes()`.
*   **[x] Exam UX Context Loss:** Added floating semi-transparent panel with question text inside lightboxes.
*   **[x] Robust PWA & Background Sync:** Implemented `PWARegistry` with 5-second delayed sonner toast and offline sync.
*   **[x] Telegram BotFather Configuration (Marketing & Access):** Created Direct Link Mini App and configured Menu Button.
*   **[x] Operational Automation (Setup):** Deployed n8n on local Ubuntu server via Cloudflare tunnels for background tasks.

---

## 🔥 Priority 1: Critical Stability (Do Immediately)
*   **[ ] Database Indexing & Payload Bloat:** 
    *   Add composite B-Tree indexes in Supabase (`CREATE INDEX idx_questions_subject_exam ON questions (subject, exam_type);`) to prevent full table scans.
*   **[ ] Admin Dashboard Scaling Crash:** 
    *   `getUsers()` in `admin.ts` fetches the entire profiles table. Add Supabase `.range()` pagination before the userbase grows.
*   **[ ] The Mobile Timer Bug:** 
    *   Fix `ExamTimer.tsx`. iOS throttles `setInterval` when the screen turns off. Use absolute timestamp calculation.

---

## 💰 Priority 2: Revenue & AI Core (Next Sprint)
*   **[ ] AI Response Caching (Cost & Speed):** 
    *   Hash the `questionId + promptType` in `ai_responses_cache` to return instant hints instead of calling Gemini.
*   **[ ] The Manual Paywall (Monetization):** 
    *   Build UI for Telebirr/CBE accounts and a form to upload a receipt screenshot to an Admin approval queue.

---

## 💎 Priority 3: Native App Feel & UX Polish
*   **[ ] "Real Paper" Short Notes UI:** 
    *   Implement CSS-driven ruled paper background (warm cream, 28px lines, red margin) in `StudyNotesView.tsx`.
    *   Standardize AI note generation into a psychological blueprint.
*   **[ ] Graceful Error States:** 
    *   Disable options in the `ExamSetupModal` dynamically if a combination yields 0 questions (pre-flight check).

---

## 🚀 Priority 4: Operational Automation (n8n & AI)
*   **[ ] n8n PDF Exam Ingestor:** 
    *   Build n8n workflow: Admins drop a PDF in a Telegram channel $\rightarrow$ n8n parses via Gemini $\rightarrow$ auto-inserts into Supabase.
*   **[ ] n8n CRM Automation:** 
    *   Ping users on Telegram via n8n if their daily streak is at risk.
*   **[ ] PDF Short Note Uploader & Parser:**
    *   Build a UI to upload PDF short notes directly and render it beautifully using the app's `MarkdownRenderer`.
*   **[ ] Advanced AI & RAG (Curriculum Grounding):** 
    *   Enable `pgvector` in Supabase and ingest chunks to ground the AI strictly on the Ethiopian curriculum.
