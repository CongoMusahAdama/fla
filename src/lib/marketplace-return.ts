const RETURN_KEY = 'fla_marketplace_return';
const PENDING_SCROLL_KEY = 'fla_marketplace_pending_scroll';

export type MarketplaceReturn = {
  path: string;
  scrollY: number;
  productId?: string;
  shopPage?: number;
  homeLoadedCount?: number;
};

function isMarketplacePath(path: string): boolean {
  const pathname = path.split('?')[0] || '/';
  return pathname === '/' || pathname.startsWith('/shop');
}

/** Call before navigating from marketplace → product so we can restore scroll on return. */
export function saveMarketplaceReturn(productId?: string): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname + window.location.search;
  if (!isMarketplacePath(path)) return;
  const payload: MarketplaceReturn = {
    path,
    scrollY: window.scrollY,
    productId,
  };

  try {
    if (path.startsWith('/shop')) {
      const shopPage = Number(sessionStorage.getItem('fla_shop_page'));
      if (shopPage > 0) payload.shopPage = shopPage;
    }
    if ((path.split('?')[0] || '/') === '/') {
      const homeLoadedCount = Number(sessionStorage.getItem('fla_home_loaded_count'));
      if (homeLoadedCount > 0) payload.homeLoadedCount = homeLoadedCount;
    }
  } catch {
    // ignore
  }

  sessionStorage.setItem(RETURN_KEY, JSON.stringify(payload));
}

export function getMarketplaceReturn(): MarketplaceReturn {
  if (typeof window === 'undefined') {
    return { path: '/shop', scrollY: 0 };
  }
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MarketplaceReturn;
      if (parsed?.path && isMarketplacePath(parsed.path)) {
        return {
          path: parsed.path,
          scrollY: Number(parsed.scrollY) || 0,
          productId: parsed.productId,
          shopPage: parsed.shopPage ? Number(parsed.shopPage) : undefined,
          homeLoadedCount: parsed.homeLoadedCount ? Number(parsed.homeLoadedCount) : undefined,
        };
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { path: '/shop', scrollY: 0 };
}

/** Mark that the next marketplace page load should restore scroll. */
export function markMarketplaceScrollRestore(ret: MarketplaceReturn): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    PENDING_SCROLL_KEY,
    JSON.stringify({
      scrollY: ret.scrollY,
      productId: ret.productId,
      shopPage: ret.shopPage,
      homeLoadedCount: ret.homeLoadedCount,
    }),
  );
}

export function peekPendingMarketplaceScroll(): {
  scrollY: number;
  productId?: string;
  shopPage?: number;
  homeLoadedCount?: number;
} | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_SCROLL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Restore marketplace scroll after products render.
 * Prefer scrolling the tapped product into view; fall back to saved Y.
 */
export function restoreMarketplaceScrollIfNeeded(): void {
  if (typeof window === 'undefined') return;
  const raw = sessionStorage.getItem(PENDING_SCROLL_KEY);
  if (!raw) return;
  sessionStorage.removeItem(PENDING_SCROLL_KEY);

  let scrollY = 0;
  let productId: string | undefined;
  try {
    const parsed = JSON.parse(raw) as { scrollY?: number; productId?: string };
    scrollY = Number(parsed.scrollY) || 0;
    productId = parsed.productId;
  } catch {
    return;
  }

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

  // Wait a frame so the product grid is in the DOM.
  requestAnimationFrame(() => {
    apply();
    // Second pass in case images/layout shift the page.
    setTimeout(apply, 120);
  });
}
