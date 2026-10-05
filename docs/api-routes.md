# API Routes

All routes live under `/api/`. Unless noted, they return JSON. Auth is enforced via the `es_session` HttpOnly cookie.

---

## Authentication routes

### `POST /api/auth/session`

The primary auth endpoint. Accepts Telegram Mini App `initData`, a Web Widget hash payload, or a dev-mode bypass.

**Auth required:** No (this is the login endpoint)

**Request body:**
```json
{
  "initData": "string (Telegram Mini App initData)",
  "webData": { "id": 123, "first_name": "...", "hash": "...", "auth_date": 1234567890 },
  "devMode": true
}
```
One of `initData`, `webData`, or `devMode` (development only) must be present.

**Validation:**
- `initData` — HMAC-SHA256 validated using `WebAppData` secret derivation
- `webData` — SHA-256 + HMAC-SHA256 validated using `BOT_TOKEN`
- `devMode` — only accepted when `NODE_ENV === 'development'`
- Rejects `initData` older than 24 hours (replay attack prevention)

**On success:**
- Upserts user into `profiles` table
- Sets `es_session` cookie (AES-GCM encrypted, HttpOnly, 30 days)
- Returns `{ success: true, hasTargetExam: boolean }`

**Error responses:**
| Status | Reason |
|---|---|
| 400 | Missing or invalid data |
| 403 | Invalid signature |
| 500 | Internal server error |

---

### `POST /api/auth/oidc`

Exchanges a Telegram OIDC authorization code for a session. Part of the PKCE flow used on web browsers.

**Auth required:** No

**Request body:**
```json
{
  "code": "string",
  "code_verifier": "string"
}
```
*Note: For security against open redirect attacks, `redirect_uri` is strictly constructed server-side from trusted host headers and `NEXT_PUBLIC_SITE_URL`.*

**Flow:**
1. POSTs to `https://oauth.telegram.org/token` with Basic auth (`client_id:client_secret`)
2. Decodes the returned `id_token` JWT payload (base64 only — transport is TLS)
3. Extracts `telegram_id`, `name`, `phone_number`
4. Upserts profile into Supabase (including verified `phone_number`)
5. Issues `es_session` cookie (AES-GCM encrypted, HttpOnly, 30 days)

**Success response:** `{ success: true, phone: string }`

**Error responses:**
| Status | Reason |
|---|---|
| 400 | Missing parameters or invalid token payload |
| 401 | Telegram rejected the code exchange |
| 500 | Internal server error |

---

### `POST /api/auth/telegram/web`

Verifies a Telegram Web Widget login payload and authenticates the user. Issues a secure `es_session` cookie and automatically configures `target_exam` based on the active subdomain (`x-subdomain` header).

**Auth required:** No

**Request body:**
```json
{
  "id": 123456789,
  "first_name": "string",
  "last_name": "string (optional)",
  "username": "string (optional)",
  "photo_url": "string (optional)",
  "auth_date": 1234567890,
  "hash": "string"
}
```

**Success response:** `{ success: true }`

**Error responses:**
| Status | Reason |
|---|---|
| 400 | Missing required fields or payload expired (> 24 hours) |
| 403 | Invalid HMAC signature |
| 500 | Internal server error |

---

### `POST /api/auth/phone`

Experimental phone-number based registration. Creates a profile using a Telegram ID derived from phone number. PIN verification is currently bypassed.

> ⚠️ **Status:** Incomplete — PIN verification not implemented. Do not rely on this for security.

**Auth required:** No

**Request body:** `{ "telegramId": "string", "pin": "string", "isNewUser": boolean }`

**Success response:** `{ success: true, hasTargetExam: boolean }` + sets `es_session` cookie

---

### `POST /api/auth/verify-otp`

Verifies a 6-digit OTP code issued by the Telegram bot. On success, upserts the user and issues a session cookie.

**Auth required:** No

**Request body:** `{ "code": "string (6 digits)" }`

**Flow:**
1. Looks up the code in `otp_codes` table (must be unused and not expired)
2. Marks code as `used = true`
3. Upserts user profile
4. Issues `es_session` cookie

**Success response:** `{ success: true, hasTargetExam: boolean }`

**Error responses:**
| Status | Reason |
|---|---|
| 400 | Invalid code format |
| 401 | Code not found, already used, or expired |
| 500 | Internal server error |

---

## AI routes

All AI routes require auth and enforce per-IP rate limiting.

### `POST /api/ai/tutor`

Streams an AI explanation for a specific exam question. Uses Gemini with round-robin key rotation and automatic retry on 429.

**Auth required:** Yes (`es_session` cookie)

**Rate limit:** 3 requests per minute per IP

**Request body:**
```json
{
  "messages": [{ "role": "user", "content": "string" }],
  "question": {
    "question": "string",
    "option_a": "string",
    "option_b": "string",
    "option_c": "string",
    "option_d": "string",
    "answer": "string",
    "explanation": "string"
  },
  "studentAnswer": "string (optional)"
}
```

**Response:** Chunked text stream (AI SDK `TextStreamResponse`)

**Error responses:**
| Status | Reason |
|---|---|
| 401 | No session |
| 429 | Rate limited (client) or all Gemini keys exhausted |
| 500 | Internal server error |

**Runtime:** Edge (Vercel Edge Functions)

---

### `POST /api/ai/quiz`

Generates 3 conceptual multiple-choice questions based on provided note text. Uses `generateObject` with a strict Zod schema.

**Auth required:** Yes

**Rate limit:** 1 request per minute per IP

**Request body:**
```json
{
  "noteText": "string (chapter text, max 8000 chars used)"
}
```

**Success response:**
```json
{
  "success": true,
  "quiz": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "string (exact text of correct option)",
      "explanation": "string"
    }
  ]
}
```

**Error responses:**
| Status | Reason |
|---|---|
| 400 | Missing `noteText` |
| 401 | No session |
| 429 | Rate limited or all keys exhausted |
| 500 | Internal server error |

**Runtime:** Edge

---

### `POST /api/ai/tip`

Generates a short motivational tip tailored to the user's exam type and streak.

**Auth required:** Yes

**Rate limit:** 1 request per minute per IP

**Request body:**
```json
{
  "examType": "entrance | freshman | exit",
  "streak": 5,
  "hour": 14
}
```

**Success response:** `{ "tip": "string" }`

On Gemini failure, returns a hardcoded fallback tip (never fails the request).

**Runtime:** Edge

---

## Exam routes

### `POST /api/exam/submit`

Records the result of a completed exam session. Updates cumulative stats in `user_subject_stats`.

**Auth required:** Yes

**Request body:**
```json
{
  "subject": "string",
  "attempted": 50,
  "correct": 38,
  "timeSpentSeconds": 3600
}
```

Validated with Zod: all numbers must be non-negative integers.

**Success response:**
```json
{
  "success": true,
  "stats": {
    "attempted": 150,
    "correct": 112,
    "level": 4
  }
}
```
Returns the **cumulative** stats (existing + new), and the computed mastery level (1–5).

**Error responses:**
| Status | Reason |
|---|---|
| 400 | Invalid request body |
| 401 | No session |
| 500 | Internal server error |

---

## Notebook / Pins routes

### `GET /api/pins?subject=<subject>`

Returns all pinned notes for the authenticated user. Optionally filter by subject.

**Auth required:** Yes

**Query params:**
| Param | Required | Description |
|---|---|---|
| `subject` | No | Filter by subject. Omit or pass `'All'` to get all pins |

**Success response:** Array of pin objects:
```json
[
  {
    "id": "uuid",
    "telegram_id": "string",
    "subject": "string",
    "chapter_title": "string",
    "content": "string",
    "created_at": "ISO timestamp"
  }
]
```

---

### `POST /api/pins`

Creates a new pin in the user's notebook.

**Auth required:** Yes

**Request body:**
```json
{
  "subject": "string",
  "chapter_title": "string",
  "content": "string (required)"
}
```

**Success response:** The newly created pin object.

**Error responses:** 400 if `content` is missing; 401 if no session.

---

### `DELETE /api/pins`

Deletes a specific pin by ID. Only deletes pins owned by the authenticated user.

**Auth required:** Yes

**Request body:** `{ "id": "uuid" }`

**Success response:** `{ "success": true }`

---

## Bot webhook

### `POST /api/bot/webhook`

Receives updates from Telegram's Bot API. Registered with Telegram's `setWebhook`.

**Auth required:** Verified via `X-Telegram-Bot-Api-Secret-Token` header (SHA-256 of BOT_TOKEN, first 32 chars).

**Handles:**
- `/start` command — sends a welcome message with a link to open the Mini App

**Response:** Always returns `{ ok: true }` with HTTP 200 (Telegram requires this even on errors).

---

## Admin routes

### `POST /api/admin/notes`

Uploads a new study note. Requires admin authentication via the separate admin session cookie.

**Auth required:** Admin session (`admin_session` cookie, checked against `admin_users` table)

**Request body:**
```json
{
  "examType": "entrance | freshman | exit",
  "department": "string",
  "title": "string",
  "content": "string (markdown)"
}
```

**Success response:** `{ "success": true }`

**Error responses:**
| Status | Reason |
|---|---|
| 400 | Missing required fields |
| 401 | Not an admin |
| 403 | Forbidden (readonly role blocked) |
| 500 | Internal server error |

---

### `POST /api/admin/notes/transform`

Transforms raw documents (PDF, DOCX, TXT) or raw study notes text into structured chapters using Gemini AI.

**Auth required:** Admin session (`admin_session` cookie). `readonly` role accounts are rejected with HTTP 403.

**Request body (JSON or multipart):**
```json
{
  "text": "Raw curriculum text...",
  "subject": "Mathematics",
  "examType": "entrance"
}
```

**Success response:**
```json
{
  "success": true,
  "chapters": [
    {
      "title": "Chapter 1: Limits & Continuity",
      "summary": "Key concepts...",
      "key_terms": ["Limit", "Continuity"],
      "content": "Detailed markdown..."
    }
  ]
}
```

---

## Payment routes

### `POST /api/payments/submit`

Submits manual CBE or Telebirr payment receipt for verification. Uploads image to Supabase Storage `receipts` bucket, performs Gemini Vision OCR to parse transaction reference and amount, and registers a pending receipt.

**Auth required:** Yes (`es_session` cookie)

**Request body (FormData):**
- `file`: Image file (PNG, JPEG, WebP)
- `telegram_id`: User's Telegram ID
- `tier`: `"premium"`

**Success response:**
```json
{
  "success": true,
  "receiptId": "uuid",
  "ocrStatus": "matched" | "manual_review",
  "detectedReference": "TX12345678"
}
```

---

### `GET /api/payments/status`

Retrieves the current status of the student's latest payment receipt. Polled by the client upgrade screen (capped at 25 attempts).

**Auth required:** Yes (`es_session` cookie)

**Success response:**
```json
{
  "status": "pending" | "approved" | "rejected" | "none",
  "isPremium": boolean,
  "receiptId": "uuid | null"
}
```

---

## Study notes highlights routes

### `GET /api/highlights?chapterId=<id>`

Fetches all user highlights for a specific chapter in study notes.

**Auth required:** Yes (`es_session` cookie)

**Success response:**
```json
[
  {
    "id": "uuid",
    "chapter_id": "string",
    "color": "yellow | green | blue | pink",
    "selected_text": "Highlighted phrase...",
    "created_at": "ISO timestamp"
  }
]
```

---

### `POST /api/highlights`

Creates a new text highlight on a study note chapter. Enforces max 2000 characters per highlight.

**Auth required:** Yes (`es_session` cookie)

**Request body:**
```json
{
  "chapterId": "string",
  "color": "yellow | green | blue | pink",
  "selectedText": "Text to highlight"
}
```

**Success response:** `{ "success": true, "highlight": { ... } }`

---

## Scheduled cron jobs

### `GET /api/cron/streak-reminder`

Triggered daily at 20:00 EAT (17:00 UTC) via Vercel Cron. Queries active users whose last practice was yesterday and sends a personalized Telegram reminder to preserve their daily streak.

**Auth required:** Verified via `Authorization: Bearer <CRON_SECRET>` header.

**Success response:**
```json
{
  "success": true,
  "checked": 142,
  "reminded": 38
}
```
