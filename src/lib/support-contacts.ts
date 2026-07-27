import {
  buildCustomerReportToAdminMessage,
  formatPhoneForDisplay,
  getFlaAdminWhatsAppPhone,
  normalizeWhatsAppPhone,
} from './whatsapp';

/**
 * FLA email contacts. Reports and general support go to different inboxes.
 * Override via env in production so the addresses can change without a redeploy.
 */
/** Primary FLA inbox until custom domain mail is wired up. */
const FLA_DEFAULT_INBOX = 'fadilansalifu58@gmail.com';

export function getFlaReportEmail(): string {
  return process.env.NEXT_PUBLIC_FLA_REPORT_EMAIL?.trim() || FLA_DEFAULT_INBOX;
}

export function getFlaSupportEmail(): string {
  return process.env.NEXT_PUBLIC_FLA_SUPPORT_EMAIL?.trim() || FLA_DEFAULT_INBOX;
}

/** mailto: for the support inbox (navbar, help widgets). */
export function getFlaSupportMailtoHref(subject?: string): string {
  const email = getFlaSupportEmail();
  if (!subject?.trim()) return `mailto:${email}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

function formatSupportPhonePretty(digitsOrRaw: string): string {
  const digits = normalizeWhatsAppPhone(digitsOrRaw) || digitsOrRaw.replace(/\D/g, '');
  // 233505112925 → 050 511 2925
  if (digits.startsWith('233') && digits.length >= 12) {
    const local = `0${digits.slice(3)}`;
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  const display = formatPhoneForDisplay(digitsOrRaw);
  if (display.length === 10 && display.startsWith('0')) {
    return `${display.slice(0, 3)} ${display.slice(3, 6)} ${display.slice(6)}`;
  }
  return display;
}

/** Admin support line shown in the navbar (same number as admin WhatsApp / ADMIN_PHONE). */
export function getFlaSupportPhoneDisplay(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FLA_SUPPORT_PHONE?.trim();
  if (fromEnv) return formatSupportPhonePretty(fromEnv);
  return formatSupportPhonePretty(getFlaAdminWhatsAppPhone());
}

/** tel: link for the admin support number. */
export function getFlaSupportTelHref(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FLA_SUPPORT_PHONE?.trim();
  const digits =
    normalizeWhatsAppPhone(fromEnv) ||
    getFlaAdminWhatsAppPhone() ||
    '233505112925';
  return `tel:+${digits}`;
}

/**
 * Build a mailto: link. Spaces are encoded as %20 (not +) so the subject/body
 * render correctly in Gmail and other mail apps.
 */
export function buildMailtoUrl(email: string, subject: string, body: string): string {
  const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${email}?${params}`;
}

/** Report an order issue to FLA — opens the report inbox with a prefilled email. */
export function getAdminReportMailtoUrl(
  order: Parameters<typeof buildCustomerReportToAdminMessage>[0],
  customerName?: string,
): string {
  const orderRef = order?._id?.slice(-6)?.toUpperCase() || '------';
  const subject = `FLA Report — Order #ORD-${orderRef}`;
  const body = buildCustomerReportToAdminMessage(order, customerName);
  return buildMailtoUrl(getFlaReportEmail(), subject, body);
}

/** General support request to FLA — opens the support inbox with a prefilled email. */
export function getSupportMailtoUrl(customerName?: string, message?: string): string {
  const subject = 'FLA Support Request';
  const body = [
    'Hello FLA Support,',
    '',
    message?.trim() || 'I need help with my order or account.',
    '',
    `— ${customerName || 'Customer'}`,
  ].join('\n');
  return buildMailtoUrl(getFlaSupportEmail(), subject, body);
}

/** Optional contact for partnership questions (self-registration is also available). */
export function getVendorApplyMailtoUrl(): string {
  const subject = 'FLA Vendor Partnership Inquiry';
  const body = [
    'Hello FLA,',
    '',
    'I would like to become a vendor on FLA Purchase.',
    '',
    'Shop / business name:',
    'Phone (WhatsApp):',
    'City / region:',
    'What I sell:',
    '',
    'Thank you.',
  ].join('\n');
  return buildMailtoUrl(getFlaSupportEmail(), subject, body);
}
