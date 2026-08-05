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

export type OrderWaDetails = {
  productName?: string;
  location?: string;
  price?: number | string | null;
};

/** Build product / location / price lines from a saved order. */
export function extractOrderWaDetails(order: {
  items?: Array<{ name?: string; price?: number; quantity?: number }>;
  shippingAddress?: string;
  shippingCity?: string;
  shippingRegion?: string;
  totalAmount?: number;
  totalProductAmount?: number;
}): OrderWaDetails {
  const items = order.items || [];
  const names = items.map((i) => i.name?.trim()).filter(Boolean) as string[];
  let productName = 'item';
  if (names.length === 1) productName = names[0];
  else if (names.length > 1) productName = `${names[0]} +${names.length - 1} more`;

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
    productName: productName.slice(0, 60),
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
  const who = (customerName || 'Customer').slice(0, 30);
  const product = (details?.productName || 'item').slice(0, 50);
  const location = (details?.location || 'as discussed').slice(0, 70);
  const price = formatPrice(details?.price);
  const pricePart = price ? ` Price: ${price}.` : '';
  return (
    `Hello ${shop}, I placed FLA order #ORD-${orderShortId}. ` +
    `Product: ${product}.${pricePart} ` +
    `Location: ${location}. ` +
    `Paystack payment confirmed. Let's coordinate delivery. - ${who}`
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
  const who = (customerName || 'there').slice(0, 30);
  const product = (details?.productName || 'your order').slice(0, 50);
  const location = (details?.location || 'your delivery location').slice(0, 70);
  const price = formatPrice(details?.price);
  const pricePart = price ? ` Price: ${price}.` : '';
  return (
    `Hello ${who}, your FLA order #ORD-${orderShortId} is paid. ` +
    `Product: ${product}.${pricePart} ` +
    `Location: ${location}. ` +
    `${shop} here — reply for delivery and sizing.`
  );
}

export function appendWhatsAppLinkToSms(baseMessage: string, link: string): string {
  return `${baseMessage.trim()} WhatsApp: ${link}`;
}
