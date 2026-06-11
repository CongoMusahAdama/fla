/** Green badge on storefront: vendor submitted KYC docs and is approved/verified. */
export function isVendorDocumented(vendor?: {
  status?: string;
  ghanaCardFront?: string;
  selfie?: string;
  isVerified?: boolean;
  isIdentityVerified?: boolean;
  kycApprovedAt?: Date | string | null;
  verificationStatus?: string;
} | null): boolean {
  if (!vendor) return false;
  const hasDocs = Boolean(vendor.ghanaCardFront && vendor.selfie);
  if (!hasDocs) return false;
  if (vendor.status === 'active' || vendor.kycApprovedAt) return true;
  if (vendor.isVerified || vendor.isIdentityVerified) return true;
  if (vendor.verificationStatus === 'verified') return true;
  return false;
}
