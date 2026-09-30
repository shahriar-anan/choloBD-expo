import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { HOME_DISTRICTS, HomeDistrict } from '../../constants/homePromos';
import { useLocationIdsByName } from '../../hooks/useHomeFeed';
import { HomeSectionHeader } from './HomeSectionHeader';
import PhotoCard from './PhotoCard';

const NAME_KEY = {
  coxsBazar: TRANSLATION_KEYS.HOME.DISTRICTS.COXS_BAZAR,
  rangamati: TRANSLATION_KEYS.HOME.DISTRICTS.RANGAMATI,
  bandarban: TRANSLATION_KEYS.HOME.DISTRICTS.BANDARBAN,
  sylhet: TRANSLATION_KEYS.HOME.DISTRICTS.SYLHET,
  khulna: TRANSLATION_KEYS.HOME.DISTRICTS.KHULNA,
} as const;

export default function PopularPlacesSection() {
  const router = useRouter();
  const { t } = useTranslation();
  const locationIds = useLocationIdsByName();
  const [lead, ...rest] = HOME_DISTRICTS;

  const openDistrict = (district: HomeDistrict) => {
    const locationId = district.matchNames.map((name) => locationIds[name]).find(Boolean);
    if (locationId) {
      router.push({
        pathname: '/(tabs)/explore/tour-spots-list',
        params: { locationId, fromHome: 'true' },
      });
      return;
    }
    router.push('/(tabs)/explore/tour-spots-list?fromHome=true');
  };

  const tile = (district: HomeDistrict, height: number) => (
    <PhotoCard
      imageUrl={district.imageUri}
      width="100%"
      height={height}
      title={t(NAME_KEY[district.nameKey])}
      onPress={() => openDistrict(district)}
    />
  );

  return (
    <View style={{ paddingTop: 22, paddingBottom: 4, paddingHorizontal: 16 }}>
      <HomeSectionHeader
        title={t(TRANSLATION_KEYS.HOME.POPULAR_PLACES)}
        onSeeAll={() => router.push('/(tabs)/explore/tour-spots-list?fromHome=true')}
      />
      {lead ? tile(lead, 168) : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        {rest.slice(0, 2).map((district) => (
          <View key={district.id} style={{ flex: 1 }}>
            {tile(district, 132)}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        {rest.slice(2, 4).map((district) => (
          <View key={district.id} style={{ flex: 1 }}>
            {tile(district, 132)}
          </View>
        ))}
      </View>
    </View>
  );
}
