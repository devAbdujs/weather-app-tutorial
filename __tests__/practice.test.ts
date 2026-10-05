/**
 * @jest-environment node
 */
import { getEntranceYearCounts } from '@/app/actions/practice';

describe('getEntranceYearCounts action', () => {
  it('returns mock data in development environment for Geography', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';

    const counts = await getEntranceYearCounts({ subject: 'Geography' });
    expect(counts).toEqual([
      { year: 2016, count: 50 },
      { year: 2015, count: 50 },
    ]);

    (process.env as any).NODE_ENV = originalEnv;
  });
});
