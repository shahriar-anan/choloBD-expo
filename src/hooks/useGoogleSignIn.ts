/**
 * Google Sign-In Hook — social login blocked until backend JWT exchange exists.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';

export function useGoogleSignIn() {
  const { t } = useTranslation();
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setError(t(TRANSLATION_KEYS.AUTH.LOGIN.SOCIAL_UNAVAILABLE));
  }, [t]);

  return {
    signInWithGoogle,
    isLoading,
    error,
    isReady: false,
  };
}
