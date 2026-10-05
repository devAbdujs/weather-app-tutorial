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
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('banner', { name: /install temari pwa/i })).toBeInTheDocument();
    expect(screen.getByText('Install Temari')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^install$/i })).toBeInTheDocument();
  });

  it('dismisses banner and sets 7-day cooldown in localStorage when dismissed', () => {
    render(<PWARegistry />);

    act(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = jest.fn();
      window.dispatchEvent(event);
      jest.advanceTimersByTime(5000);
    });

    const dismissBtn = screen.getByRole('button', { name: /dismiss install prompt/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByRole('banner', { name: /install temari pwa/i })).not.toBeInTheDocument();
    expect(localStorage.getItem('temari_pwa_dismissed_at')).toBeTruthy();
  });

  it('does not prompt if dismissed within 7 days', () => {
    // Set dismissal timestamp to 1 day ago
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    localStorage.setItem('temari_pwa_dismissed_at', oneDayAgo.toString());

    render(<PWARegistry />);

    act(() => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByRole('banner', { name: /install temari pwa/i })).not.toBeInTheDocument();
  });
});
