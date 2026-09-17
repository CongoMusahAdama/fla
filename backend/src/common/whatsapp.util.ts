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

/** Names like "Guest (0505112925)" break SMS autolink on the closing parenthesis. */
export function sanitizePersonNameForWa(name?: string | null): string {
  if (!name?.trim()) return 'Customer';
  let n = name.trim();
  n = n.replace(/\s*\(\s*0?\d{9,12}\s*\)\s*/gi, '').trim();
  n = n.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (!n) return 'Customer';
  return n.slice(0, 30);
}

/**
 * SMS apps often stop highlighting wa.me links at ")" even inside encodeURIComponent output.
 * Strip parentheses from the prefilled message so the whole URL stays one tappable link.
 */
export function sanitizeWaPrefillForSms(text: string): string {
  return text
    .replace(/\(([^)]*)\)/g, ' $1 ')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** wa.me link safe for SMS autolink (full blue underline on iOS/Android). */
export function buildWaMeLinkForSms(phoneDigits: string, prefilledText?: string): string {
  if (!prefilledText?.trim()) {
    return `https://wa.me/${phoneDigits}`;
  }
  const safe = sanitizeWaPrefillForSms(prefilledText.trim());
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(safe)}`;
}

export type OrderWaDetails = {
  productName?: string;
  location?: string;
  price?: number | string | null;
};

function isMeaningfulOption(value?: string | null): boolean {
  if (!value?.trim()) return false;
  const v = value.trim().toLowerCase();
  return !['n/a', 'na', 'none', '-', 'universal', 'standard'].includes(v);
}

/** e.g. "Gold Attar (M / Amber) ×2" */
function formatOrderItemLine(item?: {
  name?: string;
  size?: string;
  color?: string;
  quantity?: number;
}): string {
  const name = item?.name?.trim() || 'item';
  const size = isMeaningfulOption(item?.size) ? String(item!.size).trim() : '';
  const color = isMeaningfulOption(item?.color) ? String(item!.color).trim() : '';
  const opts = [size, color].filter(Boolean).join(' / ');
  const base = opts ? `${name} (${opts})` : name;
  const qty = item?.quantity != null && Number(item.quantity) > 1 ? ` ×${item.quantity}` : '';
  return `${base}${qty}`;
}

/** Build product / location / price lines from a saved order. */
export function extractOrderWaDetails(order: {
  items?: Array<{ name?: string; price?: number; quantity?: number; size?: string; color?: string }>;
  shippingAddress?: string;
  shippingCity?: string;
  shippingRegion?: string;
  totalAmount?: number;
  totalProductAmount?: number;
}): OrderWaDetails {
  const items = order.items || [];
  let productName = 'item';
  if (items.length === 1) {
    productName = formatOrderItemLine(items[0]);
  } else if (items.length > 1) {
    productName = `${formatOrderItemLine(items[0])} +${items.length - 1} more`;
  }

  const location =
    [order.shippingAddress, order.shippingCity, order.shippingRegion]
      .map((p) => (p || '').trim())
      .filter(Boolean)
      .join(', ') || undefined;

  const price =
    order.totalAmount ??
    order.totalProductAmount ??
    items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);

  return {
    productName: productName.slice(0, 90),
    location: location?.slice(0, 80),
    price: Number.isFinite(Number(price)) ? Number(price) : undefined,
  };
}

function formatPrice(price?: number | string | null): string {
  if (price == null || price === '') return '';
  const n = Number(price);
  if (!Number.isFinite(n)) return '';
  return `GHS ${n.toLocaleString()}`;
}

/**
 * Customer → vendor (prefilled in SMS wa.me link).
 * Includes product name, customer location, and price.
 */
export function buildShortCustomerToVendorWaText(
  orderShortId: string,
  shopName: string,
  customerName?: string,
  details?: OrderWaDetails,
): string {
  const shop = (shopName || 'vendor').slice(0, 40);
  const who = sanitizePersonNameForWa(customerName);
  const product = sanitizeWaPrefillForSms((details?.productName || 'item').slice(0, 80));
  const location = (details?.location || 'as discussed').slice(0, 70);
  const price = formatPrice(details?.price);
  const pricePart = price ? ` Price: ${price}.` : '';
  // Location leads, right after the order number — some WhatsApp clients have been seen
  // to cut a long pre-filled message short, so whatever survives should include the one
  // detail that's actually needed to act on the order.
  return (
    `Hello ${shop}, I placed FLA order #ORD-${orderShortId}. ` +
    `Location: ${location}. ` +
    `Product: ${product}.${pricePart} ` +
    `Paystack payment confirmed. - ${who}`
  );
}

/**
 * Vendor → customer (prefilled in SMS wa.me link).
 * Includes product name, customer location, and price.
 */
export function buildShortVendorToCustomerWaText(
  orderShortId: string,
  shopName: string,
  customerName?: string,
  details?: OrderWaDetails,
): string {
  const shop = (shopName || 'FLA vendor').slice(0, 40);
  const who = sanitizePersonNameForWa(customerName || 'there');
  const product = sanitizeWaPrefillForSms((details?.productName || 'your order').slice(0, 80));
  const location = (details?.location || 'your delivery location').slice(0, 70);
  const price = formatPrice(details?.price);
  const pricePart = price ? ` Price: ${price}.` : '';
  // Location leads, right after the order number — some WhatsApp clients have been seen
  // to cut a long pre-filled message short, so whatever survives should include the one
  // detail that's actually needed to act on the order.
  return (
    `Hello ${who}, your FLA order #ORD-${orderShortId} is paid. ` +
    `Location: ${location}. ` +
    `Product: ${product}.${pricePart} ` +
    `${shop} here.`
  );
}

export function appendWhatsAppLinkToSms(baseMessage: string, link: string): string {
  return `${baseMessage.trim()} WhatsApp: ${link}`;
}
