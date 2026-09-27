/**
 * OAuth API Service — social sign-in is disabled until the backend exposes mobile JWT exchange.
 */

import { AuthUser } from '@/types/auth';
import { OAuthProvider } from '@/constants/oauth';

const SOCIAL_UNAVAILABLE_MESSAGE =
  'Google and Facebook sign-in are not available in this app version. Use email and password.';

export async function exchangeOAuthToken(
  _provider: OAuthProvider,
  _token: string
): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
  throw new Error(SOCIAL_UNAVAILABLE_MESSAGE);
}

export async function validateOAuthToken(
  _provider: OAuthProvider,
  _token: string
): Promise<boolean> {
  return false;
}
