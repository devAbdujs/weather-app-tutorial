# Temari App - Master Execution Roadmap (Prioritized)

*Last Updated: Sept 2026 (End of Day Session)*  
*Status: AI Gating implemented. Timer bug fixed. Next up: Connecting Next.js payment uploads to n8n and building the Telegram approval loop.*

---

## ✅ Completed Today
*   **[x] Critical Bug Fixes:** Fixed column name mismatch in exams (`question` vs `question_text`), wrapped ExamTimer in useCallback, added strict server-side AI paywall.
*   **[x] Operational Automation:** Deployed n8n via Cloudflare tunnels, active and running 24/7.
*   **[x] n8n PDF Short Note Ingestor:** Fully working pipeline to Supabase, enhanced prompt to parse Telegram captions.
*   **[x] n8n AI Payment Vision:** Gemini Vision pipeline built to extract TxID and amount from receipts.
*   **[x] The Next.js to n8n Bridge (Option B):** Connected receipt uploads to production n8n webhook (`annotated-claims-advocate-britannica.trycloudflare.com`).
*   **[x] Complete Approval & Rejection Callback Loop:** Tapping "Approve" upgrades `profiles` to `premium`, marks `payment_receipts` as `approved`, sends celebration message to student, and confirms to admin. Tapping "Reject" marks as rejected and notifies student.
*   **[x] Cloudflare Tunnel Auto-Healer Watchdog:** Automated watchdog running on laptop server via cron every 3 minutes with Telegram alerting on tunnel rotation.
*   **[x] UX Hardening:** Eliminated `daily_streak: 0` hydration flash in protected layout; unlocked Tinder-style swipeable Flashcards at `/flashcards/[subject]` on Home & Practice hubs.
*   **[x] Full Codebase Audit & TypeScript Cleanliness:** 0 TypeScript errors across 29 routes.

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
