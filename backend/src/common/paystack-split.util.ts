import { FLA_CONSTANTS } from './constants';

/** Platform commission % (admin / main Paystack account). */
export function resolveCommissionRate(settingValue: unknown): number {
  if (settingValue !== null && settingValue !== undefined && settingValue !== '') {
    const n = Number(settingValue);
    if (!Number.isNaN(n) && n >= 0 && n <= 100) {
      return n;
    }
  }
  return FLA_CONSTANTS.DEFAULT_COMMISSION_RATE;
}

/**
 * Paystack subaccount `percentage_charge`: % of each payment paid to the main account.
 * Vendor receives the remainder (e.g. 6% admin → 94% vendor).
 */
export function paystackMainAccountPercentage(commissionRate?: number): number {
  return resolveCommissionRate(commissionRate);
}

/** Flat main-account fee in pesewas when initializing a split transaction. */
export function paystackTransactionChargePesewas(amountGhs: number, commissionRate?: number): number {
  const rate = paystackMainAccountPercentage(commissionRate);
  return Math.round(amountGhs * (rate / 100) * 100);
}
