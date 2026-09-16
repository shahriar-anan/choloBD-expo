/**
 * Google Sign-In Hook
 * Manages Google OAuth flow using expo-auth-session
 * Returns handlers and state for UI integration
 */

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { loginWithOAuth } from '@/store/slices/authSlice';
import { OAUTH_CONFIG } from '@/constants/oauth';
import { exchangeOAuthToken } from '@/services/api/oauth';
import { handleOAuthError, logOAuthError, showOAuthErrorAlert } from '@/utils/oauthUtils';

WebBrowser.maybeCompleteAuthSession();

// Optional Android Custom Tabs warm-up; ignore when no browser package is available
if (Platform.OS === 'android') {
  void WebBrowser.warmUpAsync().catch(() => undefined);
}

/**
 * Hook for Google Sign-In functionality
 * @returns Object with sign-in handler, loading state, and error state
 */
export function useGoogleSignIn() {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google auth request setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: OAUTH_CONFIG.GOOGLE_CLIENT_ID,
    iosClientId: OAUTH_CONFIG.GOOGLE_IOS_CLIENT_ID,
  });

  /**
   * Handle Google Sign-In
   * Opens native Google prompt or web fallback
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (__DEV__) {
        console.log('[useGoogleSignIn] Starting Google sign-in flow');
      }

      // Open Google auth prompt
      const result = await promptAsync();

      if (result?.type === 'success') {
        if (__DEV__) {
          console.log('[useGoogleSignIn] Google auth successful, received token');
        }

        // Extract ID token from response
        const idToken = result.authentication?.idToken;

        if (!idToken) {
          throw new Error('No ID token received from Google');
        }

        // Exchange token with backend
        if (__DEV__) {
          console.log('[useGoogleSignIn] Exchanging token with backend');
        }

        const tokenData = await exchangeOAuthToken('google', idToken);

        // Dispatch login action with exchanged tokens
        if (__DEV__) {
          console.log('[useGoogleSignIn] Dispatching loginWithOAuth');
        }

        const action = await dispatch(
          loginWithOAuth({
            provider: 'google',
            token: idToken,
          })
        );

        if (loginWithOAuth.rejected.match(action)) {
          throw new Error(action.payload as string);
        }

        if (__DEV__) {
          console.log('[useGoogleSignIn] Google sign-in completed successfully');
        }

        setError(null);
      } else if (result?.type === 'cancel') {
        const cancelMessage = handleOAuthError({ message: 'user_cancel' });
        setError(cancelMessage);

        if (__DEV__) {
          console.log('[useGoogleSignIn] Google sign-in cancelled by user');
        }
      } else if (result?.type === 'error') {
        const errorMsg = handleOAuthError(result.error);
        setError(errorMsg);

        if (__DEV__) {
          console.error('[useGoogleSignIn] Google sign-in error', result.error);
        }
      }
    } catch (e: any) {
      logOAuthError('signInWithGoogle', e);
      const errorMessage = handleOAuthError(e);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [promptAsync, dispatch]);

  return {
    signInWithGoogle,
    isLoading,
    error,
    isReady: !!request, // Request ready when config is loaded
  };
}
