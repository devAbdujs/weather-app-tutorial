# Exam Types

Temari supports three distinct Ethiopian exam types, each with its own navigation hierarchy, session structure, and question set.

---

## Overview

| Exam Type | Key | Target users | Questions | Hierarchy |
|---|---|---|---|---|
| Grade 12 EUEE | `entrance` | Grade 12 students | ~18,000+ | Subject → Year → Session |
| University Freshman | `freshman` | First-year university students | ~8,000+ | Course → Session |
| University Exit | `exit` | Final-year university students | ~5,000+ | Department → Session |

---

## 1. Entrance (Grade 12 EUEE)

The **Ethiopian University Entrance Examination (EUEE)** is the national standardized test taken by Grade 12 students. It determines university placement.

### Subjects

| Subject | Notes |
|---|---|
| Mathematics | Natural Science & Social Science streams |
| Physics | Natural Science only |
| Chemistry | Natural Science only |
| Biology | Natural Science only |
| English | All streams |
| Scholastic Aptitude (SAT) | All streams |
| Geography | Social Science only |
| History | Social Science only |
| Economics | Social Science only |
| Civics & Citizenship | All streams |

### Navigation flow

```
Practice Hub
    └── [Select Subject] (e.g. Mathematics)
            └── /practice/sessions?examType=entrance&subject=Mathematics
                    │
                    │  Counts total questions for this subject (all years)
                    │  Divides into sessions of 100 questions
                    ▼
                [Session list] → /exam/session?examType=entrance&subject=Mathematics&sessionId=1&...
```

### Session rules

- **Session size:** 100 questions per session
- **Timer:** 120 minutes (2 hours) for 100-question sessions in exam mode
- **Mode:** `practice` (reveal answers immediately) or `exam` (reveal on submit)
- **Year filter:** Users can filter by Ethiopian Calendar year (2010–2018)
- **Available years:** 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018 (E.C.)

### Question tags

Entrance questions are tagged with:
- `subject` — which subject
- `year_ec` — Ethiopian Calendar year of the original exam
- `year_gc` — Gregorian Calendar equivalent
- `section` — section of the exam paper (optional)
- `number` — question number within its paper

---

## 2. Freshman (University Year 1)

**University Freshman Exams** are taken by first-year university students across Ethiopian universities. These are common-course exams required of all students regardless of department.

### Courses

| Course | Notes |
|---|---|
| English | Academic writing and comprehension |
| Psychology | Introduction to psychology |
| Logic | Critical thinking and reasoning |
| Mathematics for Natural Sciences | Calculus, algebra (Natural Science track) |
| Geography | Physical and human geography |
| Global Trends | Globalization and current affairs |
| Economics | Introduction to micro/macroeconomics |
| Applied Math I | Applied mathematics (engineering track) |
| Emerging Technology | Tech literacy and digital systems |
| Civics | Civic education and governance |
| Anthropology | Introduction to social anthropology |
| Inclusiveness | Diversity and social inclusion |

### Navigation flow

```
Practice Hub
    └── [Select Course] (e.g. English)
            └── /practice/sessions?examType=freshman&subject=English
                    │
                    │  Counts questions for this course across all universities and years
                    │  Divides into sessions of 50 questions
                    ▼
                [Session list] → /exam/session?examType=freshman&subject=English&sessionId=1&...
```

### Session rules

- **Session size:** 50 questions per session
- **Timer:** 60 minutes in exam mode
- **Mode:** `practice` or `exam`
- **University filter:** Available when a `university` param is provided
- **Period filter:** `midterm` or `final` (optional, maps to `exam_period` column)

### Question tags

Freshman questions are tagged with:
- `subject` — course name
- `university` — which university set this question
- `exam_period` — `'midterm'` or `'final'`
- `year_ec` / `year_gc` — academic year

---

## 3. Exit (University Final Year)

The **University Exit Exam** is a national assessment taken by final-year university students to demonstrate field competency before graduation.

### Departments

| Department |
|---|
| Computer Science |
| Software Engineering |
| Information Technology |
| Information Systems |
| Civil Engineering |
| Mechanical Engineering |
| Electrical Engineering |
| Accounting and Finance |
| Management |
| Economics |
| Law |
| Medicine |
| Nursing |
| Pharmacy |

### Navigation flow

```
Practice Hub
    └── [Select Department] (e.g. Computer Science)
            └── /practice/sessions?examType=exit&subject=Computer+Science
                    │
                    │  Counts questions for this department
                    │  Divides into sessions of 50 questions
                    ▼
                [Session list] → /exam/session?examType=exit&subject=Computer+Science&sessionId=1&...
```

### Session rules

- **Session size:** 50 questions per session
- **Timer:** 60 minutes in exam mode
- **Mode:** `practice` or `exam`
- **Department = subject:** The `subject` column stores the department name for exit questions

### Question tags

Exit questions are tagged with:
- `subject` — department name (doubles as the subject field)
- `department` — same as subject (redundant field for legacy queries)
- `exam_variant` — `'mock'` or `'model'` (optional)
- `university` — originating university (optional)

---

## Session sizing logic

Session sizes are computed in `/src/app/(app)/practice/sessions/page.tsx`:

```
totalQuestions = count from Supabase with applied filters
fullSessions   = Math.floor(totalQuestions / sessionSize)
remainder      = totalQuestions % sessionSize

displayed sessions:
  - fullSessions × sessionSize-question sessions
  - if remainder > 0: one partial session with the remaining questions
```

Session offset is calculated as:
```
offset = (sessionId - 1) × sessionSize
```

This is passed to Supabase's `.range(offset, offset + sessionSize - 1)` for pagination.

---

## How questions are filtered

The `ExamSessionLoader` builds a Supabase query with these filters:

| Filter | Supabase column | Source |
|---|---|---|
| Exam type | `exam_type` | `examType` URL param |
| Subject / department | `subject` | `subject` URL param |
| Year (EUEE) | `year_ec` | `year` URL param |
| Exam period | `exam_period` | `period` URL param |

All filters are additive (AND). The `subject = 'All'` case skips the subject filter to mix all subjects.

---

## Mode: Practice vs. Exam

| Feature | Practice mode | Exam mode (simulator) |
|---|---|---|
| Answer reveal | Immediately on tap | After "Submit" |
| Explanation shown | Immediately | After "Submit" |
| Timer | None | Yes (60 or 120 min) |
| Ask AI button | Always visible | Only after answering |
| Bookmark button | Visible | Visible |

Mode is set via the `mode` URL param: `practice` or `exam`.
