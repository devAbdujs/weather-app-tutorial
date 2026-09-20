/**
 * ExamWorkspace component tests.
 *
 * NOTE: ExamWorkspace is a large, stateful component that talks to Supabase
 * and depends on useTelegram. We test it with the minimum viable mocks to
 * keep these tests fast and side-effect-free.
 *
 * The component's actual Supabase calls (bookmarks, stats) are fully mocked
 * so no network requests are made.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExamWorkspace } from '@/components/exam/ExamWorkspace';
import { Question } from '@/types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/hooks/useTelegram', () => ({
  useTelegram: () => ({
    isTelegram: false,
    user: { id: 123, first_name: 'Test' },
    haptic: {
      impact: jest.fn(),
      selection: jest.fn(),
      notification: jest.fn(),
    },
    setBackButton: jest.fn(),
  }),
}));

jest.mock('@/app/actions/user', () => ({
  toggleSavedMistake: jest.fn().mockResolvedValue({ success: true }),
  updateDailyStreak: jest.fn().mockResolvedValue({ success: true, streak: 1 }),
  getSavedMistakes: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({ data: [], error: null })),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: crypto.randomUUID(),
  question: 'What is 2 + 2?',
  option_a: '3',
  option_b: '4',
  option_c: '5',
  option_d: '6',
  answer: 'B',
  explanation: 'Basic arithmetic.',
  subject: 'Mathematics',
  exam_type: 'entrance',
  source: 'test',
  grade: null,
  category: null,
  year_ec: null,
  year_gc: null,
  exam_title: null,
  section: null,
  unit: null,
  number: null,
  image_url: null,
  ...overrides,
});

const TWO_QUESTIONS: Question[] = [
  makeQuestion({ id: 'q1', question: 'What is 2 + 2?', option_b: '4', answer: 'B' }),
  makeQuestion({
    id: 'q2',
    question: 'Capital of Ethiopia?',
    option_a: 'Addis Ababa',
    option_b: 'Nairobi',
    option_c: 'Cairo',
    option_d: 'Kampala',
    answer: 'A',
    subject: 'Geography',
  }),
];

const DEFAULT_PROPS = {
  questions: TWO_QUESTIONS,
  title: 'Test Session',
  examType: 'entrance' as const,
  subject: 'Mathematics',
  isSimulator: false,
  onExit: jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ExamWorkspace — rendering', () => {
  it('renders the first question on mount', async () => {
    render(<ExamWorkspace {...DEFAULT_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText(/What is 2 \+ 2\?/)).toBeInTheDocument();
    });
  });



  it('renders all four answer options for the first question', async () => {
    render(<ExamWorkspace {...DEFAULT_PROPS} />);
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });
});

describe('ExamWorkspace — practice mode (answer reveal)', () => {
  it('reveals answer explanation after selecting an option', async () => {
    render(<ExamWorkspace {...DEFAULT_PROPS} isSimulator={false} />);

    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument());
    fireEvent.click(screen.getByText('4')); // correct answer

    await waitFor(() => {
      // Explanation should appear
      expect(screen.getByText('Basic arithmetic.')).toBeInTheDocument();
    });
  });

  it('shows correct answer label when a wrong option is selected', async () => {
    render(<ExamWorkspace {...DEFAULT_PROPS} isSimulator={false} />);

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    fireEvent.click(screen.getByText('3')); // wrong answer

    await waitFor(() => {
      // Should display "Correct Answer" indicator
      expect(screen.getByText(/Correct Answer/i)).toBeInTheDocument();
    });
  });
});

describe('ExamWorkspace — navigation', () => {
  it('navigates to the second question when Next is clicked', async () => {
    render(<ExamWorkspace {...DEFAULT_PROPS} />);

    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument());
    fireEvent.click(screen.getByText('4'));

    const nextBtn = await screen.findByText(/Next/i);
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Capital of Ethiopia?')).toBeInTheDocument();
    });
  });

  it('shows Submit button on the last question', async () => {
    render(<ExamWorkspace {...DEFAULT_PROPS} />);

    // Answer Q1 and go to Q2
    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument());
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(await screen.findByText(/Next/i));

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });
});
