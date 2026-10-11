/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/submit/route';
import { getServerSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimiter';
import { createAdminClient } from '@/utils/supabase/admin';
import { getNextGeminiKey } from '@/lib/geminiKeyRotation';
import { generateText } from 'ai';
import { sendAdminPaymentAlert, sendAutoApprovalAdminAlert, sendStudentNotification } from '@/lib/paymentNotifier';

jest.mock('@/lib/session');
jest.mock('@/lib/rateLimiter');
jest.mock('@/utils/supabase/admin');
jest.mock('@/lib/geminiKeyRotation');
jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn()),
}));
jest.mock('ai');
jest.mock('@/lib/paymentNotifier');

describe('POST /api/payments/submit - Auto-Approval Engine', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    (getServerSession as jest.Mock).mockResolvedValue({
      telegram_id: '99887766',
      first_name: 'Abebe',
    });

    (checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true });
    (getNextGeminiKey as jest.Mock).mockReturnValue('mock-gemini-key');

    mockSupabase = {
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: { path: 'receipts/test.jpg' }, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://storage.supabase.com/receipts/test.jpg' } }),
          createSignedUrl: jest.fn().mockResolvedValue({
            data: { signedUrl: 'https://storage.supabase.com/receipts/signed-test.jpg' },
            error: null,
          }),
        }),
      },
      from: jest.fn(),
    };

    (createAdminClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('returns 401 when user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/payments/submit', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when receipt file is missing', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/payments/submit', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing receipt');
  });

  it('auto-approves payment when receipt matches CBE account and valid amount', async () => {
    // 1. Setup DB query chains
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'rec-123' }, error: null }),
      }),
    });
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'payment_receipts') {
        return {
          insert: insertMock,
          update: updateMock,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((col: string, val: string) => {
              return {
                eq: jest.fn().mockImplementation((col2: string, val2: string) => {
                  // If checking status === 'pending' or 'approved', return null
                  return {
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                  };
                }),
              };
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          update: updateMock,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { full_name: 'Abebe Bikila' }, error: null }),
            }),
          }),
        };
      }
      return { update: updateMock };
    });

    // 2. Mock Gemini response
    (generateText as jest.Mock).mockResolvedValue({
      text: JSON.stringify({
        transaction_id: 'FT241010CBE99',
        amount: '250 ETB',
        sender_name: 'Abebe Bikila',
        credited_account: '1000217910448',
        receiver_name: 'Temari Exam CBE',
        date: '2026-10-10',
        is_suspicious: false,
      }),
    });

    const file = new File(['fake-image-bytes'], 'cbe-receipt.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('receipt', file);

    const req = new NextRequest('http://localhost:3000/api/payments/submit', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isAutoApproved).toBe(true);
    expect(sendAutoApprovalAdminAlert).toHaveBeenCalled();
    expect(sendStudentNotification).toHaveBeenCalledWith('99887766', true, 'Abebe');
  });

  it('auto-approves payment when receipt matches Awash Bank account and valid amount', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'rec-awash-123' }, error: null }),
      }),
    });
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'payment_receipts') {
        return {
          insert: insertMock,
          update: updateMock,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(() => ({
              eq: jest.fn().mockImplementation(() => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          update: updateMock,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { full_name: 'Abebe Bikila' }, error: null }),
            }),
          }),
        };
      }
      return { update: updateMock };
    });

    (generateText as jest.Mock).mockResolvedValue({
      text: JSON.stringify({
        transaction_id: 'AWASH998877',
        amount: '250 ETB',
        sender_name: 'Abebe Bikila',
        credited_account: '014251052392700',
        receiver_name: 'Abdulwahid',
        is_suspicious: false,
      }),
    });

    const file = new File(['fake-image-bytes'], 'awash-receipt.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('receipt', file);

    const req = new NextRequest('http://localhost:3000/api/payments/submit', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isAutoApproved).toBe(true);
    expect(sendAutoApprovalAdminAlert).toHaveBeenCalled();
  });

  it('auto-approves payment even if receiver name has a typo as long as account number matches', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'rec-typo-123' }, error: null }),
      }),
    });
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'payment_receipts') {
        return {
          insert: insertMock,
          update: updateMock,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(() => ({
              eq: jest.fn().mockImplementation(() => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          update: updateMock,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { full_name: 'Abebe Bikila' }, error: null }),
            }),
          }),
        };
      }
      return { update: updateMock };
    });

    // Mock Gemini response with misspelled name
    (generateText as jest.Mock).mockResolvedValue({
      text: JSON.stringify({
        transaction_id: 'CBE-TYPO-99',
        amount: '250 ETB',
        sender_name: 'Abebe Bikila',
        credited_account: '1000217910448',
        receiver_name: 'Abdelwahed Misspelled Name',
        is_suspicious: false,
      }),
    });

    const file = new File(['fake-image-bytes'], 'cbe-typo.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('receipt', file);

    const req = new NextRequest('http://localhost:3000/api/payments/submit', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isAutoApproved).toBe(true);
  });

  it('rejects auto-approval when duplicate transaction ID was previously approved (replay attack protection)', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'rec-duplicate' }, error: null }),
      }),
    });
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'payment_receipts') {
        return {
          insert: insertMock,
          update: updateMock,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((col1: string, val1: string) => {
              return {
                eq: jest.fn().mockImplementation((col2: string, val2: string) => {
                  // If col2 is status and val2 is 'pending' -> no pending receipt exists
                  if (col2 === 'status' && val2 === 'pending') {
                    return { maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
                  }
                  // If col2 is status and val2 is 'approved' -> duplicate found!
                  if (col2 === 'status' && val2 === 'approved') {
                    return { maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'old-receipt-1' }, error: null }) };
                  }
                  return { maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
                }),
              };
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          update: updateMock,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { full_name: 'Abebe Bikila' }, error: null }),
            }),
          }),
        };
      }
      return { update: updateMock };
    });

    (generateText as jest.Mock).mockResolvedValue({
      text: JSON.stringify({
        transaction_id: 'FT241010CBE99',
        amount: '250 ETB',
        sender_name: 'Abebe Bikila',
        credited_account: '1000217910448',
        is_suspicious: false,
      }),
    });

    const file = new File(['fake-image-bytes'], 'replay.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('receipt', file);

    const req = new NextRequest('http://localhost:3000/api/payments/submit', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isAutoApproved).toBe(false);
    expect(sendAutoApprovalAdminAlert).not.toHaveBeenCalled();
    expect(sendAdminPaymentAlert).toHaveBeenCalled();
  });
});
