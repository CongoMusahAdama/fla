export function resolveStoreSlug(
  storeSlug?: string | null,
  vendorId?: string | { storeSlug?: string; _id?: string; id?: string } | null,
): string | null {
  if (storeSlug?.trim()) return storeSlug.trim();
  if (vendorId && typeof vendorId === 'object' && vendorId.storeSlug?.trim()) {
    return vendorId.storeSlug.trim();
  }
  return null;
}

export function storeHomePath(slug: string): string {
  return `/store/${encodeURIComponent(slug)}`;
}

export function storeProductPath(slug: string, productId: string): string {
  return `/store/${encodeURIComponent(slug)}/p/${encodeURIComponent(productId)}`;
}

export function storefrontUrl(slug: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${storeHomePath(slug)}`;
}

export function storeProductUrl(slug: string, productId: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${storeProductPath(slug, productId)}`;
}
