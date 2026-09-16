/**
 * Facebook Sign-In Hook
 * Manages Facebook OAuth flow using expo-auth-session (web browser flow)
 * Returns handlers and state for UI integration
 */

import { useCallback, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { loginWithOAuth } from '@/store/slices/authSlice';
import { OAUTH_CONFIG } from '@/constants/oauth';
import { exchangeOAuthToken } from '@/services/api/oauth';
import { handleOAuthError, logOAuthError } from '@/utils/oauthUtils';

WebBrowser.maybeCompleteAuthSession();

// Optional Android Custom Tabs warm-up; ignore when no browser package is available
if (Platform.OS === 'android') {
  void WebBrowser.warmUpAsync().catch(() => undefined);
}

/**
 * Hook for Facebook Sign-In functionality
 * Uses web browser flow for cross-platform compatibility
 * @returns Object with sign-in handler, loading state, and error state
 */
export function useFacebookSignIn() {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Facebook auth request setup
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: OAUTH_CONFIG.FACEBOOK_APP_ID,
  });

  /**
   * Handle Facebook Sign-In response
   * Called automatically when response changes
   */
  useEffect(() => {
    if (!response || isLoading) return;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (response.type === 'success') {
          if (__DEV__) {
            console.log('[useFacebookSignIn] Facebook auth successful');
          }

          // Extract access token
          const accessToken = response.authentication?.accessToken;

          if (!accessToken) {
            throw new Error('No access token received from Facebook');
          }

          if (__DEV__) {
            console.log('[useFacebookSignIn] Exchanging token with backend');
          }

          // Exchange token with backend
          await exchangeOAuthToken('facebook', accessToken);

          // Dispatch login action
          if (__DEV__) {
            console.log('[useFacebookSignIn] Dispatching loginWithOAuth');
          }

          const action = await dispatch(
            loginWithOAuth({
              provider: 'facebook',
              token: accessToken,
            })
          );

          if (loginWithOAuth.rejected.match(action)) {
            throw new Error(action.payload as string);
          }

          if (__DEV__) {
            console.log('[useFacebookSignIn] Facebook sign-in completed successfully');
          }

          setError(null);
        } else if (response.type === 'cancel') {
          const cancelMessage = handleOAuthError({ message: 'user_cancel' });
          setError(cancelMessage);

          if (__DEV__) {
            console.log('[useFacebookSignIn] Facebook sign-in cancelled');
          }
        } else if (response.type === 'error') {
          const errorMsg = handleOAuthError(response.error);
          setError(errorMsg);

          if (__DEV__) {
            console.error('[useFacebookSignIn] Facebook error', response.error);
          }
        }
      } catch (e: any) {
        logOAuthError('useFacebookSignIn', e);
        const errorMessage = handleOAuthError(e);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [response, dispatch, isLoading]);

  /**
   * Handle Facebook Sign-In
   * Opens web browser for Facebook authentication
   */
  const signInWithFacebook = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (__DEV__) {
        console.log('[useFacebookSignIn] Starting Facebook sign-in flow');
      }

      // Open Facebook auth prompt (web browser flow)
      await promptAsync();

      // Response handling is done in useEffect above
    } catch (e: any) {
      logOAuthError('signInWithFacebook', e);
      const errorMessage = handleOAuthError(e);
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [promptAsync]);

  return {
    signInWithFacebook,
    isLoading,
    error,
    isReady: !!request, // Request ready when config is loaded
  };
}
