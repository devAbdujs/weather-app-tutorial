import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileDeviceMockup } from '@/components/marketing/MobileDeviceMockup';
import { ExamStoryboard } from '@/components/marketing/ExamStoryboard';

describe('Marketing Storyboards and Mobile Mockup', () => {
  it('renders EUEE 3-year pass rate reality check for entrance portal', () => {
    render(<ExamStoryboard portal="entrance" />);
    expect(screen.getByText(/Why 95% of Grade 12 Students Miss University Admission/i)).toBeInTheDocument();
    expect(screen.getByText(/2016 E\.C\./i)).toBeInTheDocument();
    expect(screen.getByText(/5\.4% Passed/i)).toBeInTheDocument();
  });

  it('renders Freshman survival storyboard for freshman portal', () => {
    render(<ExamStoryboard portal="freshman" />);
    expect(screen.getByText(/Freshman Academic Survival Storyboard/i)).toBeInTheDocument();
    expect(screen.getByText(/The Calculus Shock/i)).toBeInTheDocument();
  });

  it('renders Exit Exam benchmark storyboard for exit portal', () => {
    render(<ExamStoryboard portal="exit" />);
    expect(screen.getByText(/National Exit Exam Benchmark/i)).toBeInTheDocument();
    expect(screen.getByText(/Mandatory 50% Benchmark/i)).toBeInTheDocument();
  });

  it('interactively reveals correct answer and AI explanation in MobileDeviceMockup', () => {
    render(<MobileDeviceMockup portal="entrance" />);
    expect(screen.getByText(/A car accelerates uniformly from rest/i)).toBeInTheDocument();

    const correctOptionBtn = screen.getByText('50 m');
    fireEvent.click(correctOptionBtn);

    expect(screen.getByText(/AI Tutor Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Option B is correct!/i)).toBeInTheDocument();
  });
});
