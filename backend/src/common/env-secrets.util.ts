/** JWT signing secret — never use a hardcoded value in production. */
export function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'fla-dev-only-jwt-secret';
}

export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const missing: string[] = [];
  if (!process.env.MONGO_URI?.trim()) missing.push('MONGO_URI');
  if (!process.env.JWT_SECRET?.trim()) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required production env: ${missing.join(', ')}`);
  }
}
