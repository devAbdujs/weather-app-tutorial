import React from 'react';
import { render, screen } from '@testing-library/react';
import { AmbassadorView } from '@/components/admin/AmbassadorView';
import type { AmbassadorDashboardData } from '@/app/actions/admin';

describe('AmbassadorView Component', () => {
  const mockData: AmbassadorDashboardData = {
    ambassador: {
      id: 'admin-amb-1',
      username: 'aau_ambassador',
      role: 'ambassador',
    },
    referralCode: 'aau_ambassador',
    referralLink: 'https://t.me/toptemari_bot?start=ref_aau_ambassador',
    totalRecruited: 3,
    proConverted: 1,
    freeCount: 2,
    totalEarnedETB: 50,
    conversionRate: 33,
    students: [
      {
        id: '101',
        telegram_id: '101',
        full_name: 'Abebe Bikila',
        username: 'abebe_b',
        target_exam: 'entrance',
        stream: 'Natural Science',
        subscription_status: 'premium',
        created_at: '2026-10-01T10:00:00Z',
        conversionStatus: 'pro_eligible',
        isConvertedPro: true,
        paymentCreatedAt: '2026-10-01T12:00:00Z',
      },
      {
        id: '102',
        telegram_id: '102',
        full_name: 'Derartu Tulu',
        username: 'derartu',
        target_exam: 'freshman',
        stream: null,
        subscription_status: 'premium',
        created_at: '2026-10-01T10:00:00Z',
        conversionStatus: 'pro_expired',
        isConvertedPro: false,
        paymentCreatedAt: '2026-10-03T10:00:00Z',
      },
      {
        id: '103',
        telegram_id: '103',
        full_name: 'Kenenisa Bekele',
        username: 'kenenisa',
        target_exam: 'exit',
        stream: 'Computer Science',
        subscription_status: 'free',
        created_at: '2026-10-02T10:00:00Z',
        conversionStatus: 'free',
        isConvertedPro: false,
        paymentCreatedAt: null,
      },
    ],
  };

  it('renders ambassador header and referral link correctly', () => {
    render(<AmbassadorView data={mockData} />);

    expect(screen.getByText('Campus Ambassador')).toBeInTheDocument();
    expect(screen.getByText('@aau_ambassador')).toBeInTheDocument();
    expect(screen.getAllByText(/ref_aau_ambassador/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Earn 50 ETB for each recruit who upgrades within 24h\./)).toBeInTheDocument();
  });

  it('renders metrics with 24h upgrade subtitles', () => {
    render(<AmbassadorView data={mockData} />);

    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1); // Total signups
    expect(screen.getByText('Unique signups')).toBeInTheDocument();

    expect(screen.getByText('1')).toBeInTheDocument(); // 24h upgrades
    expect(screen.getByText('24h upgrades')).toBeInTheDocument();

    expect(screen.getAllByText(/50/).length).toBeGreaterThanOrEqual(1); // Commission
    expect(screen.getByText('50 ETB per 24h PRO')).toBeInTheDocument();

    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByText('24h rate')).toBeInTheDocument();
  });

  it('renders distinct status badges for eligible PRO, >24h expired, and Free recruits', () => {
    render(<AmbassadorView data={mockData} />);

    // 1. Converted within 24h
    expect(screen.getByText('PRO (+50 ETB)')).toBeInTheDocument();

    // 2. Converted after 24h (expired, 0 ETB)
    expect(screen.getByText(/Free · >24h Expired/)).toBeInTheDocument();

    // 3. Regular free student
    expect(screen.getByText('Free')).toBeInTheDocument();
  });
});
