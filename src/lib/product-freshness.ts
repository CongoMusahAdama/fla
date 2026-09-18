/** Products newer than this count as "New arrival" in the UI and API filter. */
export const NEW_ARRIVAL_MAX_AGE_DAYS = 30;

export function isNewArrivalProduct(createdAt?: string | Date | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const maxAgeMs = NEW_ARRIVAL_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - created <= maxAgeMs;
}
