import { PRODUCT_CATEGORIES } from '@/lib/constants';

/** Default sellable categories (no "All Product" sentinel). */
export const DEFAULT_PRODUCT_CATEGORY_LABELS = PRODUCT_CATEGORIES.filter(
  (c) => c !== 'All Product' && c !== 'All',
);

export function normalizeCategoryList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_PRODUCT_CATEGORY_LABELS];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const s = String(item ?? '').trim();
    if (!s || s === 'All Product' || s === 'All') continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out.length ? out : [...DEFAULT_PRODUCT_CATEGORY_LABELS];
}

/** UI filter lists include the "All Product" sentinel first. */
export function withAllProductCategory(categories: string[]): string[] {
  return ['All Product', ...normalizeCategoryList(categories)];
}

export async function fetchProductCategories(): Promise<string[]> {
  try {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${api}/settings`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return [...DEFAULT_PRODUCT_CATEGORY_LABELS];
    const data = await res.json();
    return normalizeCategoryList(data?.product_categories);
  } catch {
    return [...DEFAULT_PRODUCT_CATEGORY_LABELS];
  }
}
