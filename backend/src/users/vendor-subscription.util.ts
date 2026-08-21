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
  // The payment-required flag only blocks uploads when something is actually owed — entry is
  // free now (amountDueForRenewal always returns 0), so it can never lock anyone out on its own,
  // including vendors approved before this flow went free.
  if (vendor.subscriptionPaymentRequired === true && amountDueForRenewal(vendor) > 0) return false;
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

/** Set at signup — selling stays locked until an admin approves KYC (no payment involved). */
export function pendingApprovalSubscriptionFields() {
  return {
    subscriptionPlan: 'lifetime' as const,
    subscriptionLabel: 'Sales access',
    subscriptionPriceText: 'Free',
    subscriptionPriceGhs: 0,
    subscriptionPaymentRequired: true,
  };
}

/** Free, permanent access granted on KYC approval — subscriptionEndsAt stays unset, which isSubscriptionActive treats as permanent. */
export function introSubscriptionFields(now = new Date()) {
  return {
    subscriptionPlan: 'lifetime' as const,
    subscriptionLabel: 'Sales access',
    subscriptionPriceText: 'Free',
    subscriptionPriceGhs: 0,
    subscriptionStartsAt: now,
    subscriptionEndsAt: null,
    subscriptionPaymentRequired: false,
  };
}

/** Legacy renewal helper — kept for the admin's manual custom-window tool. Entry is free now. */
export function amountDueForRenewal(_vendor: VendorSubscriptionFields): number {
  return 0;
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
