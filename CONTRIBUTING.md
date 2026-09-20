# Contributing to Temari

Thank you for your interest in contributing! This document explains how to get set up, what conventions we follow, and how to submit a PR.

---

## Local setup

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (or use the production keys for read-only dev)
- A Telegram bot (from @BotFather) — optional for UI-only work

### Steps

```bash
# 1. Clone the repo
git clone <repo-url>
cd ethio-exam-app

# 2. Install dependencies
npm install

# 3. Copy env template and fill in values
cp .env.example .env.local
# Edit .env.local — at minimum you need the Supabase keys

# 4. Start dev server
npm run dev

# 5. Check types
npx tsc --noEmit
```

> **Note on auth:** Telegram Mini App auth only works inside Telegram. For local UI work, the dev bypass in `src/app/api/auth/session/route.ts` accepts a `devMode: true` payload in development mode, creating a fake session without real Telegram credentials.

---

## Branch naming

| Type | Pattern | Example |
|---|---|---|
| New feature | `feature/<short-description>` | `feature/flashcard-deck` |
| Bug fix | `fix/<short-description>` | `fix/streak-reset-bug` |
| Documentation | `docs/<short-description>` | `docs/api-routes` |
| Refactor | `refactor/<short-description>` | `refactor/exam-workspace-state` |
| Chore | `chore/<short-description>` | `chore/bump-dependencies` |

---

## Commit message format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**

```
feat(ai): add per-user rate limiting to tutor route
fix(auth): ensure session cookie is httpOnly in all paths
docs(api): document the /api/exam/submit route
refactor(exam): extract question grid into its own component
```

- Summary in present tense, lowercase, no period
- Keep summary under 72 characters
- Reference issues in the footer: `Closes #42`

---

## Pull request process

1. **Branch off `main`** — always start from an up-to-date main
2. **Keep PRs small** — one concern per PR makes review faster
3. **Pass CI checks:**
   - `npx tsc --noEmit` must pass with no errors
   - `npm run build` must succeed
4. **Write a clear PR description:**
   - What changed and why
   - Screenshots for UI changes
   - Any migration steps needed
5. **Request review** from a maintainer
6. **Squash-merge** after approval — keep the main branch linear

---

## Code review expectations

**As an author:**
- Self-review your diff before requesting review
- Annotate complex logic with inline comments
- Keep component files under ~300 lines — split if larger

**As a reviewer:**
- Review within 48 hours when possible
- Be specific: point to the exact line, suggest the fix
- Distinguish blocking issues from suggestions (use "nit:" prefix for non-blocking)
- Approve only when you'd be comfortable maintaining this code

---

## Code conventions

### TypeScript
- All new code must be typed — no `any` unless absolutely necessary and documented
- Prefer interfaces for object shapes, `type` for unions/aliases
- Server-only code (API routes, Server Actions) should import from `@/utils/supabase/server` or `@/utils/supabase/admin`, never from `@/utils/supabase/client`

### React / Next.js
- Use `'use client'` directive only when necessary (hooks, event handlers)
- Prefer Server Components for data-fetching pages
- Components → PascalCase files and exports
- Utility functions → camelCase files
- No `console.log` in committed code — `console.error` is fine for error paths

### Styling
- Tailwind classes only — no inline `style={{}}` except for dynamic values that can't be expressed in Tailwind
- Use the design system tokens: `bg-ground`, `bg-card`, `text-primary`, `border-black/5` etc.
- Mobile-first — test at 390px width (iPhone 14 Pro)

---

## Where to find issues

- Check the GitHub Issues tab for open tasks tagged `good first issue` or `help wanted`
- Examine `TODO` / `FIXME` comments in the codebase: `grep -r "TODO\|FIXME" src/`
- Known areas needing improvement:
  - Rate limiting is in-memory (single-instance) — needs Redis for multi-instance scale
  - The admin dashboard has no pagination on the user list
  - Flashcard deck needs spaced repetition algorithm
  - E2E tests are incomplete — Playwright tests need expansion

---

## Questions

Open a GitHub issue or DM [@abdusalam](https://t.me/abdusalam) on Telegram.
