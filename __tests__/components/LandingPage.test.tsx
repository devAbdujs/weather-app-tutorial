import React from 'react';
import { render, screen } from '@testing-library/react';
import { LandingPage } from '@/components/marketing/LandingPage';

// Mock Next.js navigation and image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ priority, ...props }: any) => <img {...props} alt={props.alt || ''} />,
}));

describe('LandingPage component', () => {
  it('renders track selector on root portal', () => {
    render(<LandingPage initialPortal="root" />);
    expect(screen.getByText(/Choose Your Exam Track/i)).toBeInTheDocument();
    expect(screen.getByText(/Grade 12 Entrance \(EUEE\)/i)).toBeInTheDocument();
    expect(screen.getByText(/University Freshman/i)).toBeInTheDocument();
    expect(screen.getByText(/University Exit Exam/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Your Exam Track/i)).toBeInTheDocument();
  });

  it('renders dedicated entrance portal without track selector', () => {
    render(<LandingPage initialPortal="entrance" />);
    // The track selector must NOT be rendered on dedicated landing page
    expect(screen.queryByText(/Choose Your Exam Track/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Start Grade 12 EUEE — Free/i)).toBeInTheDocument();
  });

  it('renders dedicated freshman landing page without track selection', () => {
    render(<LandingPage initialPortal="freshman" />);
    expect(screen.queryByText(/Choose Your Exam Track/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Start Univ\. Freshman — Free/i)).toBeInTheDocument();
  });

  it('renders dedicated exit exam landing page without track selection', () => {
    render(<LandingPage initialPortal="exit" />);
    expect(screen.queryByText(/Choose Your Exam Track/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Start Exit Exam — Free/i)).toBeInTheDocument();
  });
});
