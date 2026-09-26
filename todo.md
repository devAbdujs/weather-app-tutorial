# Temari App - Master Execution Roadmap (Prioritized)

*Last Updated: Sept 2026 (End of Day Session)*  
*Status: AI Gating implemented. Timer bug fixed. Next up: Connecting Next.js payment uploads to n8n and building the Telegram approval loop.*

---

## ✅ Completed Today
*   **[x] Critical Bug Fixes:** Fixed column name mismatch in exams, wrapped ExamTimer in useCallback, added strict server-side AI paywall.
*   **[x] Operational Automation:** Deployed n8n via Cloudflare tunnels.
*   **[x] n8n PDF Short Note Ingestor:** Fully working pipeline to Supabase.
*   **[x] n8n AI Payment Vision:** Gemini Vision pipeline built to extract TxID and amount from receipts.
*   **[x] Admin Approval Buttons:** n8n sends dynamic "Approve/Reject" inline keyboard to admin on Telegram.

---

## 🔥 Priority 1: The End-to-End Payment Loop (Tomorrow Morning)

*   **[ ] 1. The Next.js to n8n Bridge (Option B)**
    *   Add a `POST` Webhook node in n8n Payment Approver workflow.
    *   Update Next.js `api/payments/submit/route.ts` to trigger the n8n Webhook with the Supabase public image URL after a student uploads a receipt on the website.
*   **[ ] 2. The Telegram Callback Workflow (Approval Action)**
    *   Create a new n8n workflow listening for Telegram "Callback Queries" (when Admin clicks Approve).
    *   Parse the `student_telegram_id` from the callback string.
    *   Update Supabase `profiles` table: `subscription_status = 'premium'`.
    *   Update Supabase `payments` table: `status = 'approved'`.
*   **[ ] 3. The Celebration Notification**
    *   n8n sends a Telegram message to the student: *"🎉 Payment verified! You are now Premium."*
    *   n8n edits the Admin's message to remove the inline buttons.

---

## 🔥 Priority 2: Subdomain Architecture (`*.temari.top`)

*   **[ ] Dynamic Routing Setup**
    *   Create `src/middleware.ts` to read hostname subdomain and rewrite routes dynamically.
    *   Add wildcard DNS record on Hahu Cloud/Cloudflare.
    *   Build dedicated landing pages for each exam type (data-driven).

---

## 💎 Priority 3: UX Polish

*   **[ ] Graceful Error States in ExamSetupModal**
    *   Wire existing `getSessionCounts()` into `ExamSetupModal.tsx` to disable empty combinations.
*   **[ ] Fix `daily_streak` flash of 0**
    *   Load streak from server before rendering in protected layout.
*   **[ ] Fix Rate Limiter (Vercel multi-instance)**
    *   Replace in-memory rate limiter with Upstash Redis.

---

## 🚀 Priority 4: Growth & Intelligent CRM

*   **[ ] Intelligent Telegram Bot**
    *   Upgrade `/api/bot/webhook/route.ts` to enforce channel joins and serve personalized content.
*   **[ ] Automated Streak Retention (n8n cron)**
    *   Daily n8n workflow: message users at risk of losing their daily streak.
*   **[ ] Telegram Lead Generation**
    *   Inbound funnel: post free short note previews (watermarked) into university groups.
*   **[ ] Advanced AI & RAG (Curriculum Grounding)**
    *   Enable `pgvector` in Supabase to ground AI strictly on Ethiopian exam content.
