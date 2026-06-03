import type { CartItem } from '@/context/CartContext';

export type VendorCartGroup = {
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  subtotal: number;
};

export function normalizeVendorId(vendorId?: string | { _id?: string; id?: string } | null): string | null {
  if (!vendorId) return null;
  if (typeof vendorId === 'object') {
    const id = vendorId._id || vendorId.id;
    return id ? String(id) : null;
  }
  return String(vendorId);
}

export function groupCartByVendor(cartItems: CartItem[]): VendorCartGroup[] {
  const map = new Map<string, VendorCartGroup>();

  for (const item of cartItems) {
    const vendorId = normalizeVendorId(item.vendorId as string | { _id?: string; id?: string });
    if (!vendorId) continue;

    const existing = map.get(vendorId);
    if (existing) {
      existing.items.push(item);
      existing.subtotal += item.price * item.quantity;
      if (!existing.vendorName && item.vendorName) {
        existing.vendorName = item.vendorName;
      }
    } else {
      map.set(vendorId, {
        vendorId,
        vendorName: item.vendorName || 'Vendor',
        items: [item],
        subtotal: item.price * item.quantity,
      });
    }
  }

  return Array.from(map.values());
}

export const MULTI_CHECKOUT_STORAGE_KEY = 'fla_multi_checkout';

export type MultiCheckoutState = {
  orderIds: string[];
  startedAt: number;
};

export function setMultiCheckoutQueue(orderIds: string[]): void {
  if (typeof window === 'undefined' || orderIds.length < 2) return;
  const state: MultiCheckoutState = { orderIds, startedAt: Date.now() };
  localStorage.setItem(MULTI_CHECKOUT_STORAGE_KEY, JSON.stringify(state));
}

export function getMultiCheckoutQueue(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MULTI_CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MultiCheckoutState;
    return Array.isArray(parsed.orderIds) && parsed.orderIds.length > 1 ? parsed.orderIds : null;
  } catch {
    return null;
  }
}

export function clearMultiCheckoutQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MULTI_CHECKOUT_STORAGE_KEY);
}
