/** FLA admin / support WhatsApp (wa.me digits). Default: 050 511 2925 */
export function getFlaAdminWhatsAppPhone(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FLA_ADMIN_WHATSAPP;
  return normalizeWhatsAppPhone(fromEnv) || '233505112925';
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizeWhatsAppPhone(phone) || phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Open FLA admin WhatsApp with a prefilled order report (customer Report button). */
export function openAdminWhatsAppReport(
  order: Parameters<typeof buildCustomerReportToAdminMessage>[0],
  customerName?: string,
): void {
  openWhatsAppChat(
    getFlaAdminWhatsAppPhone(),
    buildCustomerReportToAdminMessage(order, customerName),
  );
}

export const openFlaAdminWhatsAppReport = openAdminWhatsAppReport;

/** Direct wa.me link for Report buttons (works best as <a href> on mobile). */
export function getAdminReportWhatsAppUrl(
  order: Parameters<typeof buildCustomerReportToAdminMessage>[0],
  customerName?: string,
): string {
  return buildWhatsAppUrl(
    getFlaAdminWhatsAppPhone(),
    buildCustomerReportToAdminMessage(order, customerName),
  );
}

/** Ghana / international phone → wa.me digits (no +) */
export function normalizeWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits.length >= 10 ? digits : null;
}

export function getVendorRawPhoneFromOrder(order: {
  vendorId?: { phone?: string; momoNumber?: string } | string;
  vendorPhone?: string;
}): string | null {
  const vendor = order.vendorId;
  if (vendor && typeof vendor === 'object') {
    return vendor.phone || vendor.momoNumber || null;
  }
  return order.vendorPhone || null;
}

export function formatPhoneForDisplay(phone?: string | null): string {
  if (!phone?.trim()) return 'Not on file';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233') && digits.length >= 12) {
    return `0${digits.slice(3)}`;
  }
  return phone.trim();
}

export function getVendorPhoneFromOrder(order: {
  vendorId?: { phone?: string; momoNumber?: string } | string;
  vendorPhone?: string;
}): string | null {
  return normalizeWhatsAppPhone(getVendorRawPhoneFromOrder(order));
}

export function canShowOrderWhatsApp(order: { isPaid?: boolean; status?: string }): boolean {
  return Boolean(order.isPaid && order.status !== 'cancelled');
}

function formatItemWithOptions(item?: {
  name?: string;
  size?: string;
  color?: string;
  quantity?: number;
}): string {
  if (!item) return 'item';
  const name = item.name?.trim() || 'item';
  const size = item.size?.trim();
  const color = item.color?.trim();
  const meaningful = (v?: string) =>
    Boolean(v) && !['n/a', 'na', 'none', '-', 'universal', 'standard'].includes(v!.toLowerCase());
  const opts = [meaningful(size) ? size : null, meaningful(color) ? color : null]
    .filter(Boolean)
    .join(' / ');
  const base = opts ? `${name} (${opts})` : name;
  const qty = item.quantity != null && item.quantity > 1 ? ` ×${item.quantity}` : '';
  return `${base}${qty}`;
}

export function buildCustomerToVendorMessage(
  order: {
    _id?: string;
    vendorName?: string;
    items?: Array<{ name?: string; price?: number; quantity?: number; size?: string; color?: string }>;
    shippingCity?: string;
    shippingRegion?: string;
    shippingAddress?: string;
    totalAmount?: number;
    totalProductAmount?: number;
  },
  customerName?: string,
): string {
  const orderRef = order._id?.slice(-6)?.toUpperCase() || '------';
  const shopName = order.vendorName || 'there';
  const items = order.items || [];
  const item =
    items.length === 0
      ? 'my order'
      : items.length === 1
        ? formatItemWithOptions(items[0])
        : `${formatItemWithOptions(items[0])} +${items.length - 1} more`;
  const location =
    [order.shippingAddress, order.shippingCity, order.shippingRegion]
      .filter(Boolean)
      .join(', ') || 'as on FLA';
  const amountSource =
    order.totalAmount ??
    order.totalProductAmount ??
    (order.items || []).reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
      0,
    );
  const price =
    amountSource != null && Number.isFinite(Number(amountSource))
      ? `GH₵ ${Number(amountSource).toLocaleString()}`
      : null;

  return [
    `Hello ${shopName},`,
    '',
    `I placed order #ORD-${orderRef} on FLA Marketplace.`,
    `Product: ${item}`,
    price ? `Price: ${price}` : null,
    `Location: ${location}`,
    'Payment: confirmed via Paystack on FLA.',
    '',
    'I would like to coordinate delivery. Thank you!',
    '',
    `— ${customerName || 'Customer'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Vendor → customer after the vendor cancels an order. */
export function buildVendorCancelledOrderToCustomerMessage(
  order: {
    _id?: string;
    customerName?: string;
    items?: Array<{ name?: string; size?: string; color?: string; quantity?: number }>;
  },
  shopName?: string,
): string {
  const orderRef = order._id?.slice(-6)?.toUpperCase() || '------';
  const customer = order.customerName || 'there';
  const item = order.items?.[0];
  const itemLine = item ? formatItemWithOptions(item) : 'your order';

  return [
    `Hello ${customer},`,
    '',
    `This is ${shopName || 'your FLA vendor'} regarding order #ORD-${orderRef}.`,
    `Your order has been cancelled on FLA Marketplace.`,
    `Item: ${itemLine}`,
    '',
    'Please reply here if you have any questions or would like to discuss next steps.',
    '',
    `— ${shopName || 'FLA Vendor'}`,
  ].join('\n');
}

/** Customer → FLA admin when tapping Report on an order. */
export function buildCustomerReportToAdminMessage(
  order: {
    _id?: string;
    vendorName?: string;
    vendorId?: { phone?: string; momoNumber?: string } | string;
    vendorPhone?: string;
    items?: Array<{ name?: string; size?: string; color?: string; quantity?: number }>;
    status?: string;
    totalAmount?: number;
  },
  customerName?: string,
): string {
  const orderRef = order._id?.slice(-6)?.toUpperCase() || '------';
  const item = order.items?.[0] ? formatItemWithOptions(order.items[0]) : 'order';
  const vendor = order.vendorName || 'vendor';
  const vendorNumber = formatPhoneForDisplay(getVendorRawPhoneFromOrder(order));
  const status = order.status || 'unknown';
  const amount =
    order.totalAmount != null ? `GH₵ ${Number(order.totalAmount).toLocaleString()}` : '—';

  return [
    'Hello FLA Support,',
    '',
    `I need to report an issue with my order on FLA Marketplace.`,
    `Order: #ORD-${orderRef}`,
    `Item: ${item}`,
    `Vendor: ${vendor}`,
    `Vendor number: ${vendorNumber}`,
    `Status: ${status}`,
    `Amount: ${amount}`,
    '',
    'Please describe your issue below:',
    '',
    `[Your message here]`,
    '',
    `— ${customerName || 'Customer'}`,
  ].join('\n');
}

export function buildVendorToCustomerMessage(
  order: {
    _id?: string;
    customerName?: string;
    items?: Array<{ name?: string; size?: string; color?: string; quantity?: number; price?: number }>;
    shippingCity?: string;
    shippingRegion?: string;
    shippingAddress?: string;
    totalAmount?: number;
    totalProductAmount?: number;
  },
  shopName?: string,
): string {
  const orderRef = order._id?.slice(-6)?.toUpperCase() || '------';
  const customer = order.customerName || 'there';
  const item = order.items?.[0];
  const itemLine = item ? formatItemWithOptions(item) : 'your order';
  const location = [order.shippingAddress, order.shippingCity, order.shippingRegion]
    .filter(Boolean)
    .join(', ');
  const amountSource =
    order.totalAmount ??
    order.totalProductAmount ??
    (order.items || []).reduce(
      (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
      0,
    );
  const price =
    amountSource != null && Number.isFinite(Number(amountSource))
      ? `GH₵ ${Number(amountSource).toLocaleString()}`
      : null;

  return [
    `Hello ${customer},`,
    '',
    `This is ${shopName || 'your FLA vendor'} regarding order #ORD-${orderRef}.`,
    `Product: ${itemLine}`,
    price ? `Price: ${price}` : null,
    location ? `Location: ${location}` : null,
    '',
    'Your payment is confirmed on FLA. Please reply here for delivery timing or any questions.',
    '',
    'Thank you for shopping with us!',
  ]
    .filter(Boolean)
    .join('\n');
}

export function openWhatsAppChat(phone: string, message: string): void {
  if (typeof window === 'undefined') return;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function buildDisputeWhatsAppMessage(options: {
    orderRef: string;
    category?: string;
    senderName?: string;
    talkingTo: 'vendor' | 'customer';
}): string {
    const ref = options.orderRef;
    const issue = options.category || 'an order issue';
    const who = options.senderName || 'FLA user';

    if (options.talkingTo === 'vendor') {
        return [
            `Hello,`,
            ``,
            `I opened a dispute on FLA for order #ORD-${ref} (${issue}).`,
            `I'd like to resolve this together. Please check the FLA Dispute Center or reply here.`,
            ``,
            `— ${who}`,
        ].join('\n');
    }

    return [
        `Hello,`,
        ``,
        `There is an open dispute on FLA for order #ORD-${ref} (${issue}).`,
        `Please review the case in FLA or reply here so we can resolve it.`,
        ``,
        `— ${who}`,
    ].join('\n');
}

export function promptMissingWhatsAppContact(role: 'vendor' | 'customer'): void {
  const label = role === 'vendor' ? 'vendor' : 'customer';
  if (typeof window !== 'undefined') {
    import('sweetalert2').then(({ default: Swal }) => {
      Swal.fire({
        icon: 'info',
        title: 'WhatsApp unavailable',
        text: `We could not find a WhatsApp number for this ${label}. Please use FLA support if you need help.`,
        confirmButtonColor: '#0F172A',
        customClass: { popup: 'rounded-[32px]' },
      });
    });
  }
}
