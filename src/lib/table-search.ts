/** Returns true if query is empty or any part contains the query (case-insensitive). */
export function matchesTableSearch(
  query: string,
  ...parts: (string | number | null | undefined | boolean)[]
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => p != null && String(p).toLowerCase().includes(q));
}

export function customerOrderSearchValues(order: {
  _id?: string;
  status?: string;
  vendorName?: string;
  pickupPoint?: string;
  customerName?: string;
  items?: { name?: string }[];
}): (string | undefined)[] {
  const itemNames = order.items?.map((i) => i.name).filter(Boolean).join(' ');
  return [
    order._id,
    order.status,
    order.vendorName,
    order.pickupPoint,
    order.customerName,
    order.items?.[0]?.name,
    itemNames,
  ];
}

export function vendorOrderSearchValues(order: {
  _id?: string;
  customerName?: string;
  customerPhone?: string;
  productName?: string;
  shippingCity?: string;
  shippingRegion?: string;
  shippingAddress?: string;
  status?: string;
  pickupPoint?: string;
  deliveryType?: string;
  items?: { name?: string }[];
}): (string | undefined)[] {
  const itemNames = order.items?.map((i) => i.name).filter(Boolean).join(' ');
  return [
    order._id,
    order.customerName,
    order.customerPhone,
    order.productName,
    order.shippingCity,
    order.shippingRegion,
    order.shippingAddress,
    order.status,
    order.pickupPoint,
    order.deliveryType,
    itemNames,
  ];
}
