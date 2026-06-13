"use client";

import { Check } from 'lucide-react';

interface VendorTrustBadgeProps {
  documented?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/** Green = high-tier vendor (business registered); yellow = low-tier. */
export function VendorTrustBadge({
  documented = false,
  size = 'sm',
  className = '',
}: VendorTrustBadgeProps) {
  const dim = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  const icon = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <span
      title={
        documented
          ? 'High-tier vendor — business registration on file'
          : 'Low-tier vendor — sells items up to GHS 100'
      }
      className={`inline-flex items-center justify-center rounded-full shrink-0 ring-2 ring-white shadow-sm ${
        documented ? 'bg-emerald-500' : 'bg-amber-400'
      } ${dim} ${className}`}
      aria-label={documented ? 'High-tier vendor' : 'Low-tier vendor'}
    >
      <Check className={`${icon} text-white`} strokeWidth={3} />
    </span>
  );
}
