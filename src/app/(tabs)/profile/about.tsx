import React from 'react';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ProfilePlaceholder } from '../../../components/profile/ProfilePlaceholder';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

export default function AboutScreen() {
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ProfilePlaceholder
      title={t(TRANSLATION_KEYS.PROFILE.ABOUT)}
      body={t(TRANSLATION_KEYS.PROFILE.ABOUT_BODY)}
      detail={t(TRANSLATION_KEYS.PROFILE.ABOUT_VERSION, { version })}
      icon="information-circle-outline"
    />
  );
}
