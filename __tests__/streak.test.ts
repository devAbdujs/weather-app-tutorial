import { calculateNewStreak } from '@/lib/streak';

describe('calculateNewStreak', () => {
  const TODAY = '2026-09-19';
  const YESTERDAY = '2026-09-18';
  const TWO_DAYS_AGO = '2026-09-17';

  it('should start a new streak of 1 if lastActivityDate is null', () => {
    const result = calculateNewStreak(0, null, TODAY);
    expect(result).toEqual({ newStreak: 1, isUpdated: true });
  });

  it('should not update if lastActivityDate is today', () => {
    const result = calculateNewStreak(5, TODAY, TODAY);
    expect(result).toEqual({ newStreak: 5, isUpdated: false });
  });

  it('should increment streak if lastActivityDate was yesterday', () => {
    const result = calculateNewStreak(5, YESTERDAY, TODAY);
    expect(result).toEqual({ newStreak: 6, isUpdated: true });
  });

  it('should reset streak to 1 if lastActivityDate was more than 1 day ago', () => {
    const result = calculateNewStreak(5, TWO_DAYS_AGO, TODAY);
    expect(result).toEqual({ newStreak: 1, isUpdated: true });
  });

  it('should handle leap years or month boundaries correctly', () => {
    const monthEnd = '2024-02-29'; // leap year
    const nextDay = '2024-03-01';
    const result = calculateNewStreak(10, monthEnd, nextDay);
    expect(result).toEqual({ newStreak: 11, isUpdated: true });
  });
});
