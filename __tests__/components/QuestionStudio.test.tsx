import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionStudio, QuestionItem } from '@/components/admin/QuestionStudio';
import * as adminActions from '@/app/actions/admin';

jest.mock('@/app/actions/admin', () => ({
  saveQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  bulkImportQuestions: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockQuestions: QuestionItem[] = [
  {
    id: 'q-1',
    exam_type: 'entrance',
    subject: 'Physics',
    year_ec: 2016,
    question: 'What is the unit of force?',
    option_a: 'Joule',
    option_b: 'Newton',
    option_c: 'Pascal',
    option_d: 'Watt',
    answer: 'B',
    explanation: 'Force is measured in Newtons.',
  },
  {
    id: 'q-2',
    exam_type: 'freshman',
    subject: 'Calculus',
    year_ec: 2015,
    question: 'Evaluate the derivative of $\\sin(x)$.',
    option_a: '$\\cos(x)$',
    option_b: '$-\\cos(x)$',
    option_c: '$\\tan(x)$',
    option_d: '$1$',
    answer: 'A',
    explanation: 'The derivative of sin(x) is cos(x).',
  },
  {
    id: 'q-3',
    exam_type: 'exit',
    subject: 'Computer Science',
    year_ec: 2014,
    question: 'What is the time complexity of binary search?',
    option_a: 'O(n)',
    option_b: 'O(log n)',
    option_c: 'O(n^2)',
    option_d: 'O(1)',
    answer: 'B',
    explanation: 'Binary search splits the search space in half.',
  },
];

describe('QuestionStudio Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('renders questions table with initial questions and answer keys', () => {
    render(<QuestionStudio initialQuestions={mockQuestions} />);

    expect(screen.getByText('What is the unit of force?')).toBeInTheDocument();
    expect(screen.getAllByText('Physics').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Calculus').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Computer Science').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('B').length).toBeGreaterThanOrEqual(2);
  });

  it('filters questions by search query', () => {
    render(<QuestionStudio initialQuestions={mockQuestions} />);

    const searchInput = screen.getByPlaceholderText('Search question, subject, ID...');
    fireEvent.change(searchInput, { target: { value: 'derivative' } });

    expect(screen.queryByText('What is the unit of force?')).not.toBeInTheDocument();
    expect(screen.getByText(/derivative of/i)).toBeInTheDocument();
  });

  it('filters questions by exam track', () => {
    render(<QuestionStudio initialQuestions={mockQuestions} />);

    const examSelect = screen.getByDisplayValue('All Exam Tracks');
    fireEvent.change(examSelect, { target: { value: 'freshman' } });

    expect(screen.queryByText('What is the unit of force?')).not.toBeInTheDocument();
    expect(screen.getByText(/derivative of/i)).toBeInTheDocument();
    expect(screen.queryByText(/time complexity/i)).not.toBeInTheDocument();
  });

  it('opens add question modal, allows KaTeX preview toggle, and calls saveQuestion', async () => {
    (adminActions.saveQuestion as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<QuestionStudio initialQuestions={mockQuestions} />);

    const addBtn = screen.getByRole('button', { name: /Add Question/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Question')).toBeInTheDocument();

    // Fill in question details
    const questionInput = screen.getByPlaceholderText('e.g. What is the value of $\\int_0^1 x^2 dx$?');
    fireEvent.change(questionInput, { target: { value: 'Solve $x + 2 = 5$' } });

    const optA = screen.getByPlaceholderText('Option A');
    const optB = screen.getByPlaceholderText('Option B');
    fireEvent.change(optA, { target: { value: '3' } });
    fireEvent.change(optB, { target: { value: '4' } });

    // Toggle KaTeX preview
    const previewBtn = screen.getByRole('button', { name: /KaTeX Live Preview/i });
    fireEvent.click(previewBtn);
    expect(screen.getByRole('button', { name: /Edit Mode/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Edit Mode/i }));

    const saveBtn = screen.getByRole('button', { name: /Save Question/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminActions.saveQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'Solve $x + 2 = 5$',
          answer: 'A',
        })
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('calls deleteQuestion when delete button is confirmed', async () => {
    (adminActions.deleteQuestion as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<QuestionStudio initialQuestions={mockQuestions} />);

    const deleteBtn = screen.getByRole('button', { name: 'Delete question q-1' });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('q-1'));
    await waitFor(() => {
      expect(adminActions.deleteQuestion).toHaveBeenCalledWith('q-1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('opens bulk import modal and imports JSON formatted questions', async () => {
    (adminActions.bulkImportQuestions as jest.Mock).mockResolvedValueOnce({ success: true, count: 2 });

    render(<QuestionStudio initialQuestions={mockQuestions} />);

    const bulkBtn = screen.getByRole('button', { name: /Bulk Import/i });
    fireEvent.click(bulkBtn);

    expect(screen.getByText('Bulk Import Questions')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/exam_type/i);
    const jsonSample = JSON.stringify([
      {
        exam_type: 'entrance',
        subject: 'Biology',
        year_ec: 2016,
        question: 'What is the powerhouse of the cell?',
        option_a: 'Nucleus',
        option_b: 'Mitochondria',
        option_c: 'Ribosome',
        option_d: 'Golgi',
        answer: 'B',
      },
    ]);
    fireEvent.change(textarea, { target: { value: jsonSample } });

    const parseBtn = screen.getByRole('button', { name: /Parse & Import/i });
    fireEvent.click(parseBtn);

    await waitFor(() => {
      expect(adminActions.bulkImportQuestions).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
