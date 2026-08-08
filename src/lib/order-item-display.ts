/** Meaningful size/color (ignore placeholders). */
export function isMeaningfulOption(value?: string | null): boolean {
  if (!value?.trim()) return false;
  const v = value.trim().toLowerCase();
  return !['n/a', 'na', 'none', '-', 'universal', 'standard'].includes(v);
}

/** Compact variant: "M / Red" or "" if none */
export function formatOrderItemOptions(item?: {
  size?: string | null;
  color?: string | null;
} | null): string {
  if (!item) return '';
  const size = isMeaningfulOption(item.size) ? String(item.size).trim() : '';
  const color = isMeaningfulOption(item.color) ? String(item.color).trim() : '';
  return [size, color].filter(Boolean).join(' / ');
}

/** Line for WA/SMS: "Perfume (M / Gold) ×2" */
export function formatOrderItemLine(item?: {
  name?: string | null;
  size?: string | null;
  color?: string | null;
  quantity?: number | null;
} | null): string {
  const name = item?.name?.trim() || 'item';
  const opts = formatOrderItemOptions(item);
  const base = opts ? `${name} (${opts})` : name;
  const qty = item?.quantity != null && Number(item.quantity) > 1 ? ` ×${item.quantity}` : '';
  return `${base}${qty}`;
}

/** Size · Color · Qty labels for order ledgers */
export function formatOrderItemLedgerMeta(item?: {
  size?: string | null;
  color?: string | null;
  quantity?: number | null;
} | null): string {
  if (!item) return 'Qty: 1';
  const size = isMeaningfulOption(item.size) ? String(item.size).trim() : null;
  const color = isMeaningfulOption(item.color) ? String(item.color).trim() : null;
  const qty = item.quantity ?? 1;
  const parts = [
    size ? `Size: ${size}` : null,
    color ? `Color: ${color}` : null,
    `Qty: ${qty}`,
  ].filter(Boolean);
  return parts.join(' · ');
}
