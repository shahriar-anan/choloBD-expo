import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProfilePlaceholder } from '../../../components/profile/ProfilePlaceholder';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

export default function OffersScreen() {
  const { t } = useTranslation();

  return (
    <ProfilePlaceholder
      title={t(TRANSLATION_KEYS.PROFILE.OFFERS)}
      body={t(TRANSLATION_KEYS.PROFILE.OFFERS_BODY)}
      icon="pricetag-outline"
    />
  );
}
