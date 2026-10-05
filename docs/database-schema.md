# Database Schema

This document describes every table in the Supabase (PostgreSQL) database, their columns, types, constraints, and relationships.

---

## Tables overview

| Table | Purpose |
|---|---|
| `profiles` | One row per user — core identity, streak, AI quota, and preferences |
| `questions` | The 31,000+ exam questions |
| `study_notes` | AI-written chapter summaries for study (auth/premium gated) |
| `user_subject_stats` | Per-user, per-subject mastery tracking |
| `saved_mistakes` | Questions a user has bookmarked during exams |
| `user_pins` | Notes/highlights a user has pinned to their notebook |
| `payment_receipts` | CBE / Telebirr receipt OCR verification, status, and audit logs |
| `ai_responses_cache` | Cached Gemini explanations by question ID and prompt type |
| `admin_users` | Admin dashboard accounts with scoped permissions |
| `admin_audit_logs` | Audit trail for all administrative and financial actions |
| `flashcards` | Study flashcards (front/back) |

---

## `profiles`

Stores every registered user. Created or updated on first auth.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `telegram_id` | `text` | PRIMARY KEY (or UNIQUE) | Telegram numeric user ID as string |
| `full_name` | `text` | nullable | Concatenation of first + last name from Telegram |
| `username` | `text` | nullable | Telegram @username |
| `phone_number` | `text` | nullable | Verified phone number from Telegram OIDC / account |
| `avatar_url` | `text` | nullable | Telegram profile photo URL |
| `daily_streak` | `integer` | default 0 | Consecutive days of activity |
| `last_activity_date` | `date` | nullable | ISO date string of last exam/practice |
| `subscription_status` | `text` | default 'free' | `'free'` or `'premium'` |
| `target_exam` | `text` | nullable | `'entrance'`, `'freshman'`, or `'exit'` |
| `stream` | `text` | nullable | G12 stream (e.g. `'Natural Science'`) or exit discipline |
| `ai_weekly_usage` | `integer` | default 0 | Free tier AI tutor requests used this week |
| `ai_quota_reset_at` | `timestamptz` | nullable | Timestamp when weekly AI allowance resets |
| `created_at` | `timestamptz` | default now() | Account creation timestamp |
| `updated_at` | `timestamptz` | default now() | Last profile update timestamp |

**Relationships:** Referenced by `user_subject_stats.telegram_id`, `saved_mistakes.telegram_id`, `user_pins.telegram_id`.

---

## `questions`

The core content table. Contains every exam question from all three exam types.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique question ID |
| `exam_type` | `text` | NOT NULL | `'entrance'`, `'freshman'`, `'exit'`, `'grade8'`, `'grade6'` |
| `grade` | `integer` | nullable | Grade level (for grade 6/8 questions) |
| `category` | `text` | nullable | Broad category grouping |
| `subject` | `text` | NOT NULL | Subject name (e.g. `'Mathematics'`, `'Biology'`) |
| `year_ec` | `integer` | nullable | Ethiopian Calendar year of the exam |
| `year_gc` | `integer` | nullable | Gregorian Calendar year (derived) |
| `exam_title` | `text` | nullable | Full exam title string |
| `section` | `text` | nullable | Section within the exam |
| `unit` | `text` | nullable | Chapter/unit tag |
| `number` | `integer` | nullable | Question number within its exam |
| `question` | `text` | NOT NULL | Question stem text (may include LaTeX math) |
| `option_a` | `text` | nullable | Answer choice A |
| `option_b` | `text` | nullable | Answer choice B |
| `option_c` | `text` | nullable | Answer choice C |
| `option_d` | `text` | nullable | Answer choice D |
| `answer` | `text` | nullable | Correct answer letter: `'A'`, `'B'`, `'C'`, or `'D'` |
| `explanation` | `text` | nullable | Written explanation of the answer |
| `image_url` | `text` | nullable | Cloudinary public ID for a diagram image |
| `source` | `text` | NOT NULL | Data source identifier |
| `university` | `text` | nullable | University name (for freshman/exit questions) |
| `exam_period` | `text` | nullable | `'midterm'` or `'final'` |
| `department` | `text` | nullable | Department name (for exit exam questions) |
| `exam_variant` | `text` | nullable | `'mock'` or `'model'` |

**Indexes:** Queries filter on `exam_type`, `subject`, `year_ec`, `university`, `exam_period`, `department`.

---

## `study_notes`

AI-written study summaries organized by exam type and department/subject.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique note ID |
| `exam_type` | `text` | NOT NULL | `'entrance'`, `'freshman'`, or `'exit'` |
| `department` | `text` | nullable | Subject or department the note covers |
| `title` | `text` | NOT NULL | Chapter or topic title |
| `content` | `text` | nullable | Full markdown content of the note |
| `content_url` | `text` | nullable | External URL to note content (alternative to inline) |
| `created_at` | `timestamptz` | default now() | When the note was uploaded |

---

## `user_subject_stats`

Tracks cumulative per-user, per-subject performance. Upserted after each exam submission.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `telegram_id` | `text` | NOT NULL | Foreign key → `profiles.telegram_id` |
| `subject` | `text` | NOT NULL | Subject name |
| `questions_attempted` | `integer` | default 0 | Total questions answered |
| `questions_correct` | `integer` | default 0 | Total correct answers |
| `total_time_spent_seconds` | `integer` | default 0 | Cumulative time in seconds |
| `last_practiced` | `timestamptz` | nullable | Most recent practice timestamp |

**Primary key / unique constraint:** `(telegram_id, subject)` — upserted on conflict.

**Level thresholds (computed in app):**
| Level | Min correct answers |
|---|---|
| 1 | 0 |
| 2 | 11 |
| 3 | 26 |
| 4 | 51 |
| 5 | 101 |

---

## `saved_mistakes`

Questions a user bookmarks during an exam session for later review.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique bookmark ID |
| `telegram_id` | `text` | NOT NULL | Foreign key → `profiles.telegram_id` |
| `question_id` | `uuid` | NOT NULL | Foreign key → `questions.id` |
| `created_at` | `timestamptz` | default now() | When the question was bookmarked |

---

## `user_pins`

Notes, highlights, or study content a user pins to their personal notebook.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique pin ID |
| `telegram_id` | `text` | NOT NULL | Foreign key → `profiles.telegram_id` |
| `subject` | `text` | nullable | Subject the pin belongs to |
| `chapter_title` | `text` | nullable | Chapter or section title |
| `content` | `text` | NOT NULL | The pinned text content |
| `created_at` | `timestamptz` | default now() | When the pin was created |

---

## `payment_receipts`

Payment verification records submitted by students for CBE and Telebirr manual bank transfers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique receipt record ID |
| `telegram_id` | `text` | NOT NULL | Foreign key → `profiles.telegram_id` |
| `receipt_url` | `text` | NOT NULL | Supabase Storage path in private `receipts` bucket |
| `status` | `text` | default 'pending' | `'pending'`, `'approved'`, or `'rejected'` |
| `tier` | `text` | default 'premium' | Requested subscription level |
| `transaction_id` | `text` | nullable | Extracted or confirmed bank transaction ID |
| `detected_amount` | `numeric` | nullable | ETB payment amount parsed via Gemini OCR |
| `created_at` | `timestamptz` | default now() | When the receipt was submitted |
| `reviewed_at` | `timestamptz` | nullable | When reviewed by admin or bot |
| `reviewed_by` | `text` | nullable | Telegram ID or username of reviewing admin |

---

## `ai_responses_cache`

Dual-layer prompt response cache to eliminate repetitive latency and Gemini API costs.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique cache entry ID |
| `question_id` | `text` | NOT NULL | Question identifier |
| `prompt_type` | `text` | NOT NULL | `'explain'`, `'eli5'`, `'amharic'`, or `'hint'` |
| `response` | `text` | NOT NULL | Cached AI response text (markdown / KaTeX) |
| `created_at` | `timestamptz` | default now() | Timestamp cached |

**Unique constraint:** `(question_id, prompt_type)` — upserted with duplicate prevention.

---

## `admin_users`

Separate admin accounts for the `/admin` dashboard with granular role permissions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Admin account ID |
| `username` | `text` | UNIQUE, NOT NULL | Admin login username |
| `passcode` | `text` | NOT NULL | Argon2 / bcrypt hashed password (or legacy plaintext) |
| `role` | `text` | default 'readonly' | `'superadmin'`, `'financial_admin'`, `'editor'`, `'reviewer'`, or `'readonly'` |
| `is_active` | `boolean` | default true | Whether the account is permitted to login |
| `created_at` | `timestamptz` | default now() | Account creation time |

---

## `admin_audit_logs`

Comprehensive tamper-evident log of administrative actions across payments, content, and permissions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique audit log ID |
| `admin_id` | `text` | NOT NULL | ID or username of executing admin |
| `action` | `text` | NOT NULL | E.g. `'payment:approve'`, `'question:create'`, `'user:toggle_active'` |
| `target_resource` | `text` | NOT NULL | E.g. `'payments'`, `'questions'`, `'admin_users'` |
| `target_id` | `text` | nullable | Resource identifier acted upon |
| `details` | `jsonb` | nullable | Action metadata, diffs, or batch counts |
| `created_at` | `timestamptz` | default now() | When the action occurred |

---

## `flashcards`

Study flashcards with front/back content for spaced repetition.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique flashcard ID |
| `grade` | `integer` | NOT NULL | Grade level the card belongs to |
| `subject` | `text` | NOT NULL | Subject name |
| `unit` | `text` | nullable | Unit or chapter tag |
| `front` | `text` | NOT NULL | Question/term side of the card |
| `back` | `text` | NOT NULL | Answer/definition side of the card |
| `source` | `text` | NOT NULL | Data source identifier |

---

## Database Functions (RPC)

### `increment_user_subject_stats`
Atomic stored procedure that increments attempted count, correct count, time spent, and updates `last_practiced` for a user and subject in a single transaction, eliminating client race conditions.

```sql
SELECT increment_user_subject_stats(
  p_telegram_id := '123456789',
  p_subject := 'Mathematics',
  p_attempted := 25,
  p_correct := 22,
  p_time_spent := 1200
);
```

### `check_and_increment_ai_quota`
Enforces the 15-question weekly AI quota on free-tier students. Automatically rolls over weekly quotas if 7 days have elapsed since `ai_quota_reset_at`, increments usage atomically, and rejects requests exceeding the threshold.

---

## Entity-relationship summary

```
profiles ─────────────────────────────────────────────────────────┐
    │                                                               │
    ├── user_subject_stats (telegram_id)                           │
    ├── saved_mistakes (telegram_id) ── questions (id)             │
    ├── user_pins (telegram_id)                                    │
    └── payment_receipts (telegram_id)                             │
                                                                   │
questions ─────────────────────────────────────────────────────────┘
ai_responses_cache (question_id)
study_notes        (content library — premium/authenticated access only)
admin_users ─────── admin_audit_logs (admin_id)
flashcards         (standalone — seeded from curriculum data)
```

---

## Security & Row Level Security (RLS)

The database is locked down with PostgreSQL Row Level Security (RLS). 

- **Read Operations (`SELECT`):** Only public static tables (`questions`, `flashcards`) permit anon read access. Public `SELECT` on `study_notes` is explicitly revoked to prevent bypassing the premium paywall via direct PostgREST anon queries.
- **Write Operations (`INSERT`/`UPDATE`/`DELETE`):** No tables allow direct writes from the `anon` or untrusted roles. All mutations must occur securely on the backend (Next.js Server Actions or API routes) using the Supabase Service Role key after validating the encrypted `es_session` cookie.
