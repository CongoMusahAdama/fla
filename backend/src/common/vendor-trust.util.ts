/** Green badge: confirmed documented vendor (or legacy high-tier / certificate on file). */
export function isVendorDocumented(vendor?: {
  vendorTier?: string;
  businessRegistration?: string;
  businessRegistrationApprovedAt?: Date | string | null;
  businessRegistrationSubmittedAt?: Date | string | null;
} | null): boolean {
  if (vendor?.businessRegistrationApprovedAt) return true;
  // Already promoted / grandfathered high-tier shops stay green
  if (vendor?.vendorTier === 'high') return true;

  const hasCert = Boolean(vendor?.businessRegistration?.trim());
  if (!hasCert) return false;

  // New upload awaiting admin review → yellow until Confirm business registration
  if (
    vendor?.businessRegistrationSubmittedAt &&
    !vendor?.businessRegistrationApprovedAt
  ) {
    return false;
  }

  // Certificate on file from before the review workflow
  return true;
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
