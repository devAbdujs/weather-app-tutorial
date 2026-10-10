import {
  calculateReferralAttribution,
  REFERRAL_COMMISSION_ETB,
  REFERRAL_ATTRIBUTION_WINDOW_MS,
  ReferredProfile,
  PaymentReceiptRecord,
} from '@/lib/referral';

describe('Referral Attribution Engine', () => {
  const baseTime = new Date('2026-10-01T10:00:00Z').getTime();

  it('correctly attributes free students with 0 ETB commission', () => {
    const profiles: ReferredProfile[] = [
      {
        telegram_id: '1001',
        full_name: 'Abebe Kebede',
        username: 'abebe',
        subscription_status: 'free',
        created_at: new Date(baseTime).toISOString(),
      },
    ];

    const result = calculateReferralAttribution(profiles, []);

    expect(result.totalRecruited).toBe(1);
    expect(result.proConverted).toBe(0);
    expect(result.freeCount).toBe(1);
    expect(result.totalEarnedETB).toBe(0);
    expect(result.conversionRate).toBe(0);
    expect(result.students[0].conversionStatus).toBe('free');
    expect(result.students[0].isConvertedPro).toBe(false);
  });

  it('awards 50 ETB commission when student upgrades within the 24-hour window', () => {
    const signupDate = new Date(baseTime).toISOString();
    // Payment submitted 4 hours after signup
    const paymentDate = new Date(baseTime + 4 * 60 * 60 * 1000).toISOString();

    const profiles: ReferredProfile[] = [
      {
        telegram_id: '1002',
        full_name: 'Almaz Ayana',
        username: 'almaz',
        subscription_status: 'premium',
        created_at: signupDate,
      },
    ];

    const receipts: PaymentReceiptRecord[] = [
      {
        telegram_id: '1002',
        status: 'approved',
        created_at: paymentDate,
      },
    ];

    const result = calculateReferralAttribution(profiles, receipts);

    expect(result.totalRecruited).toBe(1);
    expect(result.proConverted).toBe(1);
    expect(result.freeCount).toBe(0);
    expect(result.totalEarnedETB).toBe(REFERRAL_COMMISSION_ETB); // 50 ETB
    expect(result.conversionRate).toBe(100);
    expect(result.students[0].conversionStatus).toBe('pro_eligible');
    expect(result.students[0].isConvertedPro).toBe(true);
  });

  it('strictly expires referral when student stays free >24 hours and upgrades later (0 ETB commission)', () => {
    const signupDate = new Date(baseTime).toISOString();
    // Payment submitted 26 hours after signup (window expired)
    const paymentDate = new Date(baseTime + 26 * 60 * 60 * 1000).toISOString();

    const profiles: ReferredProfile[] = [
      {
        telegram_id: '1003',
        full_name: 'Dawit Tsige',
        username: 'dawit',
        subscription_status: 'premium',
        created_at: signupDate,
      },
    ];

    const receipts: PaymentReceiptRecord[] = [
      {
        telegram_id: '1003',
        status: 'approved',
        created_at: paymentDate,
      },
    ];

    const result = calculateReferralAttribution(profiles, receipts);

    expect(result.totalRecruited).toBe(1);
    // User is NOT counted as PRO conversion for commission
    expect(result.proConverted).toBe(0);
    expect(result.freeCount).toBe(1);
    expect(result.totalEarnedETB).toBe(0);
    expect(result.conversionRate).toBe(0);
    expect(result.students[0].conversionStatus).toBe('pro_expired');
    expect(result.students[0].isConvertedPro).toBe(false);
  });

  it('never double-counts recruits across state changes or duplicate entries', () => {
    const signupDate = new Date(baseTime).toISOString();
    const paymentDate = new Date(baseTime + 2 * 60 * 60 * 1000).toISOString();

    // Raw array with duplicate entries for the same telegram_id
    const profiles: ReferredProfile[] = [
      {
        telegram_id: '1004',
        full_name: 'Sara Mengistu',
        subscription_status: 'premium',
        created_at: signupDate,
      },
      {
        telegram_id: '1004',
        full_name: 'Sara Mengistu',
        subscription_status: 'premium',
        created_at: signupDate,
      },
    ];

    // Multiple approved payments (e.g. renewal 1 month later)
    const receipts: PaymentReceiptRecord[] = [
      {
        telegram_id: '1004',
        status: 'approved',
        created_at: paymentDate,
      },
      {
        telegram_id: '1004',
        status: 'approved',
        created_at: new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const result = calculateReferralAttribution(profiles, receipts);

    // Must be exactly 1 recruit and 1 pro conversion
    expect(result.totalRecruited).toBe(1);
    expect(result.proConverted).toBe(1);
    expect(result.freeCount).toBe(0);
    expect(result.totalEarnedETB).toBe(50); // Exactly 50 ETB, not 100 ETB
    expect(result.students).toHaveLength(1);
  });

  it('correctly partitions a cohort of mixed free, 24h eligible, and >24h expired recruits', () => {
    const profiles: ReferredProfile[] = [
      // 1. Upgraded in 2 hours -> eligible PRO
      {
        telegram_id: 'user-1',
        full_name: 'Student 1',
        subscription_status: 'premium',
        created_at: new Date(baseTime).toISOString(),
      },
      // 2. Stays free -> Free
      {
        telegram_id: 'user-2',
        full_name: 'Student 2',
        subscription_status: 'free',
        created_at: new Date(baseTime).toISOString(),
      },
      // 3. Upgraded after 48 hours -> Expired (>24h)
      {
        telegram_id: 'user-3',
        full_name: 'Student 3',
        subscription_status: 'premium',
        created_at: new Date(baseTime).toISOString(),
      },
      // 4. Upgraded in 23 hours -> eligible PRO
      {
        telegram_id: 'user-4',
        full_name: 'Student 4',
        subscription_status: 'premium',
        created_at: new Date(baseTime).toISOString(),
      },
    ];

    const receipts: PaymentReceiptRecord[] = [
      {
        telegram_id: 'user-1',
        status: 'approved',
        created_at: new Date(baseTime + 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        telegram_id: 'user-3',
        status: 'approved',
        created_at: new Date(baseTime + 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        telegram_id: 'user-4',
        status: 'approved',
        created_at: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const result = calculateReferralAttribution(profiles, receipts);

    expect(result.totalRecruited).toBe(4);
    expect(result.proConverted).toBe(2); // user-1 and user-4
    expect(result.freeCount).toBe(2); // user-2 (free) and user-3 (expired)
    expect(result.totalEarnedETB).toBe(100); // 2 * 50
    expect(result.conversionRate).toBe(50); // 2 / 4 = 50%
  });

  it('caps free recruits to 30 per calendar month per ambassador and marks surplus as free_capped', () => {
    // Generate 45 free recruits in October 2026
    const profiles: ReferredProfile[] = Array.from({ length: 45 }, (_, i) => ({
      telegram_id: `oct-free-${i + 1}`,
      full_name: `Student ${i + 1}`,
      subscription_status: 'free',
      created_at: new Date('2026-10-05T08:00:00Z').toISOString(),
    }));

    const result = calculateReferralAttribution(profiles, []);

    // Total recruits is 45 (students register freely without barrier)
    expect(result.totalRecruited).toBe(45);
    // Attributed free recruits capped at 30
    expect(result.freeCount).toBe(30);
    // 15 surplus recruits tagged as free_capped
    expect(result.freeCappedCount).toBe(15);
    expect(result.proConverted).toBe(0);
    expect(result.totalEarnedETB).toBe(0);

    const cappedStudents = result.students.filter(s => s.conversionStatus === 'free_capped');
    expect(cappedStudents).toHaveLength(15);
    expect(cappedStudents[0].isCapped).toBe(true);
  });

  it('resets the 30-free quota across different calendar months', () => {
    // 30 recruits in October 2026
    const octProfiles: ReferredProfile[] = Array.from({ length: 30 }, (_, i) => ({
      telegram_id: `oct-${i + 1}`,
      subscription_status: 'free',
      created_at: new Date('2026-10-10T08:00:00Z').toISOString(),
    }));

    // 15 recruits in November 2026
    const novProfiles: ReferredProfile[] = Array.from({ length: 15 }, (_, i) => ({
      telegram_id: `nov-${i + 1}`,
      subscription_status: 'free',
      created_at: new Date('2026-11-05T08:00:00Z').toISOString(),
    }));

    const result = calculateReferralAttribution([...octProfiles, ...novProfiles], []);

    expect(result.totalRecruited).toBe(45);
    // Both months are within their respective 30 caps (30 + 15 = 45)
    expect(result.freeCount).toBe(45);
    expect(result.freeCappedCount).toBe(0);
  });

  it('never restricts or caps legitimate 24h PRO conversions', () => {
    // 35 recruits in October: 30 stay free, 5 convert to PRO within 24h
    const freeProfiles: ReferredProfile[] = Array.from({ length: 30 }, (_, i) => ({
      telegram_id: `free-${i + 1}`,
      subscription_status: 'free',
      created_at: new Date('2026-10-01T08:00:00Z').toISOString(),
    }));

    const proProfiles: ReferredProfile[] = Array.from({ length: 5 }, (_, i) => ({
      telegram_id: `pro-${i + 1}`,
      subscription_status: 'premium',
      created_at: new Date('2026-10-01T08:00:00Z').toISOString(),
    }));

    const receipts: PaymentReceiptRecord[] = Array.from({ length: 5 }, (_, i) => ({
      telegram_id: `pro-${i + 1}`,
      status: 'approved',
      created_at: new Date('2026-10-01T12:00:00Z').toISOString(),
    }));

    const result = calculateReferralAttribution([...freeProfiles, ...proProfiles], receipts);

    expect(result.totalRecruited).toBe(35);
    expect(result.freeCount).toBe(30);
    expect(result.proConverted).toBe(5);
    expect(result.freeCappedCount).toBe(0);
    expect(result.totalEarnedETB).toBe(250); // 5 * 50
  });
});
