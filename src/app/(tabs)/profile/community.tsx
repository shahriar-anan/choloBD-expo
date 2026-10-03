import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProfilePlaceholder } from '../../../components/profile/ProfilePlaceholder';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

export default function ProfileCommunityScreen() {
  const { t } = useTranslation();
  return <ProfilePlaceholder title={t(TRANSLATION_KEYS.PROFILE.COMMUNITY)} />;
}
