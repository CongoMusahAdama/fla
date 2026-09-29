const RETURN_KEY = 'fla_marketplace_return';
const PENDING_SCROLL_KEY = 'fla_marketplace_pending_scroll';
/** Where the user opened the product detail page from (drives back-link UI). */
const PRODUCT_ORIGIN_KEY = 'fla_product_nav_origin';

const HOME_FILTERS_KEY = 'fla_home_marketplace_filters';
const SHOP_FILTERS_KEY = 'fla_shop_marketplace_filters';

export type ProductNavOrigin = 'marketplace' | 'store';

export function setProductNavOrigin(origin: ProductNavOrigin): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PRODUCT_ORIGIN_KEY, origin);
  } catch {
    // ignore
  }
}

/** Default to store (storefront URL / deep link) — marketplace is only set when leaving / or /shop. */
export function getProductNavOrigin(): ProductNavOrigin {
  if (typeof window === 'undefined') return 'store';
  try {
    const v = sessionStorage.getItem(PRODUCT_ORIGIN_KEY);
    if (v === 'marketplace') return 'marketplace';
  } catch {
    // ignore
  }
  return 'store';
}

export type MarketplaceReturn = {
  path: string;
  scrollY: number;
  productId?: string;
  shopPage?: number;
  /** Products visible on /shop when user left (show-more shelf). */
  shopLoadedCount?: number;
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
      const shopLoadedCount = Number(sessionStorage.getItem('fla_shop_loaded_count'));
      if (shopLoadedCount > 0) payload.shopLoadedCount = shopLoadedCount;
      const shopPage = Number(sessionStorage.getItem('fla_shop_page'));
      if (shopPage > 1) payload.shopPage = shopPage;
    }
    if ((path.split('?')[0] || '/') === '/') {
      const homeLoadedCount = Number(sessionStorage.getItem('fla_home_loaded_count'));
      if (homeLoadedCount > 0) payload.homeLoadedCount = homeLoadedCount;
    }
  } catch {
    // ignore
  }

  sessionStorage.setItem(RETURN_KEY, JSON.stringify(payload));
  setProductNavOrigin('marketplace');
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
          shopLoadedCount: parsed.shopLoadedCount ? Number(parsed.shopLoadedCount) : undefined,
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
      shopLoadedCount: ret.shopLoadedCount,
      homeLoadedCount: ret.homeLoadedCount,
    }),
  );
}

export function peekPendingMarketplaceScroll(): {
  scrollY: number;
  productId?: string;
  shopPage?: number;
  shopLoadedCount?: number;
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

export type HomeFilters = {
  region: string;
  category: string;
  filter: string;
};

export type ShopFilters = {
  region: string;
  price: string;
};

/** Persist home-page filter state so it survives a round-trip through a product page. */
export function saveHomeMarketplaceFilters(filters: HomeFilters): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(HOME_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // ignore
  }
}

export function getHomeMarketplaceFilters(): HomeFilters | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(HOME_FILTERS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist shop-page filter state (Region/Price are NOT encoded in the URL). */
export function saveShopMarketplaceFilters(filters: ShopFilters): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SHOP_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // ignore
  }
}

export function getShopMarketplaceFilters(): ShopFilters | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SHOP_FILTERS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}