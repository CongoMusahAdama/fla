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

/** Pending unlock after KYC — must pay intro (or monthly) via Paystack before uploads. */
export function unpaidIntroSubscriptionFields() {
  return {
    subscriptionPlan: 'monthly' as const,
    subscriptionLabel: 'Monthly sales plan',
    subscriptionPriceText: `GHS ${FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS} / month`,
    subscriptionPriceGhs: FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS,
    subscriptionPaymentRequired: true,
  };
}

export function introSubscriptionFields(now = new Date()) {
  const startsAt = now;
  const endsAt = addDays(now, FLA_CONSTANTS.SUBSCRIPTION_PERIOD_DAYS);
  return {
    subscriptionPlan: 'monthly' as const,
    subscriptionLabel: 'Monthly sales plan',
    subscriptionPriceText: `GHS ${FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS} / month`,
    subscriptionPriceGhs: FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS,
    subscriptionStartsAt: startsAt,
    subscriptionEndsAt: endsAt,
    subscriptionPaymentRequired: false,
  };
}

export function monthlySubscriptionFields(fromEndsOrNow: Date, now = new Date()) {
  const base = fromEndsOrNow.getTime() > now.getTime() ? fromEndsOrNow : now;
  const endsAt = addDays(base, FLA_CONSTANTS.SUBSCRIPTION_PERIOD_DAYS);
  return {
    subscriptionPlan: 'monthly' as const,
    subscriptionLabel: 'Monthly sales plan',
    subscriptionPriceText: `GHS ${FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS} / month`,
    subscriptionPriceGhs: FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS,
    subscriptionEndsAt: endsAt,
    subscriptionPaymentRequired: false,
  };
}

/** Amount to charge for unlock/renew — flat GHS 100 every month. */
export function amountDueForRenewal(_vendor: VendorSubscriptionFields): number {
  return FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS;
}

export function planFieldsAfterPayment(vendor: VendorSubscriptionFields, now = new Date()) {
  const amount = amountDueForRenewal(vendor);
  const isFirstPay = !vendor.subscriptionLastPaidAt || vendor.subscriptionPaymentRequired;

  if (isFirstPay) {
    return {
      ...introSubscriptionFields(now),
      subscriptionLastPaidAt: now,
      subscriptionLastPaidAmount: amount,
      subscriptionPaymentRequired: false,
    };
  }

  const currentEnds = vendor.subscriptionEndsAt ? new Date(vendor.subscriptionEndsAt) : now;
  const base =
    !Number.isNaN(currentEnds.getTime()) && currentEnds.getTime() > now.getTime() ? currentEnds : now;
  return {
    ...monthlySubscriptionFields(base, now),
    subscriptionStartsAt: vendor.subscriptionStartsAt || now,
    subscriptionLastPaidAt: now,
    subscriptionLastPaidAmount: amount,
    subscriptionPaymentRequired: false,
  };
}
