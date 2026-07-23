import { FLA_CONSTANTS } from '../common/constants';

export type VendorSubscriptionFields = {
  subscriptionEndsAt?: Date | string | null;
  subscriptionStartsAt?: Date | string | null;
  subscriptionPlan?: string | null;
  subscriptionPriceGhs?: number | null;
  subscriptionPriceText?: string | null;
  subscriptionLabel?: string | null;
};

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function startOfDayIsoDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * True when vendor may upload new products.
 * Missing subscriptionEndsAt = legacy/grandfathered (treat as active) so existing
 * sellers are not locked out before backfill assigns a window.
 */
export function isSubscriptionActive(vendor: VendorSubscriptionFields, now = new Date()): boolean {
  if (!vendor.subscriptionEndsAt) return true;
  const ends = new Date(vendor.subscriptionEndsAt);
  if (Number.isNaN(ends.getTime())) return true;
  return ends.getTime() > now.getTime();
}

/** Whole days remaining until end (0 if ends today later, negative if expired). */
export function daysUntilSubscriptionEnd(vendor: VendorSubscriptionFields, now = new Date()): number | null {
  if (!vendor.subscriptionEndsAt) return null;
  const ends = new Date(vendor.subscriptionEndsAt);
  if (Number.isNaN(ends.getTime())) return null;
  const ms = ends.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function introSubscriptionFields(now = new Date()) {
  const startsAt = now;
  const endsAt = addDays(now, FLA_CONSTANTS.SUBSCRIPTION_PERIOD_DAYS);
  return {
    subscriptionPlan: 'intro' as const,
    subscriptionLabel: 'Intro month',
    subscriptionPriceText: `GHS ${FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS} / 30 days`,
    subscriptionPriceGhs: FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS,
    subscriptionStartsAt: startsAt,
    subscriptionEndsAt: endsAt,
  };
}

export function monthlySubscriptionFields(fromEndsOrNow: Date, now = new Date()) {
  const base = fromEndsOrNow.getTime() > now.getTime() ? fromEndsOrNow : now;
  const endsAt = addDays(base, FLA_CONSTANTS.SUBSCRIPTION_PERIOD_DAYS);
  return {
    subscriptionPlan: 'monthly' as const,
    subscriptionLabel: 'Monthly Partner Plan',
    subscriptionPriceText: `GHS ${FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS} / month`,
    subscriptionPriceGhs: FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS,
    subscriptionEndsAt: endsAt,
  };
}

export function amountDueForRenewal(vendor: VendorSubscriptionFields): number {
  if (vendor.subscriptionPlan === 'intro' || vendor.subscriptionPriceGhs === FLA_CONSTANTS.SUBSCRIPTION_INTRO_GHS) {
    // After intro period ends, renewals are monthly
    if (!isSubscriptionActive(vendor)) {
      return FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS;
    }
  }
  if (typeof vendor.subscriptionPriceGhs === 'number' && vendor.subscriptionPriceGhs > 0) {
    // Reminder while still on intro: pay intro amount if somehow renewing early; else monthly
    if (vendor.subscriptionPlan === 'intro' && isSubscriptionActive(vendor)) {
      return FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS;
    }
  }
  return FLA_CONSTANTS.SUBSCRIPTION_MONTHLY_GHS;
}
