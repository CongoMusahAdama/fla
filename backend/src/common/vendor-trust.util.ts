/** Green badge only after an admin confirms the certificate, or the shop was already promoted to high tier. */
export function isVendorDocumented(vendor?: {
  vendorTier?: string;
  businessRegistration?: string;
  businessRegistrationApprovedAt?: Date | string | null;
  businessRegistrationSubmittedAt?: Date | string | null;
} | null): boolean {
  if (vendor?.businessRegistrationApprovedAt) return true;
  if (vendor?.vendorTier === 'high') return true;
  return false;
}

/** Admin queue: certificate uploaded/replaced and not yet confirmed (and not already high-tier). */
export function isBusinessRegistrationPendingReview(vendor?: {
  vendorTier?: string;
  businessRegistration?: string;
  businessRegistrationApprovedAt?: Date | string | null;
  businessRegistrationSubmittedAt?: Date | string | null;
} | null): boolean {
  if (!vendor?.businessRegistration?.trim()) return false;
  if (vendor.businessRegistrationApprovedAt) return false;
  if (vendor.vendorTier === 'high') return false;
  return Boolean(vendor.businessRegistrationSubmittedAt);
}
