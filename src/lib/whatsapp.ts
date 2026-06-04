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
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
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
