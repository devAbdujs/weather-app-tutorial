# Testing Guide

This document covers the testing setup, how to run tests, how to write new ones, and what's currently covered.

---

## Quick start

```bash
# Run all unit tests (recommended for local dev)
npm test

# Run only library/utility tests (no component rendering)
npm run test:unit

# Run in CI mode (–-ci flag, no watch, excludes integration tests)
npm run test:ci
```

---

## Test structure

```
__tests__/
├── api/
│   ├── highlights.test.ts        # Note highlights schema validation & CRUD
│   ├── notesContent.test.ts      # Study notes paywall enforcement (403 teaser)
│   └── streakReminder.test.ts    # Scheduled daily streak cron endpoint
├── components/
│   ├── AdminAccountsTable.test.tsx # Admin deactivation & deletion modal
│   ├── ExamWorkspace.test.tsx    # Live exam, timer, flag colors, question grid
│   ├── MarkdownRenderer.test.tsx # KaTeX math & highlighted term renderer
│   ├── MarketingStoryboard.test.tsx # Exam pass rate charts & mobile mockup
│   ├── PWARegistry.test.tsx      # Bottom-docked PWA prompt with 7-day cooldown
│   └── QuestionStudio.test.tsx   # Question bank editor, KaTeX preview & bulk import
├── lib/
│   ├── adminPermissions.test.ts  # 4-tier sub-admin permissions & audit logger
│   ├── geminiKeyRotation.test.ts # AI key rotation, 404 recovery, and cooldown
│   ├── rateLimiter.test.ts       # Sliding-window rate limiter
│   └── session.test.ts           # AES-GCM session encryption ← security-critical
├── store/
│   └── gamificationStore.test.ts # Zustand offline score & XP syncing
├── cache.test.ts                 # IndexedDB question cache
├── latex.test.ts                 # KaTeX syntax parsing & error boundary
├── practice.test.ts              # Early exit score recording & practice state
├── streak.test.ts                # Daily streak calculation
├── subdomains.test.ts            # Multi-subdomain edge routing & headers
├── supabase-rls.test.ts          # ⚠️ Integration test — see below
├── telegramAuth.test.ts          # HMAC signature & 24h replay attack guard
└── telegramBot.test.ts           # Channel check, deep-links, trophies & bot webhook
```

### Two environments

| Suite | Environment | Why |
|---|---|---|
| `__tests__/components/` | `jsdom` | Component rendering needs a browser-like DOM |
| `__tests__/lib/`, `__tests__/api/`, + root `__tests__/*.ts` | `node` | Uses `crypto.subtle`, `TextEncoder`, NextRequest, full Node APIs |

---

## What's covered

| Area | Tests | Notes |
|---|---|---|
| Session encryption (AES-GCM) | `session.test.ts` | Round-trip, tamper detection, random IV |
| Telegram auth validation | `telegramAuth.test.ts` | Valid/invalid HMAC, constant-time comparison, 24h replay guard |
| Telegram Bot engine | `telegramBot.test.ts` | Channel gatekeeper, deep-links, trophy card milestone generator |
| Subdomain Edge routing | `subdomains.test.ts` | `entrance`, `freshman`, `exit` mapping, canonical 308 redirects |
| Question Studio | `QuestionStudio.test.tsx` | Filter by track/subject, KaTeX live preview, bulk JSON/CSV import |
| Admin permissions | `adminPermissions.test.ts` | 4-tier role enforcement, `hasPermission`, audit trail logging |
| Notes paywall | `notesContent.test.ts` | Free teaser excerpt, 403 status, premium full text unlock |
| Study highlights | `highlights.test.ts` | Zod 2000-char max payload validation, user isolation |
| Streak reminders | `streakReminder.test.ts` | Bearer auth, at-risk user calculation, 20:00 EAT cron |
| Rate limiter | `rateLimiter.test.ts` | Allow, block, sliding window, per-user isolation |
| Gemini key rotation | `geminiKeyRotation.test.ts` | Round-robin, cooldown, recovery after 60s |
| Streak calculation | `streak.test.ts` | All state transitions including edge cases |
| Question cache | `cache.test.ts` | Hit, miss, expiry, write |
| ExamWorkspace UI | `ExamWorkspace.test.tsx` | Render, answer reveal, navigation, gold flags, early exit score |
| PWA Registry | `PWARegistry.test.tsx` | Bottom banner position, localStorage 7-day dismissal cooldown |
| Supabase RLS | `supabase-rls.test.ts` | ⚠️ Integration — needs live credentials |

---

## Multi-Subdomain Testing Locally

To test exam-specific subdomains locally without DNS configuration:

```bash
# 1. Option A: /etc/hosts
127.0.0.1  temari.local entrance.temari.local freshman.temari.local exit.temari.local

# 2. Option B: lvh.me (resolves any subdomain to 127.0.0.1 automatically)
curl -H "Host: entrance.temari.top" http://localhost:3000
# Or open in browser:
http://entrance.lvh.me:3000
http://freshman.lvh.me:3000
http://exit.lvh.me:3000
```

---

## The integration test (`supabase-rls.test.ts`)

This test hits the **real Supabase database** to verify row-level security policies. It is **skipped automatically** when `NEXT_PUBLIC_SUPABASE_URL` is not set.

To run it locally:
```bash
# Ensure .env.local has the Supabase credentials, then:
npm test -- __tests__/supabase-rls.test.ts
```

It is excluded from `npm run test:ci` to keep CI fast and secret-free.

---

## Writing new tests

### Rule of thumb

Write a test when:
- You're adding a **pure function** with non-trivial logic (always testable)
- You're adding a **security-sensitive** path (auth, session, signature validation)
- You're fixing a **bug** — write the failing test first
- A component has **critical UI behaviour** (score calculation, navigation state)

### For a utility / lib function

```ts
// __tests__/lib/myUtil.test.ts
import { myFunction } from '@/lib/myUtil';

describe('myFunction', () => {
  it('does the expected thing', () => {
    expect(myFunction(input)).toBe(expectedOutput);
  });

  it('handles the edge case', () => {
    expect(myFunction(edgeCaseInput)).toBeNull();
  });
});
```

### For a React component

```tsx
// __tests__/components/MyComponent.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

// Mock dependencies that make network calls
jest.mock('@/hooks/useTelegram', () => ({
  useTelegram: () => ({ haptic: { impact: jest.fn(), selection: jest.fn() } }),
}));

describe('MyComponent', () => {
  it('renders the main heading', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Mocking Supabase in component tests

Always mock `@/utils/supabase/client` — never let tests hit the database:

```ts
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [], error: null })),
    })),
  })),
}));
```

---

## CI

Every push and pull request to `main` / `master` runs:

1. **Type Check** (`npx tsc --noEmit`) — fails on any TypeScript error
2. **Unit Tests** (`npm run test:ci`) — all tests except integration + e2e
3. **Build** (`npm run build`) — verifies the production bundle compiles

The workflow file is at [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

E2E tests are **not** run in CI — they require a running server and real credentials. Run them locally before large PRs:

```bash
npx playwright test
```

---

## Flags and known issues

| Item | Status | Notes |
|---|---|---|
| `supabase-rls.test.ts` | ⚠️ Integration | Excluded from CI; runs locally if env vars set |
| `e2e/critical-flow.spec.ts` | ⚠️ E2E | Requires `npm run dev` + dev mode bypass; expand coverage |
| `ExamWorkspace.test.tsx` | 🟡 Partial | Score calculation test needs simulator mode prop wiring |
