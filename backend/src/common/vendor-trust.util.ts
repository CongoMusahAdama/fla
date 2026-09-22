/** Green badge: admin confirmed business registration (not just any uploaded file). */
export function isVendorDocumented(vendor?: {
  vendorTier?: string;
  businessRegistration?: string;
  businessRegistrationApprovedAt?: Date | string | null;
  businessRegistrationSubmittedAt?: Date | string | null;
} | null): boolean {
  if (!vendor?.businessRegistration?.trim()) return false;
  if (vendor.businessRegistrationApprovedAt) return true;
  // Legacy vendors promoted before review workflow (no submitted timestamp)
  if (
    vendor.vendorTier === 'high' &&
    !vendor.businessRegistrationSubmittedAt
  ) {
    return true;
  }
  return false;
}

export function isBusinessRegistrationPendingReview(vendor?: {
  vendorTier?: string;
  businessRegistration?: string;
  businessRegistrationApprovedAt?: Date | string | null;
  businessRegistrationSubmittedAt?: Date | string | null;
} | null): boolean {
  if (!vendor?.businessRegistration?.trim()) return false;
  if (vendor.businessRegistrationApprovedAt) return false;
  if (vendor.vendorTier === 'high' && !vendor.businessRegistrationSubmittedAt) {
    return false;
  }
  return true;
}
