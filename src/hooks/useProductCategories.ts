'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_PRODUCT_CATEGORY_LABELS,
  fetchProductCategories,
  withAllProductCategory,
} from '@/lib/product-categories';

type Options = {
  /** Include "All Product" at the front (filters). Default true. */
  includeAll?: boolean;
};

/**
 * Live product categories from admin settings (GET /settings → product_categories),
 * with hardcoded defaults as fallback.
 */
export function useProductCategories(options?: Options) {
  const includeAll = options?.includeAll !== false;
  const [categories, setCategories] = useState<string[]>(() =>
    includeAll
      ? withAllProductCategory(DEFAULT_PRODUCT_CATEGORY_LABELS)
      : [...DEFAULT_PRODUCT_CATEGORY_LABELS],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProductCategories().then((list) => {
      if (cancelled) return;
      setCategories(includeAll ? withAllProductCategory(list) : list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [includeAll]);

  return { categories, loading };
}
