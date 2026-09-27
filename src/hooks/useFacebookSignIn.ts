/**
 * Facebook Sign-In Hook — social login blocked until backend JWT exchange exists.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';

export function useFacebookSignIn() {
  const { t } = useTranslation();
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithFacebook = useCallback(async () => {
    setError(t(TRANSLATION_KEYS.AUTH.LOGIN.SOCIAL_UNAVAILABLE));
  }, [t]);

  return {
    signInWithFacebook,
    isLoading,
    error,
    isReady: false,
  };
}
