export type ProductStockFields = {
  stock?: number;
  hasColors?: boolean;
  hasSizes?: boolean;
  colors?: string[];
  sizes?: string[];
  colorStock?: Record<string, number>;
  sizeStock?: Record<string, number>;
  variantStock?: Record<string, number>;
};

export const VARIANT_STOCK_SEP = '|';

export function variantStockKey(color?: string | null, size?: string | null): string | null {
  const c = color?.trim();
  const s = size?.trim();
  if (c && s) return `${c}${VARIANT_STOCK_SEP}${s}`;
  if (c) return c;
  if (s) return `size:${s}`;
  return null;
}

function normOption(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (['n/a', 'na', 'none', '-', 'universal', 'standard'].includes(v.toLowerCase())) return null;
  return v;
}

export function usesPerColorStock(p: ProductStockFields): boolean {
  return !!p.hasColors && p.colorStock != null && Object.keys(p.colorStock).length > 0;
}

export function usesPerSizeStock(p: ProductStockFields): boolean {
  return !!p.hasSizes && p.sizeStock != null && Object.keys(p.sizeStock).length > 0;
}

export function usesVariantMatrix(p: ProductStockFields): boolean {
  return (
    !!p.hasColors &&
    !!p.hasSizes &&
    p.variantStock != null &&
    Object.keys(p.variantStock).length > 0
  );
}

/** Sum totals and drop options with zero stock from listing arrays. */
export function normalizeProductStockPayload(dto: ProductStockFields): ProductStockFields {
  const hasColors = !!dto.hasColors;
  const hasSizes = !!dto.hasSizes;
  let colorStock = { ...(dto.colorStock || {}) };
  let sizeStock = { ...(dto.sizeStock || {}) };
  let variantStock = { ...(dto.variantStock || {}) };

  for (const k of Object.keys(colorStock)) {
    colorStock[k] = Math.max(0, Math.floor(Number(colorStock[k]) || 0));
  }
  for (const k of Object.keys(sizeStock)) {
    sizeStock[k] = Math.max(0, Math.floor(Number(sizeStock[k]) || 0));
  }
  for (const k of Object.keys(variantStock)) {
    variantStock[k] = Math.max(0, Math.floor(Number(variantStock[k]) || 0));
  }

  let colors = [...(dto.colors || [])];
  let sizes = [...(dto.sizes || [])];
  let stock = Math.max(0, Math.floor(Number(dto.stock) || 0));

  if (hasColors && hasSizes && Object.keys(variantStock).length > 0) {
    const origColors = [...colors];
    const origSizes = [...sizes];
    colors = origColors.filter((c) =>
      origSizes.some((s) => (variantStock[`${c}${VARIANT_STOCK_SEP}${s}`] ?? 0) > 0),
    );
    sizes = origSizes.filter((s) =>
      origColors.some((c) => (variantStock[`${c}${VARIANT_STOCK_SEP}${s}`] ?? 0) > 0),
    );
    stock = Object.values(variantStock).reduce((a, b) => a + b, 0);
  } else if (hasColors && Object.keys(colorStock).length > 0) {
    colors = colors.filter((c) => (colorStock[c] ?? 0) > 0);
    stock = colors.reduce((sum, c) => sum + (colorStock[c] ?? 0), 0);
    variantStock = {};
    sizeStock = {};
  } else if (hasSizes && Object.keys(sizeStock).length > 0) {
    sizes = sizes.filter((s) => (sizeStock[s] ?? 0) > 0);
    stock = sizes.reduce((sum, s) => sum + (sizeStock[s] ?? 0), 0);
    variantStock = {};
    colorStock = {};
  }

  return {
    ...dto,
    stock,
    colors,
    sizes,
    colorStock: Object.keys(colorStock).length ? colorStock : undefined,
    sizeStock: Object.keys(sizeStock).length ? sizeStock : undefined,
    variantStock: Object.keys(variantStock).length ? variantStock : undefined,
  };
}

export function availableStockForSelection(
  product: ProductStockFields,
  color?: string | null,
  size?: string | null,
): number {
  const total = Math.max(0, Number(product.stock) || 0);
  const c = normOption(color);
  const s = normOption(size);

  if (usesVariantMatrix(product) && c && s) {
    return product.variantStock![`${c}${VARIANT_STOCK_SEP}${s}`] ?? 0;
  }
  if (usesPerColorStock(product) && c) {
    return product.colorStock![c] ?? 0;
  }
  if (usesPerSizeStock(product) && s) {
    return product.sizeStock![s] ?? 0;
  }
  return total;
}

export function assertLineItemStock(
  product: ProductStockFields & { name?: string; isActive?: boolean },
  quantity: number,
  color?: string | null,
  size?: string | null,
): void {
  const label = product.name || 'This item';
  if (product.isActive === false) {
    throw new Error(`${label} is no longer available.`);
  }
  const qty = Math.max(1, quantity || 1);
  const available = availableStockForSelection(product, color, size);
  if (available < qty) {
    const c = normOption(color);
    const s = normOption(size);
    if (c || s) {
      throw new Error(
        `${label}${c ? ` (${c})` : ''}${s ? ` size ${s}` : ''} is sold out or doesn't have enough stock left.`,
      );
    }
    throw new Error(`${label} is sold out or doesn't have enough stock left.`);
  }
  if ((product.stock ?? 0) < qty) {
    throw new Error(`${label} is sold out or doesn't have enough stock left.`);
  }
}

/** Mongo $inc paths for atomic variant decrement (also decrements total stock). */
export function stockDecrementUpdate(
  product: ProductStockFields,
  quantity: number,
  color?: string | null,
  size?: string | null,
): { $inc: Record<string, number> } {
  const qty = Math.max(1, quantity || 1);
  const $inc: Record<string, number> = { stock: -qty };
  const c = normOption(color);
  const s = normOption(size);

  if (usesVariantMatrix(product) && c && s) {
    $inc[`variantStock.${c}${VARIANT_STOCK_SEP}${s}`] = -qty;
  } else if (usesPerColorStock(product) && c) {
    $inc[`colorStock.${c}`] = -qty;
  } else if (usesPerSizeStock(product) && s) {
    $inc[`sizeStock.${s}`] = -qty;
  }
  return { $inc };
}

export function stockIncrementUpdate(
  product: ProductStockFields,
  quantity: number,
  color?: string | null,
  size?: string | null,
): { $inc: Record<string, number> } {
  const qty = Math.max(1, quantity || 1);
  const $inc: Record<string, number> = { stock: qty };
  const c = normOption(color);
  const s = normOption(size);

  if (usesVariantMatrix(product) && c && s) {
    $inc[`variantStock.${c}${VARIANT_STOCK_SEP}${s}`] = qty;
  } else if (usesPerColorStock(product) && c) {
    $inc[`colorStock.${c}`] = qty;
  } else if (usesPerSizeStock(product) && s) {
    $inc[`sizeStock.${s}`] = qty;
  }
  return { $inc };
}

/** After payment/cancel, prune zero-stock options from arrays. */
export function pruneZeroStockOptions(product: ProductStockFields): Partial<ProductStockFields> {
  const normalized = normalizeProductStockPayload(product);
  return {
    stock: normalized.stock,
    colors: normalized.colors,
    sizes: normalized.sizes,
    colorStock: normalized.colorStock,
    sizeStock: normalized.sizeStock,
    variantStock: normalized.variantStock,
  };
}
