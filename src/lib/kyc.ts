/** Shufti Pro KYC display status for admin/vendor UI */
export function getShuftiKycStatus(vendor: {
  ghanaCardFront?: string;
  ghanaCardBack?: string;
  selfie?: string;
  verificationStatus?: string;
  isVerified?: boolean;
  isIdentityVerified?: boolean;
  verificationDeclineReason?: string;
}) {
  const hasRequiredDocs = Boolean(vendor.ghanaCardFront && vendor.selfie);
  const status = vendor.verificationStatus || (vendor.isVerified ? 'verified' : 'pending');

  if (!hasRequiredDocs) {
    return {
      label: 'Documents required',
      tone: 'slate' as const,
      verified: false,
    };
  }

  if (status === 'verified' && (vendor.isVerified || vendor.isIdentityVerified)) {
    return { label: 'Shufti verified', tone: 'emerald' as const, verified: true };
  }

  if (status === 'declined') {
    return {
      label: 'Shufti declined',
      tone: 'rose' as const,
      verified: false,
      reason: vendor.verificationDeclineReason,
    };
  }

  if (status === 'submitted') {
    return { label: 'Shufti review pending', tone: 'amber' as const, verified: false };
  }

  return { label: 'Awaiting Shufti', tone: 'amber' as const, verified: false };
}

export const kycToneClasses = {
  slate: 'bg-slate-50 text-slate-500',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
};

/** Green badge only after an admin confirms the certificate, or the shop was already promoted to high tier. */
export function isVendorDocumented(vendor?: {
  vendorTier?: string;
  businessRegistration?: string;
  businessRegistrationApprovedAt?: string | Date | null;
  businessRegistrationSubmittedAt?: string | Date | null;
} | null): boolean {
  if (vendor?.businessRegistrationApprovedAt) return true;
  if (vendor?.vendorTier === 'high') return true;
  return false;
}

export function isBusinessRegistrationPendingReview(vendor?: {
  vendorTier?: string;
  businessRegistration?: string;
  businessRegistrationApprovedAt?: string | Date | null;
  businessRegistrationSubmittedAt?: string | Date | null;
} | null): boolean {
  if (!vendor?.businessRegistration?.trim()) return false;
  if (vendor.businessRegistrationApprovedAt) return false;
  if (vendor.vendorTier === 'high') return false;
  return Boolean(vendor.businessRegistrationSubmittedAt);
}
