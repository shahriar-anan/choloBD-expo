/**
 * OAuth Utility Functions
 * Helper functions for OAuth error handling, validation, and state management
 */

import { appAlert } from '../components/ui/appAlert';
import { TRANSLATION_KEYS } from '../constants/translationKeys';
import i18next from 'i18next';

/**
 * Maps OAuth errors to user-friendly messages
 * @param error - The error object from OAuth provider or API
 * @returns User-friendly error message
 */
export function handleOAuthError(error: any): string {
  if (!error) {
    return i18next.t(TRANSLATION_KEYS.AUTH.LOGIN.OAUTH_ERROR);
  }

  // User cancelled the OAuth prompt
  if (error.message?.includes('cancel') || error.message?.includes('user_cancel')) {
    return i18next.t(TRANSLATION_KEYS.AUTH.LOGIN.OAUTH_CANCELLED);
  }

  // Network/connection errors
  if (error.message?.includes('timeout') || error.message?.includes('network')) {
    return i18next.t('common.networkError') || 'Network error. Please check your connection.';
  }

  // OAuth-specific errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return i18next.t(TRANSLATION_KEYS.AUTH.LOGIN.OAUTH_ERROR);
}

/**
 * Validates OAuth token format
 * @param token - The token to validate
 * @returns Whether token is valid format
 */
export function isValidOAuthToken(token: string): boolean {
  // JWT tokens have 3 parts separated by dots
  const parts = token?.split('.') || [];
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Generates OAuth state parameter for CSRF protection
 * @returns Random state string
 */
export function generateOAuthState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Validates OAuth response from redirect
 * @param response - Response object to validate
 * @returns Whether response is valid
 */
export function validateOAuthResponse(response: any): boolean {
  if (!response) return false;

  const { token } = response;

  if (!token) return false;

  return isValidOAuthToken(token);
}

/**
 * Show error alert to user
 * @param title - Alert title
 * @param message - Alert message
 */
export function showOAuthErrorAlert(title: string, message: string): void {
  void appAlert(title, message, undefined, 'error');
}

/**
 * Log OAuth errors in development mode
 * @param source - Where the error occurred
 * @param error - The error object
 */
export function logOAuthError(source: string, error: any): void {
  if (__DEV__) {
    console.error(`[OAuth:${source}]`, {
      message: error?.message,
      response: error?.response?.data,
      code: error?.code,
      originalError: error,
    });
  }
}
