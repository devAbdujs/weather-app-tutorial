# Temari Production Debugging & Incident Triage Guide

> **Target Audience:** Maintainers, engineers, and solo operators running the Temari platform in production (Next.js 14 App Router + Supabase + Telegram Mini App + Gemini Vision/Tutor + Vercel).

When production fails, use this battle-tested playbook to diagnose the root cause and apply the fix immediately.

---

## ⚡ Quick Incident Triage Matrix

| What You See | Likely Root Cause | Jump To |
| :--- | :--- | :--- |
| **"Something went wrong" / Minified React error #310** | Rules of Hooks violation (hook called after early `return` or conditionally) | [Section 1.1](#11-minified-react-error-310-rules-of-hooks-violation) |
| **Hydration mismatch / flashing layout** | Server-rendered HTML differs from client (date, window, localStorage) | [Section 1.2](#12-hydration-mismatches-react-error-418--423) |
| **User stuck on `/` or infinite auth spinner** | Invalid Telegram HMAC hash or missing session cookie | [Section 2.1](#21-user-stuck-in-redirect-loop-or-auth-fails) |
| **Vercel deployment failed during build** | Missing environment variable during SSG or TypeScript error | [Section 3.1](#31-build-fails-during-prerendering--page-generation) |
| **Database returns `[]` or throws error** | Table name mismatch, missing `.maybeSingle()`, or RLS blocking | [Section 4.1](#41-database-relation-or-rls-access-errors) |
| **AI Tutor drawer says "Failed to get explanation"** | Non-existent Gemini model, 429 rate limit, or invalid chat turn role | [Section 5.1](#51-gemini-model-identifiers--rate-limits-429) |
| **Receipt upload fails with 413 or timeout** | Image uncompressed (>4.5MB Vercel serverless payload limit) | [Section 6.1](#61-receipt-upload-fails-or-times-out) |
| **Telegram approval buttons don't respond** | Webhook URL unregistered or expired on Telegram Bot API | [Section 6.2](#62-telegram-admin-bot-notifications--webhooks) |
| **Offline exam shows "No Questions Available"** | Server component early return before client IndexedDB hydration | [Section 7.1](#71-offline-exam-loading--cache-hydration) |

---

## 1. Client Crashes & React Runtime Errors

### 1.1 Minified React Error #310 (Rules of Hooks Violation)
* **Error Message:** `Minified React error #310; visit https://react.dev/errors/310`
* **What It Means:** *"Rendered more hooks than during the previous render."* React requires every hook (`useState`, `useEffect`, `useMemo`, `useRouter`, custom store hooks) to execute in the exact same sequence on every render.
* **How It Happens:**
  ```tsx
  // ❌ BROKEN: Hook placed below an early return
  export const MyComponent = () => {
    const user = useAppStore(s => s.user);
    if (!user) return null; // Early return!

    // If user was null on render 1 and non-null on render 2,
    // this hook is called on render 2 but was skipped on render 1 -> CRASH #310!
    const { xp } = useGamificationStore(); 
    return <div>{xp}</div>;
  };
  ```
* **How to Fix:**
  Move **all** hooks to the top level of the component function, strictly before any `if (...) return` statements:
  ```tsx
  // ✅ FIXED: All hooks declared before any early returns
  export const MyComponent = () => {
    const user = useAppStore(s => s.user);
    const { xp } = useGamificationStore(); // Always called!

    if (!user) return null;
    return <div>{xp}</div>;
  };
  ```
* **Automated Audit Command:**
  Run this one-liner in your terminal to instantly scan all components for hook placement bugs:
  ```bash
  python3 -c '
  import os, re
  for root, dirs, files in os.walk("src"):
      for f in files:
          if f.endswith((".tsx", ".ts")):
              path = os.path.join(root, f)
              with open(path) as file:
                  lines = file.readlines()
              ret_depth = -1
              b_depth = 0
              for idx, l in enumerate(lines):
                  b_depth += l.count("{") - l.count("}")
                  if re.match(r"^\s*if\s*\(.+\)\s*return\b", l): ret_depth = b_depth
                  if re.search(r"\b(use[A-Z]\w*)\s*\(", l) and ret_depth != -1:
                      print(f"HOOK BUG in {path}:{idx+1} -> Hook called after early return")
  '
  ```

---

### 1.2 Hydration Mismatches (React Error #418 / #423)
* **Error Message:** *"Hydration failed because the initial UI does not match what was rendered on the server."*
* **Common Culprits in Temari:**
  1. `getGreeting()` using `new Date().getHours()` on server vs client timezone.
  2. Reading `localStorage` or `window` values during initial render.
  3. Dynamic streak or XP values rendering before server data hydrates.
* **Fixes:**
  - Add `suppressHydrationWarning` on elements that render dynamic time or greetings:
    ```tsx
    <p suppressHydrationWarning>{getGreeting()}</p>
    ```
  - For client-only features, use the `mounted` pattern:
    ```tsx
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null; // or skeleton placeholder
    ```
  - **Never** access `localStorage` directly in render bodies. Always use `safeLocalStorage` from `@/lib/safeStorage` inside `useEffect`.

---

## 2. Telegram Mini App & Authentication Failures

### 2.1 User Stuck in Redirect Loop or Auth Fails
* **Symptom:** User opens the app in Telegram and gets redirected back and forth between `/` and `/dashboard`, or sees 401 Unauthorized errors in network console.
* **Step 1: Check Telegram WebApp initData Signature:**
  - Temari verifies user authenticity via HMAC-SHA256 signature using `TELEGRAM_BOT_TOKEN`.
  - In Vercel Project Settings > Environment Variables, verify `TELEGRAM_BOT_TOKEN` exactly matches the token provided by `@BotFather`.
  - Test signature verification locally:
    ```bash
    npm test __tests__/telegramAuth.test.ts
    ```
* **Step 2: Check Cookie Domain & Path Scoping:**
  - Session cookies (`temari_session`, `temari_admin_session`) must specify `path: '/'` so that API endpoints under `/api/*` can read them.
  - If a cookie was set with `path: '/admin'` or `path: '/dashboard'`, API routes will return 401 Unauthorized.
* **Step 3: Desktop Browser / Dev Bypass:**
  - When developing in Google Chrome or desktop outside of Telegram, the Telegram WebApp SDK does not provide `initData`.
  - Temari automatically supports mock session injection in development mode. If testing on staging, open the web widget at `/auth/callback` or test directly within the Telegram Desktop / Mobile client.

---

## 3. Vercel Build & Deployment Failures

### 3.1 Build Fails During Prerendering / Page Generation
* **Symptom:** Vercel build log displays:
  ```text
  Error occurred prerendering page "/...". Read more: https://nextjs.org/docs/messages/prerender-error
  ```
* **Root Causes & Solutions:**
  1. **Missing Public Environment Variables:**
     Next.js executes server code during `next build`. If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing in Vercel, Supabase client initialization throws:
     ```text
     Error: supabaseUrl is required.
     ```
     **Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel Environment Variables across *Production*, *Preview*, and *Development*.
  2. **Direct Browser API in Server Components:**
     Referencing `window`, `document`, or `localStorage` in server components causes Node.js `ReferenceError`.
     **Fix:** Mark component with `"use client";` or move browser API calls inside `useEffect`.
  3. **Node.js Runtime Warning:**
     Supabase SDK recommends Node 22+.
     **Fix:** Go to **Vercel Project Settings > General > Node.js Version** and select **22.x**.

### 3.2 Pre-Flight Local Build Check
Always run this command before pushing to ensure Vercel will succeed:
```bash
npx tsc --noEmit && npm run build
```

---

## 4. Database & Supabase Connection / RLS Issues

### 4.1 Database Relation or RLS Access Errors
* **Symptom 1: `relation "public.ai_cache" does not exist`**
  - **Fix:** The active cache table in Temari is named `ai_responses_cache` (protected by RLS). Update SQL table queries to reference `ai_responses_cache`.
* **Symptom 2: Queries return `data: null, error: "JSON object requested, multiple (or no) rows returned"`**
  - **Root Cause:** Calling `.single()` when a user profile or streak record does not exist yet.
  - **Fix:** Always use `.maybeSingle()` for optional records:
    ```typescript
    // ❌ Crashes on user profile miss:
    const { data } = await supabase.from('profiles').select().eq('id', id).single();

    // ✅ Safe: returns data: null if not found without throwing:
    const { data } = await supabase.from('profiles').select().eq('id', id).maybeSingle();
    ```
* **Symptom 3: Offline Submissions Overwrite Counter (Race Condition)**
  - **Root Cause:** Read-modify-write pattern during parallel queue flushes.
  - **Fix:** Deploy the atomic RPC function in your Supabase SQL Editor:
    ```bash
    cat db_schemas/increment_user_subject_stats.sql
    ```

---

## 5. Gemini AI & Tutor Failures

### 5.1 Gemini Model Identifiers & Rate Limits (429)
* **Symptom 1: 404 Not Found from Google Generative AI API**
  - **Root Cause:** Deprecated or invalid model identifier (e.g. `gemini-3.6-flash`).
  - **Fix:** Always use stable `gemini-1.5-flash` in AI route files:
    - `src/app/api/ai/tutor/route.ts`
    - `src/app/api/ai/quiz/route.ts`
    - `src/app/api/ai/tip/route.ts`
    - `src/app/api/payments/submit/route.ts`
* **Symptom 2: 429 Too Many Requests (Resource Exhausted)**
  - **How Temari Handles It:** The custom key rotation manager in `src/lib/geminiKeyRotation.ts` automatically cools down rate-limited keys for 60 seconds and falls back to the next available key.
  - **Fix:** Add multiple Gemini API keys in Vercel environment variables:
    ```env
    GEMINI_API_KEY_1=AIzaSy...
    GEMINI_API_KEY_2=AIzaSy...
    GEMINI_API_KEY_3=AIzaSy...
    ```
* **Symptom 3: Google API Error "Please ensure that multiturn talk starts with user role"**
  - **Root Cause:** `chatHistory` includes the mock assistant welcome greeting as message turn 0.
  - **Fix:** Filter out greetings before dispatching:
    ```typescript
    const cleanHistory = chatHistory.filter(msg => msg.id !== 'welcome');
    ```

---

## 6. Payment OCR & Telegram Webhooks

### 6.1 Receipt Upload Fails or Times Out
* **Symptom:** Student submits bank transfer screenshot (CBE, Telebirr, Awash) and the screen hangs or returns 413 "Payload Too Large".
* **Root Cause:** Modern smartphone cameras take 8MB–15MB photos, exceeding Vercel's 4.5MB serverless payload limit.
* **Fix:** The app uses client-side HTML5 Canvas compression (`src/app/(app)/(protected)/upgrade/page.tsx`). Ensure the compressed image buffer is passed to `/api/payments/submit`.
* **Memory Optimization:** In `/api/payments/submit/route.ts`, the server reuses the in-memory `fileBuffer` for base64 OCR rather than downloading it back from Supabase Storage.

### 6.2 Telegram Admin Bot Notifications & Webhooks
* **Symptom:** Admin doesn't receive instant approve/reject buttons in Telegram when student submits receipt.
* **Diagnostics:**
  1. Check Telegram Bot webhook info:
     ```bash
     curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
     ```
  2. If `url` is empty or pointing to localhost, set the production webhook:
     ```bash
     curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://www.temari.top/api/bot/webhook"
     ```
  3. Verify `TELEGRAM_ADMIN_CHAT_ID` matches your personal Telegram User ID (obtain from `@userinfobot`).

---

## 7. Offline PWA & Exam Session Failures

### 7.1 Offline Exam Loading & Cache Hydration
* **Symptom:** When taking an exam offline, the user sees "No Questions Available Yet" instead of their cached questions.
* **Architecture:**
  - `src/app/(app)/(protected)/exam/session/page.tsx` is a Server Component.
  - If network is unavailable or Supabase returns empty rows, it passes `initialQuestions={[]}` to `ExamSessionLoader.tsx`.
  - `ExamSessionLoader.tsx` hydrates from local IndexedDB (`v2_exam_*`).
  - While hydrating, it renders `<SkeletonScreen />` to prevent mounting `ExamWorkspace` with empty questions.
* **To Clear Corrupted Client Cache:**
  Direct student to click **"Clear Cache & Reset"** on the error boundary or trigger in console:
  ```javascript
  localStorage.clear();
  indexedDB.deleteDatabase('localforage');
  location.reload();
  ```

---

## 8. Master CLI Diagnostic Cheat Sheet

Run these commands in `/home/abdu/scraping/ethio-exam-app` whenever investigating issues:

```bash
# 1. Type Check (Strict TypeScript validation)
npx tsc --noEmit

# 2. Automated Test Suite (7 suites, 35 tests)
npm test

# 3. Production Build Simulation
npm run build

# 4. Check for React Hook placement violations
python3 -c '
import os, re
for root, dirs, files in os.walk("src"):
    for f in files:
        if f.endswith((".tsx", ".ts")):
            path = os.path.join(root, f)
            with open(path) as file:
                lines = file.readlines()
            ret_depth = -1
            b_depth = 0
            for idx, l in enumerate(lines):
                b_depth += l.count("{") - l.count("}")
                if re.match(r"^\s*if\s*\(.+\)\s*return\b", l): ret_depth = b_depth
                if re.search(r"\b(use[A-Z]\w*)\s*\(", l) and ret_depth != -1:
                    print(f"HOOK BUG in {path}:{idx+1} -> Hook called after early return")
'

# 5. Inspect Live Production Headers & Redirects
curl -sI -L https://www.temari.top | grep -E "(HTTP|server|location|x-vercel)"

# 6. Verify Telegram Bot Webhook Health
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```
