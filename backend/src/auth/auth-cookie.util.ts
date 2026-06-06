import type { CookieOptions, Response } from 'express';

export const FLA_AUTH_COOKIE = 'fla_token';

/** 7 days — must match JWT signOptions.expiresIn */
export const FLA_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function authCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    // Cross-origin: Netlify frontend → Render API needs SameSite=None
    sameSite: isProd ? 'none' : 'lax',
    maxAge: FLA_SESSION_MS,
    path: '/',
  };
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(FLA_AUTH_COOKIE, authCookieOptions());
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(FLA_AUTH_COOKIE, token, authCookieOptions());
}
