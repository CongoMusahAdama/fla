/** FLA admin / support WhatsApp (wa.me digits). Default: 025 677 4847 */
export function getFlaAdminWhatsAppPhone(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FLA_ADMIN_WHATSAPP;
  return normalizeWhatsAppPhone(fromEnv) || '233256774847';
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

export function getVendorPhoneFromOrder(order: {
  vendorId?: { phone?: string } | string;
  vendorPhone?: string;
}): string | null {
  const vendor = order.vendorId;
  if (vendor && typeof vendor === 'object' && vendor.phone) {
    return normalizeWhatsAppPhone(vendor.phone);
  }
  return normalizeWhatsAppPhone(order.vendorPhone);
}

export function canShowOrderWhatsApp(order: { isPaid?: boolean; status?: string }): boolean {
  return Boolean(order.isPaid && order.status !== 'cancelled');
}

export function buildCustomerToVendorMessage(
  order: {
    _id?: string;
    vendorName?: string;
    items?: Array<{ name?: string }>;
    shippingCity?: string;
    shippingRegion?: string;
  },
  customerName?: string,
): string {
  const orderRef = order._id?.slice(-6)?.toUpperCase() || '------';
  const shopName = order.vendorName || 'there';
  const item = order.items?.[0]?.name || 'my order';
  const delivery = [order.shippingCity, order.shippingRegion].filter(Boolean).join(', ') || 'as on FLA';

  return [
    `Hello ${shopName},`,
    '',
    `I placed order #ORD-${orderRef} on FLA Marketplace.`,
    `Item: ${item}`,
    `Delivery: ${delivery}`,
    'Payment: confirmed via Paystack on FLA.',
    '',
    'I would like to coordinate delivery and any tailoring details. Thank you!',
    '',
    `— ${customerName || 'Customer'}`,
  ].join('\n');
}

/** Vendor → customer after the vendor cancels an order. */
export function buildVendorCancelledOrderToCustomerMessage(
  order: {
    _id?: string;
    customerName?: string;
    items?: Array<{ name?: string; size?: string; quantity?: number }>;
  },
  shopName?: string,
): string {
  const orderRef = order._id?.slice(-6)?.toUpperCase() || '------';
  const customer = order.customerName || 'there';
  const item = order.items?.[0];
  const itemLine = item
    ? `${item.name}${item.size ? ` (${item.size})` : ''} ×${item.quantity ?? 1}`
    : 'your order';

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
    items?: Array<{ name?: string }>;
    status?: string;
    totalAmount?: number;
  },
  customerName?: string,
): string {
  const orderRef = order._id?.slice(-6)?.toUpperCase() || '------';
  const item = order.items?.[0]?.name || 'order';
  const vendor = order.vendorName || 'vendor';
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
    items?: Array<{ name?: string; size?: string; quantity?: number }>;
    shippingCity?: string;
    shippingRegion?: string;
    shippingAddress?: string;
  },
  shopName?: string,
): string {
  const orderRef = order._id?.slice(-6)?.toUpperCase() || '------';
  const customer = order.customerName || 'there';
  const item = order.items?.[0];
  const itemLine = item
    ? `${item.name}${item.size ? ` (${item.size})` : ''} ×${item.quantity ?? 1}`
    : 'your order';
  const delivery = [order.shippingAddress, order.shippingCity, order.shippingRegion].filter(Boolean).join(', ');

  return [
    `Hello ${customer},`,
    '',
    `This is ${shopName || 'your FLA vendor'} regarding order #ORD-${orderRef}.`,
    `Item: ${itemLine}`,
    delivery ? `Delivery: ${delivery}` : '',
    '',
    'Your payment is confirmed on FLA. Please reply here for sizing, delivery timing, or any questions.',
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
