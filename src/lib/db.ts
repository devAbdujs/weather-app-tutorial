import Database from 'better-sqlite3';
import path from 'path';
import { Question, Flashcard, StudyNote, TrackSummary, SubjectSummary } from '@/types';

// Singleton DB connection
let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), 'data', 'ethio_exam_vault.db');
    dbInstance = new Database(dbPath, { readonly: true });
  }
  return dbInstance;
}

export function getTrackSummaries(): TrackSummary[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT exam_type, count(*) as count 
    FROM questions 
    GROUP BY exam_type
  `).all() as { exam_type: string; count: number }[];

  const countMap = new Map(rows.map(r => [r.exam_type, r.count]));

  return [
    {
      exam_type: 'entrance',
      title: 'Grade 12 Entrance Exam (EUEE)',
      subtitle: 'Natural & Social Science Past Exams (2008 - 2018 E.C.)',
      questionCount: countMap.get('entrance') || 14254,
      badge: 'National Exam',
      icon: 'GraduationCap',
      color: 'from-blue-600 to-indigo-700'
    },
    {
      exam_type: 'freshman',
      title: 'University Freshman Matrix',
      subtitle: 'Common Courses: Physics, Calculus, Logic, Tech & more',
      questionCount: countMap.get('freshman') || 2418,
      badge: 'University Tier 1',
      icon: 'BookOpen',
      color: 'from-emerald-600 to-teal-700'
    },
    {
      exam_type: 'exit',
      title: 'University Exit Examinations',
      subtitle: '20+ Disciplines: CS, Engineering, Business, Medicine',
      questionCount: countMap.get('exit') || 13019,
      badge: 'Licensing & Exit',
      icon: 'Award',
      color: 'from-purple-600 to-violet-800'
    },
    {
      exam_type: 'grade8',
      title: 'Grade 8 Ministry Exam',
      subtitle: 'Regional & National Grade 8 Assessment Practice',
      questionCount: countMap.get('grade8') || 3491,
      badge: 'Regional Exam',
      icon: 'FileText',
      color: 'from-amber-600 to-orange-700'
    },
    {
      exam_type: 'grade6',
      title: 'Grade 6 Regional Exam',
      subtitle: 'Foundational Primary Education Preparation',
      questionCount: countMap.get('grade6') || 805,
      badge: 'Primary Tier',
      icon: 'Compass',
      color: 'from-rose-600 to-pink-700'
    }
  ];
}

export function getSubjectsByTrack(examType: string): SubjectSummary[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT subject, category, count(*) as count, group_concat(DISTINCT year_ec) as years, group_concat(DISTINCT section) as sections
    FROM questions
    WHERE exam_type = ?
    GROUP BY subject, category
    ORDER BY count DESC
  `).all(examType) as { subject: string; category: string | null; count: number; years: string | null; sections: string | null }[];

  return rows.map(r => {
    const rawYears = r.years ? r.years.split(',').map(y => parseInt(y)).filter(y => !isNaN(y)) : [];
    rawYears.sort((a, b) => b - a);

    const rawSections = r.sections ? r.sections.split(',').map(s => s.trim()).filter(Boolean) : [];
    rawSections.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    return {
      subject: r.subject,
      category: r.category,
      questionCount: r.count,
      years: rawYears,
      sections: rawSections
    };
  });
}

export function getQuestions(params: {
  examType: string;
  subject?: string;
  section?: string;
  year?: number;
  limit?: number;
  offset?: number;
  random?: boolean;
}): { questions: Question[]; total: number } {
  const db = getDb();
  let query = 'SELECT * FROM questions WHERE exam_type = ?';
  const args: (string | number)[] = [params.examType];

  if (params.subject && params.subject !== 'all') {
    query += ' AND subject = ?';
    args.push(params.subject);
  }

  if (params.section && params.section !== 'all') {
    query += ' AND section = ?';
    args.push(params.section);
  }

  if (params.year) {
    query += ' AND year_ec = ?';
    args.push(params.year);
  }

  // Count total
  const countQuery = query.replace('SELECT *', 'SELECT count(*) as count');
  const total = (db.prepare(countQuery).get(...args) as { count: number }).count;

  if (params.random) {
    query += ' ORDER BY RANDOM()';
  } else {
    query += ' ORDER BY CASE WHEN number IS NOT NULL THEN number ELSE rowid END ASC';
  }

  if (params.limit) {
    query += ' LIMIT ? OFFSET ?';
    args.push(params.limit, params.offset || 0);
  }

  const questions = db.prepare(query).all(...args) as Question[];
  return { questions, total };
}

export function getQuestionById(id: string): Question | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as Question) || null;
}

export function getFlashcardSubjects(): { subject: string; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT subject, count(*) as count 
    FROM flashcards 
    GROUP BY subject 
    ORDER BY count DESC
  `).all() as { subject: string; count: number }[];
}

export function getFlashcardUnits(subject?: string): string[] {
  const db = getDb();
  let query = 'SELECT DISTINCT unit FROM flashcards WHERE unit IS NOT NULL AND unit != ""';
  const args: string[] = [];
  if (subject && subject !== 'All') {
    query += ' AND subject = ?';
    args.push(subject);
  }
  const rows = db.prepare(query).all(...args) as { unit: string }[];
  const units = rows.map(r => r.unit.trim()).filter(Boolean);
  units.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  return units;
}

export function getFlashcards(subject?: string, unit?: string, limit = 50): Flashcard[] {
  const db = getDb();
  let query = 'SELECT * FROM flashcards WHERE 1=1';
  const args: (string | number)[] = [];
  if (subject && subject !== 'All') {
    query += ' AND subject = ?';
    args.push(subject);
  }
  if (unit && unit !== 'All') {
    query += ' AND unit = ?';
    args.push(unit);
  }
  query += ' ORDER BY RANDOM() LIMIT ?';
  args.push(limit);
  return db.prepare(query).all(...args) as Flashcard[];
}

export function getStudyNotes(department?: string): StudyNote[] {
  const db = getDb();
  let query = 'SELECT * FROM study_notes';
  const args: (string | number)[] = [];
  if (department) {
    query += ' WHERE department LIKE ? OR title LIKE ?';
    args.push(`%${department}%`, `%${department}%`);
  }
  return db.prepare(query).all(...args) as StudyNote[];
}
