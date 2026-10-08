/** Keep in step with backend/src/common/whatsapp-clicks.util.ts */
export const WHATSAPP_CLICK_PRICE_GHS = 0.5;

export function clicksForAmount(amountGhs: number): { clicks: number; chargeGhs: number } {
  if (!Number.isFinite(amountGhs) || amountGhs <= 0) {
    return { clicks: 0, chargeGhs: 0 };
  }
  const pesewas = Math.round(amountGhs * 100);
  const clicks = Math.floor(pesewas / Math.round(WHATSAPP_CLICK_PRICE_GHS * 100));
  const chargeGhs = Math.round(clicks * WHATSAPP_CLICK_PRICE_GHS * 100) / 100;
  return { clicks, chargeGhs };
}

const CLIENT_KEY = 'fla_wa_click_client';

export function getWhatsappClickClientId(): string {
  const makeId = () => {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid && uuid.length >= 16) return uuid;
    return `fla-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  };

  try {
    const existing = localStorage.getItem(CLIENT_KEY);
    if (existing && /^[a-zA-Z0-9-]{16,80}$/.test(existing)) return existing;
    const id = makeId().slice(0, 80);
    localStorage.setItem(CLIENT_KEY, id);
    return id;
  } catch {
    return makeId().slice(0, 80);
  }
}

export type WhatsappLeadResult = {
  available: boolean;
  url?: string;
  charged?: boolean;
  alreadyCounted?: boolean;
  message?: string;
};

export async function openVendorWhatsappLead(
  productId: string,
  token?: string | null,
): Promise<WhatsappLeadResult> {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${api}/products/${productId}/whatsapp-click`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ clientId: getWhatsappClickClientId() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(msg || 'Could not open WhatsApp');
  }
  return data as WhatsappLeadResult;
}
