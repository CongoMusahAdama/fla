/**
 * Single source of truth for the frontend base URL, used to build every
 * outbound link (referral links, password reset, order tracking, etc.).
 * Trims stray whitespace from the env var (a misconfigured value with a
 * trailing space previously broke links with a literal/encoded space —
 * e.g. "https://flamingo-store1.com /ref/slug") and strips a trailing slash.
 */
export function getFrontendBaseUrl(fallback = 'https://flamingo-store1.com'): string {
  const raw = process.env.FRONTEND_URL;
  const trimmed = raw?.trim().replace(/\/+$/, '');
  return trimmed || fallback;
}
