/** Normalize a shop/business name into a URL-safe slug base. */
export function slugifyShopName(input: string): string {
  const base = (input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60)
    .replace(/-+$/g, '');

  return base || 'store';
}

/** Build candidate slugs: base, base-2, base-3, ... */
export function slugCandidates(base: string, max = 50): string[] {
  const out = [base];
  for (let i = 2; i <= max; i++) {
    out.push(`${base}-${i}`);
  }
  return out;
}
