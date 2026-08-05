import { setProductNavOrigin } from '@/lib/marketplace-return';

const RETURN_KEY = 'fla_store_return';
const PENDING_SCROLL_KEY = 'fla_store_pending_scroll';
const CACHE_PREFIX = 'fla_store_cache_';

export type StoreReturn = {
  slug: string;
  path: string;
  scrollY: number;
  productId?: string;
};

function cacheKey(slug: string) {
  return `${CACHE_PREFIX}${slug}`;
}

/** Save scroll before store → product so we can restore when tapping the shop name. */
export function saveStoreReturn(slug: string, productId?: string): void {
  if (typeof window === 'undefined' || !slug) return;
  const path = `/store/${encodeURIComponent(slug)}`;
  const payload: StoreReturn = {
    slug,
    path,
    scrollY: window.scrollY,
    productId,
  };
  sessionStorage.setItem(RETURN_KEY, JSON.stringify(payload));
  setProductNavOrigin('store');
}

export function getStoreReturn(slug: string): StoreReturn {
  if (typeof window === 'undefined') {
    return { slug, path: `/store/${encodeURIComponent(slug)}`, scrollY: 0 };
  }
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreReturn;
      if (parsed?.slug === slug && parsed.path) {
        return {
          slug,
          path: parsed.path,
          scrollY: Number(parsed.scrollY) || 0,
          productId: parsed.productId,
        };
      }
    }
  } catch {
    // ignore
  }
  return { slug, path: `/store/${encodeURIComponent(slug)}`, scrollY: 0 };
}

export function markStoreScrollRestore(ret: StoreReturn): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    PENDING_SCROLL_KEY,
    JSON.stringify({
      slug: ret.slug,
      scrollY: ret.scrollY,
      productId: ret.productId,
    }),
  );
}

export function restoreStoreScrollIfNeeded(slug: string): void {
  if (typeof window === 'undefined') return;
  const raw = sessionStorage.getItem(PENDING_SCROLL_KEY);
  if (!raw) return;

  let scrollY = 0;
  let productId: string | undefined;
  let pendingSlug = '';
  try {
    const parsed = JSON.parse(raw) as { slug?: string; scrollY?: number; productId?: string };
    pendingSlug = parsed.slug || '';
    scrollY = Number(parsed.scrollY) || 0;
    productId = parsed.productId;
  } catch {
    sessionStorage.removeItem(PENDING_SCROLL_KEY);
    return;
  }

  if (pendingSlug !== slug) return;
  sessionStorage.removeItem(PENDING_SCROLL_KEY);

  const apply = () => {
    if (productId) {
      const el = document.querySelector<HTMLElement>(`[data-product-id="${CSS.escape(productId)}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        return;
      }
    }
    window.scrollTo({ top: scrollY, behavior: 'auto' });
  };

  requestAnimationFrame(() => {
    apply();
    setTimeout(apply, 120);
  });
}

/** Cache store listing so returning from a product does not flash a full reload. */
export function cacheStorePage(
  slug: string,
  data: { vendor: unknown; products: unknown[] },
): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    sessionStorage.setItem(
      cacheKey(slug),
      JSON.stringify({ ...data, savedAt: Date.now() }),
    );
  } catch {
    // quota — ignore
  }
}

export function readStoreCache(slug: string): { vendor: any; products: any[] } | null {
  if (typeof window === 'undefined' || !slug) return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.vendor) return null;
    // Fresh for 10 minutes
    if (parsed.savedAt && Date.now() - parsed.savedAt > 10 * 60 * 1000) {
      sessionStorage.removeItem(cacheKey(slug));
      return null;
    }
    return {
      vendor: parsed.vendor,
      products: Array.isArray(parsed.products) ? parsed.products : [],
    };
  } catch {
    return null;
  }
}
