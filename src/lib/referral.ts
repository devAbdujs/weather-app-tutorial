/**
 * Referral Attribution & Commission Engine
 * 
 * Strict Financial Safeguards:
 * 1. 24-Hour Conversion Window: A recruited user MUST upgrade to PRO within 24 hours
 *    of account registration to qualify for commission.
 * 2. If a user remains free for > 24 hours and subscribes later, they are counted
 *    as Free / Expired with 0 ETB commission for the referrer.
 * 3. No Duplicate Counting: Recruited users are deduplicated by telegram_id.
 *    Transitioning from free to pro updates their status; it never double-counts recruitment.
 * 4. Commission Rate: Exactly 50 ETB per eligible 24h PRO conversion.
 */

export const REFERRAL_COMMISSION_ETB = 50;
export const REFERRAL_ATTRIBUTION_WINDOW_HOURS = 24;
export const REFERRAL_ATTRIBUTION_WINDOW_MS = REFERRAL_ATTRIBUTION_WINDOW_HOURS * 60 * 60 * 1000;

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
  conversionStatus: 'free' | 'pro_eligible' | 'pro_expired';
  isConvertedPro: boolean;
  paymentCreatedAt: string | null;
}

export interface ReferralAttributionSummary {
  totalRecruited: number;
  proConverted: number;
  freeCount: number;
  totalEarnedETB: number;
  conversionRate: number;
  students: EvaluatedStudentReferral[];
}

/**
 * Calculates referral recruitment, 24-hour PRO conversions, and commission earnings.
 * Ensures deduplication and enforces the strict 24-hour eligibility window.
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

  // 3. Evaluate each student against the 24-hour attribution window
  const students: EvaluatedStudentReferral[] = [];

  for (const profile of profileMap.values()) {
    const signupTime = new Date(profile.created_at).getTime();
    const isSubscribed = profile.subscription_status === 'premium';
    const paymentCreatedAt = earliestPaymentMap.get(profile.telegram_id) || null;

    let conversionStatus: 'free' | 'pro_eligible' | 'pro_expired' = 'free';
    let isConvertedPro = false;

    if (isSubscribed) {
      if (paymentCreatedAt) {
        const paymentTime = new Date(paymentCreatedAt).getTime();
        const diffMs = paymentTime - signupTime;
        // Strict 24-hour conversion rule: must upgrade within [0, 24h] of signup
        if (diffMs >= 0 && diffMs <= REFERRAL_ATTRIBUTION_WINDOW_MS) {
          conversionStatus = 'pro_eligible';
          isConvertedPro = true;
        } else {
          conversionStatus = 'pro_expired';
          isConvertedPro = false;
        }
      } else {
        // Fallback for direct manual upgrades without receipt rows
        const upgradeTime = profile.updated_at ? new Date(profile.updated_at).getTime() : signupTime;
        const diffMs = upgradeTime - signupTime;
        if (diffMs >= 0 && diffMs <= REFERRAL_ATTRIBUTION_WINDOW_MS) {
          conversionStatus = 'pro_eligible';
          isConvertedPro = true;
        } else {
          conversionStatus = 'pro_expired';
          isConvertedPro = false;
        }
      }
    }

    students.push({
      ...profile,
      id: profile.telegram_id,
      conversionStatus,
      isConvertedPro,
      paymentCreatedAt,
    });
  }

  // 4. Compute concrete counts and earnings
  const totalRecruited = students.length;
  const proConverted = students.filter(s => s.isConvertedPro).length;
  const freeCount = totalRecruited - proConverted;
  const totalEarnedETB = proConverted * REFERRAL_COMMISSION_ETB;
  const conversionRate = totalRecruited > 0 ? Math.round((proConverted / totalRecruited) * 100) : 0;

  return {
    totalRecruited,
    proConverted,
    freeCount,
    totalEarnedETB,
    conversionRate,
    students,
  };
}
