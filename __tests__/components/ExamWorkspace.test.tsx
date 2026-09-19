import { render, screen, fireEvent } from '@testing-library/react';
import { ExamWorkspace } from '@/components/exam/ExamWorkspace';
import { Question } from '@/types/database';

// Mock useTelegram
jest.mock('@/hooks/useTelegram', () => ({
  useTelegram: () => ({
    user: { id: 123 },
    haptic: {
      impact: jest.fn(),
      selection: jest.fn(),
      notification: jest.fn()
    }
  })
}));

// Mock server actions if necessary
jest.mock('@/app/actions/user', () => ({
  toggleSavedMistake: jest.fn(),
  updateDailyStreak: jest.fn(),
}));

const mockQuestions: Question[] = [
  {
    id: '1',
    question: 'What is 2 + 2?',
    option_a: '3',
    option_b: '4',
    option_c: '5',
    option_d: '6',
    answer: 'B',
    explanation: 'Basic math.',
    subject: 'Math',
    exam_type: 'freshman'
  },
  {
    id: '2',
    question: 'Capital of France?',
    option_a: 'Berlin',
    option_b: 'Madrid',
    option_c: 'Paris',
    option_d: 'Rome',
    answer: 'C',
    explanation: 'Geography.',
    subject: 'Geography',
    exam_type: 'freshman'
  }
];

describe('ExamWorkspace Component', () => {
  it('calculates the score correctly when submitted', () => {
    render(<ExamWorkspace questions={mockQuestions} initialSavedMistakes={[]} />);

    // Question 1: Select correct answer (B)
    fireEvent.click(screen.getByText('4'));
    
    // Move to next question
    fireEvent.click(screen.getByText('Next'));
    
    // Question 2: Select incorrect answer (A)
    fireEvent.click(screen.getByText('Berlin'));
    
    // Submit exam
    fireEvent.click(screen.getByText('Submit'));

    // Verify Score Result: 1 out of 2 correct = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    // The "1" is inside a span, so we check it specifically
    const correctSpan = screen.getByText('1', { selector: 'span.text-accent-emerald' });
    expect(correctSpan).toBeInTheDocument();
    
    // The total is in the parent p tag
    expect(correctSpan.parentElement).toHaveTextContent('Correct: 1 / 2');
  });
});
