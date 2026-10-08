/** One WhatsApp tap from a customer. Charged from the vendor's prepaid click balance. */
export const WHATSAPP_CLICK_PRICE_GHS = 0.5;

export function clicksForAmount(amountGhs: number): { clicks: number; chargeGhs: number } {
  if (!Number.isFinite(amountGhs) || amountGhs <= 0) {
    return { clicks: 0, chargeGhs: 0 };
  }
  const pesewas = Math.round(amountGhs * 100);
  const clicks = Math.floor(pesewas / Math.round(WHATSAPP_CLICK_PRICE_GHS * 100));
  const chargeGhs = Math.round(clicks * WHATSAPP_CLICK_PRICE_GHS * 100) / 100;
  return { clicks, chargeGhs };
}

/** Calendar day in Ghana, so a repeat tap the same day is not charged twice. */
export function accraDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Accra',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function normalizeListingMode(value: unknown): 'shop' | 'contact' {
  return value === 'contact' ? 'contact' : 'shop';
}
