/** Ghana phone → wa.me digits (no + prefix) */
export function normalizeWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits.length >= 10 ? digits : null;
}

export function buildWaMeLink(phoneDigits: string, prefilledText?: string): string {
  if (prefilledText?.trim()) {
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(prefilledText.trim())}`;
  }
  return `https://wa.me/${phoneDigits}`;
}

/** Short prefilled text for SMS (keeps wa.me URLs smaller) */
export function buildShortCustomerToVendorWaText(
  orderShortId: string,
  shopName: string,
  customerName?: string,
): string {
  const shop = (shopName || 'vendor').slice(0, 40);
  const who = (customerName || 'Customer').slice(0, 30);
  return `Hello ${shop}, I placed FLA order #ORD-${orderShortId}. Paystack payment confirmed. Let's coordinate delivery. - ${who}`;
}

export function buildShortVendorToCustomerWaText(
  orderShortId: string,
  shopName: string,
  customerName?: string,
): string {
  const shop = (shopName || 'FLA vendor').slice(0, 40);
  const who = (customerName || 'there').slice(0, 30);
  return `Hello ${who}, your FLA order #ORD-${orderShortId} is paid. ${shop} here — reply for delivery and sizing.`;
}

export function appendWhatsAppLinkToSms(baseMessage: string, link: string): string {
  return `${baseMessage.trim()} WhatsApp: ${link}`;
}
