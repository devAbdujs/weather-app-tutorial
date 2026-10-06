import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PWARegistry } from '@/components/layout/PWARegistry';

jest.mock('@/utils/offlineSync', () => ({
  syncOfflineSubmissions: jest.fn(),
}));

describe('PWARegistry', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders bottom banner when beforeinstallprompt fires and shows install button', () => {
    render(<PWARegistry />);

    act(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = jest.fn();
      (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('banner', { name: /install temari pwa/i })).toBeInTheDocument();
    expect(screen.getByText('Install Temari')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^install$/i })).toBeInTheDocument();
  });

  it('renders banner automatically on visit even without beforeinstallprompt event', () => {
    render(<PWARegistry />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('banner', { name: /install temari pwa/i })).toBeInTheDocument();
  });

  it('dismisses banner on click without setting a 7-day cooldown', () => {
    render(<PWARegistry />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const dismissBtn = screen.getByRole('button', { name: /dismiss install prompt/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByRole('banner', { name: /install temari pwa/i })).not.toBeInTheDocument();
    expect(localStorage.getItem('temari_pwa_dismissed_at')).toBeNull();
  });
});
