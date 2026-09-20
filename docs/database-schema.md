# Database Schema

This document describes every table in the Supabase (PostgreSQL) database, their columns, types, constraints, and relationships.

---

## Tables overview

| Table | Purpose |
|---|---|
| `profiles` | One row per user — core identity and preferences |
| `questions` | The 31,000+ exam questions |
| `study_notes` | AI-written chapter summaries for study |
| `user_subject_stats` | Per-user, per-subject mastery tracking |
| `saved_mistakes` | Questions a user has bookmarked during exams |
| `user_pins` | Notes/highlights a user has pinned to their notebook |
| `otp_codes` | One-time codes issued by the Telegram bot for login |
| `admin_users` | Admin dashboard accounts |
| `flashcards` | Study flashcards (front/back) |
| `exam_questions` | _(Legacy/admin view)_ — referenced in admin stats query |

---

## `profiles`

Stores every registered user. Created or updated on first auth.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `telegram_id` | `text` | PRIMARY KEY (or UNIQUE) | Telegram numeric user ID as string |
| `full_name` | `text` | nullable | Concatenation of first + last name from Telegram |
| `username` | `text` | nullable | Telegram @username |
| `avatar_url` | `text` | nullable | Telegram profile photo URL |
| `daily_streak` | `integer` | default 0 | Consecutive days of activity |
| `last_activity_date` | `date` | nullable | ISO date string of last exam/practice |
| `subscription_status` | `text` | default 'free' | `'free'` or `'premium'` |
| `target_exam` | `text` | nullable | `'entrance'`, `'freshman'`, or `'exit'` |
| `stream` | `text` | nullable | G12 stream (e.g. `'Natural Science'`) or exit discipline |
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

## `otp_codes`

Temporary one-time codes generated by the Telegram bot for the login flow.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique code ID |
| `code` | `text` | NOT NULL | 6-character OTP code |
| `telegram_user` | `jsonb` | NOT NULL | Telegram user object (id, first_name, etc.) |
| `used` | `boolean` | default false | True after the code has been consumed |
| `expires_at` | `timestamptz` | NOT NULL | Expiry timestamp (typically 5 minutes after creation) |

---

## `admin_users`

Separate admin accounts for the `/admin` dashboard. Not linked to regular user auth.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Admin account ID |
| `username` | `text` | UNIQUE, NOT NULL | Admin login username |
| `passcode` | `text` | NOT NULL | Plaintext passcode (⚠️ should be hashed in production) |
| `role` | `text` | default 'admin' | `'admin'` or `'superadmin'` |
| `created_at` | `timestamptz` | default now() | Account creation time |

---

## `flashcards`

Study flashcards with front/back content for spaced repetition (currently random).

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

## Entity-relationship summary

```
profiles ─────────────────────────────────────────────────┐
    │                                                       │
    ├── user_subject_stats (telegram_id)                   │
    ├── saved_mistakes (telegram_id) ── questions (id)     │
    └── user_pins (telegram_id)                            │
                                                           │
questions ─────────────────────────────────────────────────┘
study_notes     (standalone — uploaded by admin)
otp_codes       (standalone — issued by Telegram bot)
admin_users     (standalone — separate auth system)
flashcards      (standalone — seeded from CSV data)
```
