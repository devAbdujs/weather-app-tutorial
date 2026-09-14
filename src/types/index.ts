export type ExamType = 'entrance' | 'freshman' | 'exit' | 'grade8' | 'grade6';

export interface Question {
  id: string;
  exam_type: ExamType;
  grade: number | null;
  category: string | null;
  subject: string;
  year_ec: number | null;
  year_gc: number | null;
  exam_title: string | null;
  section: string | null;
  unit: string | null;
  number: number | null;
  question: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  answer: string | null;
  explanation: string | null;
  image_url: string | null;
  source: string;
}

export interface Flashcard {
  id: string;
  grade: number;
  subject: string;
  unit: string | null;
  front: string;
  back: string;
  source: string;
}

export interface StudyNote {
  id: string;
  exam_type: string;
  department: string | null;
  title: string;
  content?: string;
  content_url?: string;
  created_at?: string;
}

export interface UserProfile {
  telegram_id: string;          // Primary identity — Telegram numeric user ID
  full_name: string | null;
  username: string | null;      // Telegram @username (may be absent)
  avatar_url: string | null;
  daily_streak: number;
  last_activity_date: string | null;
  subscription_status: 'free' | 'premium';
  target_exam: string | null;   // e.g., 'entrance', 'freshman', 'exit'
  created_at: string;
  updated_at: string;
}

export interface SavedMistake {
  id: string;
  telegram_id: string;
  question_id: string;
  created_at: string;
}
