export function calculateNewStreak(
  currentStreak: number,
  lastActivityDate: string | null | undefined,
  today: string
): { newStreak: number; isUpdated: boolean } {
  if (!lastActivityDate) {
    return { newStreak: 1, isUpdated: true };
  }

  if (lastActivityDate === today) {
    return { newStreak: Math.max(1, currentStreak || 1), isUpdated: false };
  }

  const todayDate = new Date(today);
  const lastDate = new Date(lastActivityDate);
  const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return { newStreak: (currentStreak || 0) + 1, isUpdated: true };
  }

  return { newStreak: 1, isUpdated: true };
}

/**
 * Formats a Date as YYYY-MM-DD in the Africa/Addis_Ababa timezone (UTC+3).
 * Ensures daily streaks reset and increment correctly at Ethiopian local midnight,
 * preventing off-by-one errors from UTC server time.
 */
export function getAddisAbabaDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
