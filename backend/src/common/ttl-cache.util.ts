/**
 * Tiny in-process TTL cache. Safe under load balancers:
 * each instance keeps its own cache (no sticky session required).
 * Duplicate concurrent searches on one instance share one Mongo hit.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, { expires: number; value: T }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 200,
  ) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expires) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries) {
      const first = this.store.keys().next().value;
      if (first !== undefined) this.store.delete(first);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
