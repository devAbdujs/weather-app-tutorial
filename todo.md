# Temari App - Master Execution Roadmap (Prioritized)

*Last Updated: Sept 2026 (Launch Ready)*  
*Status: 100% Production-Grade. Payments 100% cloud-native on Vercel. Database audited across all 12 tables.*

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

## 📚 Current Sprint: Content Ingestion & Bulk Short Notes
*   **[ ] Bulk Past Papers & Short Notes Digestion**
    *   Batch import Grade 12, Freshman, and Exit exam short notes via `/admin/upload-notes` or local CLI (`scripts/ingest_note_pdf.py`).
    *   Ensure all subjects (Biology, Physics, Chemistry, Math, Aptitude, Economics) have complete chapter notes with KaTeX math rendering.

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
