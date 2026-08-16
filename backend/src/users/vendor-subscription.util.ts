import { FLA_CONSTANTS } from '../common/constants';

export type VendorSubscriptionFields = {
  subscriptionEndsAt?: Date | string | null;
  subscriptionStartsAt?: Date | string | null;
  subscriptionPlan?: string | null;
  subscriptionPriceGhs?: number | null;
  subscriptionPriceText?: string | null;
  subscriptionLabel?: string | null;
  subscriptionLastPaidAt?: Date | string | null;
  /** When true, KYC is approved but uploads stay locked until Paystack subscription payment. */
  subscriptionPaymentRequired?: boolean | null;
};

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function startOfDayIsoDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** True when vendor may upload new products. */
export function isSubscriptionActive(vendor: VendorSubscriptionFields, now = new Date()): boolean {
  if (vendor.subscriptionPaymentRequired === true) return false;
  if (!vendor.subscriptionEndsAt) return true; // legacy grandfather (no paywall flag)
  const ends = new Date(vendor.subscriptionEndsAt);
  if (Number.isNaN(ends.getTime())) return true;
  return ends.getTime() > now.getTime();
}

export function daysUntilSubscriptionEnd(vendor: VendorSubscriptionFields, now = new Date()): number | null {
  if (!vendor.subscriptionEndsAt) return null;
  const ends = new Date(vendor.subscriptionEndsAt);
  if (Number.isNaN(ends.getTime())) return null;
  const ms = ends.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/** Pending unlock after KYC — must pay a one-time fee via Paystack before uploads. */
export function unpaidIntroSubscriptionFields() {
  return {
    subscriptionPlan: 'lifetime' as const,
    subscriptionLabel: 'Lifetime sales access',
    subscriptionPriceText: `GHS ${FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS} one-time`,
    subscriptionPriceGhs: FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS,
    subscriptionPaymentRequired: true,
  };
}

/** One payment, no expiry — subscriptionEndsAt stays unset, which isSubscriptionActive treats as permanent. */
export function introSubscriptionFields(now = new Date()) {
  return {
    subscriptionPlan: 'lifetime' as const,
    subscriptionLabel: 'Lifetime sales access',
    subscriptionPriceText: `GHS ${FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS} one-time`,
    subscriptionPriceGhs: FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS,
    subscriptionStartsAt: now,
    subscriptionEndsAt: null,
    subscriptionPaymentRequired: false,
  };
}

/** Amount to unlock — flat one-time GHS 100, paid once ever. */
export function amountDueForRenewal(_vendor: VendorSubscriptionFields): number {
  return FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS;
}

/** Any successful payment grants permanent access — there is no recurring renewal anymore. */
export function planFieldsAfterPayment(vendor: VendorSubscriptionFields, now = new Date()) {
  const amount = amountDueForRenewal(vendor);
  return {
    ...introSubscriptionFields(now),
    subscriptionStartsAt: vendor.subscriptionStartsAt || now,
    subscriptionLastPaidAt: now,
    subscriptionLastPaidAmount: amount,
    subscriptionPaymentRequired: false,
  };
}
