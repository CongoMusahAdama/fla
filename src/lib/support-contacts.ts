import { buildCustomerReportToAdminMessage } from './whatsapp';

/**
 * FLA email contacts. Reports and general support go to different inboxes.
 * Override via env in production so the addresses can change without a redeploy.
 */
export function getFlaReportEmail(): string {
  return process.env.NEXT_PUBLIC_FLA_REPORT_EMAIL?.trim() || 'report@flamingo.com';
}

export function getFlaSupportEmail(): string {
  return process.env.NEXT_PUBLIC_FLA_SUPPORT_EMAIL?.trim() || 'support@flamingo.co';
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
