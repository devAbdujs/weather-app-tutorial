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
  "code_verifier": "string",
  "redirect_uri": "string (optional, defaults to NEXT_PUBLIC_SITE_URL/auth/callback)"
}
```

**Flow:**
1. POSTs to `https://oauth.telegram.org/token` with Basic auth (`client_id:client_secret`)
2. Decodes the returned `id_token` JWT payload (base64 only — no signature verification needed since transport is TLS)
3. Extracts `telegram_id`, `name`, `phone_number`
4. Upserts profile into Supabase
5. Issues session cookie

**Success response:** `{ success: true, phone: string }`

**Error responses:**
| Status | Reason |
|---|---|
| 400 | Missing parameters or invalid token payload |
| 401 | Telegram rejected the code exchange |
| 500 | Internal server error |

---

### `POST /api/auth/telegram/web`

Verifies a Telegram Web Widget login payload and upserts the user. Does **not** issue a session cookie — this is a profile-sync endpoint.

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
| 400 | Missing hash or id |
| 403 | Invalid signature |
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
| 500 | Internal server error |
