export const FLA_CONSTANTS = {
  DEFAULT_COMMISSION_RATE: 3,
  AUTO_RELEASE_DAYS: 7,
  DELIVERY_AUTO_RELEASE_DAYS: 2,
  /** Unpaid Paystack checkouts older than this are deleted (no stock was taken) */
  ABANDONED_CHECKOUT_HOURS: 2,
  /** Vendor subscription: GHS 100 / month (sales access — same for every month) */
  SUBSCRIPTION_INTRO_GHS: 100,
  SUBSCRIPTION_MONTHLY_GHS: 100,
  SUBSCRIPTION_PERIOD_DAYS: 30,
  SUBSCRIPTION_REMINDER_DAYS: 5,
  /** Referee affiliate commission taken from vendor's payout (%) */
  REFEREE_COMMISSION_RATE: 2,
  /** Paystack transaction fee, borne by the vendor and deducted from their payout (%) */
  PAYSTACK_FEE_RATE: 1.95,
};

/** Must match src/lib/fla-terms.ts FLA_TERMS_VERSION */
export const FLA_TERMS_VERSION = '2026-06-01';
