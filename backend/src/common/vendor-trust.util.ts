/** Green badge on storefront: high-tier vendor (business registration on file). */
export function isVendorDocumented(vendor?: {
  vendorTier?: string;
  businessRegistration?: string;
} | null): boolean {
  if (!vendor) return false;
  if (vendor.vendorTier === 'high') return true;
  // Fallback when tier was not synced but business registration exists
  return Boolean(vendor.businessRegistration?.trim());
}
