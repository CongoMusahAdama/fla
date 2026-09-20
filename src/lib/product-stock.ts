export const VARIANT_STOCK_SEP = '|';

export type ProductStockView = {
  stock?: number;
  hasColors?: boolean;
  hasSizes?: boolean;
  colors?: string[];
  sizes?: string[];
  colorStock?: Record<string, number>;
  sizeStock?: Record<string, number>;
  variantStock?: Record<string, number>;
};

function normOption(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (['n/a', 'na', 'none', '-', 'universal', 'standard'].includes(v.toLowerCase())) return null;
  return v;
}

export function usesVariantMatrix(p: ProductStockView): boolean {
  return (
    !!p.hasColors &&
    !!p.hasSizes &&
    !!p.variantStock &&
    Object.keys(p.variantStock).length > 0
  );
}

export function usesPerColorStock(p: ProductStockView): boolean {
  return !!p.hasColors && !!p.colorStock && Object.keys(p.colorStock).length > 0;
}

export function usesPerSizeStock(p: ProductStockView): boolean {
  return !!p.hasSizes && !!p.sizeStock && Object.keys(p.sizeStock).length > 0;
}

export function availableStockForSelection(
  product: ProductStockView,
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

export function listAvailableColors(product: ProductStockView): string[] {
  const list = product.colors || [];
  if (!product.hasColors) return list;
  if (usesVariantMatrix(product)) {
    return list.filter((c) =>
      (product.sizes || []).some(
        (s) => (product.variantStock![`${c}${VARIANT_STOCK_SEP}${s}`] ?? 0) > 0,
      ),
    );
  }
  if (usesPerColorStock(product)) {
    return list.filter((c) => (product.colorStock![c] ?? 0) > 0);
  }
  return (product.stock ?? 0) > 0 ? list : [];
}

export function listAvailableSizes(product: ProductStockView): string[] {
  const list = product.sizes || [];
  if (!product.hasSizes) return list;
  if (usesVariantMatrix(product)) {
    return list.filter((s) =>
      (product.colors || []).some(
        (c) => (product.variantStock![`${c}${VARIANT_STOCK_SEP}${s}`] ?? 0) > 0,
      ),
    );
  }
  if (usesPerSizeStock(product)) {
    return list.filter((s) => (product.sizeStock![s] ?? 0) > 0);
  }
  return (product.stock ?? 0) > 0 ? list : [];
}

export function optionStockLabel(
  product: ProductStockView,
  kind: 'color' | 'size',
  value: string,
  selectedColor?: string | null,
  selectedSize?: string | null,
): number | null {
  if (kind === 'color') {
    if (usesVariantMatrix(product) && selectedSize) {
      const n = product.variantStock![`${value}${VARIANT_STOCK_SEP}${selectedSize}`];
      return n != null ? n : null;
    }
    if (usesPerColorStock(product)) return product.colorStock![value] ?? 0;
  }
  if (kind === 'size') {
    if (usesVariantMatrix(product) && selectedColor) {
      const n = product.variantStock![`${selectedColor}${VARIANT_STOCK_SEP}${value}`];
      return n != null ? n : null;
    }
    if (usesPerSizeStock(product)) return product.sizeStock![value] ?? 0;
  }
  return null;
}
