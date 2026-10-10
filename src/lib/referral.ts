/**
 * Referral Attribution & Commission Engine
 * 
 * Strict Financial Safeguards:
 * 1. 24-Hour Conversion Window: A recruited user MUST upgrade to PRO within 24 hours
 *    of account registration to qualify for commission.
 * 2. If a user remains free for > 24 hours and subscribes later, they are counted
 *    as Free / Expired with 0 ETB commission for the referrer.
 * 3. 30 Free Recruits Monthly Cap: Ambassador free student recruitment is capped at
 *    30 free signups per calendar month to prevent referral farming and quota spam.
 *    Any recruit beyond 30 in that month is tagged as 'free_capped'. General student
 *    registrations on the platform are never blocked.
 * 4. No Duplicate Counting: Recruited users are deduplicated by telegram_id.
 *    Transitioning from free to pro updates their status; it never double-counts recruitment.
 * 5. Commission Rate: Exactly 50 ETB per eligible 24h PRO conversion.
 */

export const REFERRAL_COMMISSION_ETB = 50;
export const REFERRAL_ATTRIBUTION_WINDOW_HOURS = 24;
export const REFERRAL_ATTRIBUTION_WINDOW_MS = REFERRAL_ATTRIBUTION_WINDOW_HOURS * 60 * 60 * 1000;
export const MONTHLY_FREE_RECRUIT_CAP = 30; // Max free recruits attributed per calendar month per ambassador

export interface ReferredProfile {
  telegram_id: string;
  full_name?: string | null;
  username?: string | null;
  target_exam?: string | null;
  stream?: string | null;
  subscription_status?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface PaymentReceiptRecord {
  telegram_id: string;
  status: string;
  created_at: string;
}

export interface EvaluatedStudentReferral extends ReferredProfile {
  id: string;
  conversionStatus: 'free' | 'free_capped' | 'pro_eligible' | 'pro_expired';
  isConvertedPro: boolean;
  paymentCreatedAt: string | null;
  isCapped?: boolean;
}

export interface ReferralAttributionSummary {
  totalRecruited: number;
  proConverted: number;
  freeCount: number;
  freeCappedCount: number;
  currentMonthFreeCount: number;
  monthlyFreeCap: number;
  totalEarnedETB: number;
  conversionRate: number;
  students: EvaluatedStudentReferral[];
}

/**
 * Calculates referral recruitment, 24-hour PRO conversions, and commission earnings.
 * Ensures deduplication and enforces the strict 24-hour eligibility window and 30-free monthly quota.
 */
export function calculateReferralAttribution(
  profiles: ReferredProfile[],
  receipts: PaymentReceiptRecord[] = []
): ReferralAttributionSummary {
  // 1. Deduplicate student profiles by telegram_id
  const profileMap = new Map<string, ReferredProfile>();
  for (const p of profiles) {
    if (p.telegram_id && !profileMap.has(p.telegram_id)) {
      profileMap.set(p.telegram_id, p);
    }
  }

  // 2. Identify the earliest approved payment receipt for each student
  const earliestPaymentMap = new Map<string, string>();
  for (const r of receipts) {
    if (r.status === 'approved' && r.telegram_id && r.created_at) {
      const existing = earliestPaymentMap.get(r.telegram_id);
      if (!existing || new Date(r.created_at).getTime() < new Date(existing).getTime()) {
        earliestPaymentMap.set(r.telegram_id, r.created_at);
      }
    }
  }

  // 3. Sort students chronologically by signup date for deterministic monthly quota attribution
  const sortedProfiles = Array.from(profileMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Track monthly free recruits per calendar month (e.g. "2026-10")
  const monthlyFreeCountMap = new Map<string, number>();

  const students: EvaluatedStudentReferral[] = [];

  for (const profile of sortedProfiles) {
    const signupDate = new Date(profile.created_at);
    const signupTime = signupDate.getTime();
    const monthKey = !isNaN(signupTime) ? signupDate.toISOString().slice(0, 7) : 'unknown';

    const isSubscribed = profile.subscription_status === 'premium';
    const paymentCreatedAt = earliestPaymentMap.get(profile.telegram_id) || null;

    let isConvertedPro = false;
    let isEligiblePro24h = false;
    let isExpiredPro = false;

    if (isSubscribed) {
      const paymentTime = paymentCreatedAt 
        ? new Date(paymentCreatedAt).getTime() 
        : (profile.updated_at ? new Date(profile.updated_at).getTime() : signupTime);
      const diffMs = paymentTime - signupTime;
      // Strict 24-hour conversion rule: must upgrade within [0, 24h] of signup
      if (diffMs >= 0 && diffMs <= REFERRAL_ATTRIBUTION_WINDOW_MS) {
        isEligiblePro24h = true;
        isConvertedPro = true;
      } else {
        isExpiredPro = true;
      }
    }

    let conversionStatus: 'free' | 'free_capped' | 'pro_eligible' | 'pro_expired' = 'free';
    let isCapped = false;

    if (isEligiblePro24h) {
      // PRO conversions within 24h are always counted and unencumbered by the free quota
      conversionStatus = 'pro_eligible';
    } else {
      // Student is either free or expired (>24h). Apply monthly free recruitment cap
      const currentMonthCount = monthlyFreeCountMap.get(monthKey) || 0;
      if (currentMonthCount < MONTHLY_FREE_RECRUIT_CAP) {
        conversionStatus = isExpiredPro ? 'pro_expired' : 'free';
        monthlyFreeCountMap.set(monthKey, currentMonthCount + 1);
      } else {
        // Exceeds the 30 free users per calendar month quota for this ambassador
        conversionStatus = 'free_capped';
        isCapped = true;
      }
    }

    students.push({
      ...profile,
      id: profile.telegram_id,
      conversionStatus,
      isConvertedPro,
      paymentCreatedAt,
      isCapped,
    });
  }

  // 4. Compute concrete counts and earnings
  const totalRecruited = students.length;
  const proConverted = students.filter(s => s.isConvertedPro).length;
  const freeCount = students.filter(s => s.conversionStatus === 'free' || s.conversionStatus === 'pro_expired').length;
  const freeCappedCount = students.filter(s => s.conversionStatus === 'free_capped').length;
  const totalEarnedETB = proConverted * REFERRAL_COMMISSION_ETB;
  const conversionRate = totalRecruited > 0 ? Math.round((proConverted / totalRecruited) * 100) : 0;

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthFreeCount = monthlyFreeCountMap.get(currentMonthKey) || 0;

  return {
    totalRecruited,
    proConverted,
    freeCount,
    freeCappedCount,
    currentMonthFreeCount,
    monthlyFreeCap: MONTHLY_FREE_RECRUIT_CAP,
    totalEarnedETB,
    conversionRate,
    students,
  };
}
