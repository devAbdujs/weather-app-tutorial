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
  number: number | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: 'A' | 'B' | 'C' | 'D' | '';
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
  department: string;
  title: string;
  content: string;
  source?: string;
}

export interface TrackSummary {
  exam_type: ExamType;
  title: string;
  subtitle: string;
  questionCount: number;
  badge: string;
  icon: string;
  color: string;
}

export interface SubjectSummary {
  subject: string;
  category: string | null;
  questionCount: number;
  years: number[];
}

export interface UserExamAttempt {
  examId: string;
  subject: string;
  year: number | null;
  totalQuestions: number;
  score: number;
  answers: Record<string, string>; // questionId -> chosenOption
  timeSpentSeconds: number;
  completedAt: string;
}
