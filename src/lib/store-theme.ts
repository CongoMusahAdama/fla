/** Default FLA storefront palette when vendor has not customized. */
export const DEFAULT_STORE_ACCENT = '#F6B01E';
export const DEFAULT_STORE_THEME = '#0f2744';

export const STORE_ACCENT_PRESETS = [
  { label: 'FLA Gold', value: '#F6B01E' },
  { label: 'Sunset', value: '#F97316' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Royal Blue', value: '#2563EB' },
  { label: 'Purple', value: '#7C3AED' },
] as const;

export const STORE_THEME_PRESETS = [
  { label: 'FLA Navy', value: '#0f2744' },
  { label: 'Charcoal', value: '#1e293b' },
  { label: 'Forest', value: '#14532d' },
  { label: 'Wine', value: '#4c0519' },
  { label: 'Black', value: '#0a0a0a' },
  { label: 'Indigo', value: '#312e81' },
] as const;

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function normalizeStoreHex(input?: string | null, fallback?: string): string {
  const raw = (input || '').trim();
  if (HEX_RE.test(raw)) return raw;
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (HEX_RE.test(withHash)) return withHash;
  return fallback || DEFAULT_STORE_ACCENT;
}

export function resolveStoreTheme(vendor?: {
  storeAccentColor?: string | null;
  storeThemeColor?: string | null;
} | null) {
  return {
    accent: normalizeStoreHex(vendor?.storeAccentColor, DEFAULT_STORE_ACCENT),
    theme: normalizeStoreHex(vendor?.storeThemeColor, DEFAULT_STORE_THEME),
  };
}

export function storeThemeStyle(vendor?: {
  storeAccentColor?: string | null;
  storeThemeColor?: string | null;
} | null): Record<string, string> {
  const { accent, theme } = resolveStoreTheme(vendor);
  return {
    ['--store-accent' as string]: accent,
    ['--store-theme' as string]: theme,
  };
}
