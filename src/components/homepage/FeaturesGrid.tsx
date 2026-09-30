import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import FeatureCard from './FeatureCard';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof import('@expo/vector-icons').Feather.glyphMap;
  variant: 'primary' | 'secondary' | 'accent';
  route?: string;
}

export default function FeaturesGrid() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // Memoize features array to regenerate when language changes
  const FEATURES: Feature[] = useMemo(
    () => [
      {
        id: 'smart-tours',
        title: t(TRANSLATION_KEYS.HOME.FEATURES.SMART_TOURS),
        description: t(TRANSLATION_KEYS.HOME.FEATURES.SMART_TOURS_DESC),
        icon: 'map',
        variant: 'primary' as const,
        route: '/explore',
      },
      {
        id: 'hotel-book',
        title: t(TRANSLATION_KEYS.HOME.FEATURES.HOTEL_BOOK),
        description: t(TRANSLATION_KEYS.HOME.FEATURES.HOTEL_BOOK_DESC),
        icon: 'home',
        variant: 'secondary' as const,
        route: '/explore',
      },
      {
        id: 'ride-tickets',
        title: t(TRANSLATION_KEYS.HOME.FEATURES.RIDE_TICKETS),
        description: t(TRANSLATION_KEYS.HOME.FEATURES.RIDE_TICKETS_DESC),
        icon: 'truck',
        variant: 'accent' as const,
        route: '/(tabs)/explore/transport-search',
      },
      {
        id: 'find-buddies',
        title: t(TRANSLATION_KEYS.HOME.FEATURES.FIND_BUDDIES),
        description: t(TRANSLATION_KEYS.HOME.FEATURES.FIND_BUDDIES_DESC),
        icon: 'users',
        variant: 'primary' as const,
        route: '/explore',
      },
      {
        id: 'wallet-deals',
        title: t(TRANSLATION_KEYS.HOME.FEATURES.WALLET_DEALS),
        description: t(TRANSLATION_KEYS.HOME.FEATURES.WALLET_DEALS_DESC),
        icon: 'credit-card',
        variant: 'secondary' as const,
        route: '/(shop)/wallet',
      },
      {
        id: 'local-guides',
        title: t(TRANSLATION_KEYS.HOME.FEATURES.LOCAL_GUIDES),
        description: t(TRANSLATION_KEYS.HOME.FEATURES.LOCAL_GUIDES_DESC),
        icon: 'compass',
        variant: 'accent' as const,
        route: '/explore',
      },
    ],
    [t, currentLanguage]
  );

  const handleFeaturePress = (feature: Feature) => {
    if (feature.route) {
      router.push(feature.route);
    }
  };

  return (
    <View className="px-4 py-6 bg-white dark:bg-neutral-950">
      <View className="gap-4">
        {/* Row 1 */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FeatureCard
              title={FEATURES[0].title}
              description={FEATURES[0].description}
              icon={FEATURES[0].icon}
              variant={FEATURES[0].variant}
              onPress={() => handleFeaturePress(FEATURES[0])}
            />
          </View>
          <View className="flex-1">
            <FeatureCard
              title={FEATURES[1].title}
              description={FEATURES[1].description}
              icon={FEATURES[1].icon}
              variant={FEATURES[1].variant}
              onPress={() => handleFeaturePress(FEATURES[1])}
            />
          </View>
        </View>

        {/* Row 2 */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FeatureCard
              title={FEATURES[2].title}
              description={FEATURES[2].description}
              icon={FEATURES[2].icon}
              variant={FEATURES[2].variant}
              onPress={() => handleFeaturePress(FEATURES[2])}
            />
          </View>
          <View className="flex-1">
            <FeatureCard
              title={FEATURES[3].title}
              description={FEATURES[3].description}
              icon={FEATURES[3].icon}
              variant={FEATURES[3].variant}
              onPress={() => handleFeaturePress(FEATURES[3])}
            />
          </View>
        </View>

        {/* Row 3 */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <FeatureCard
              title={FEATURES[4].title}
              description={FEATURES[4].description}
              icon={FEATURES[4].icon}
              variant={FEATURES[4].variant}
              onPress={() => handleFeaturePress(FEATURES[4])}
            />
          </View>
          <View className="flex-1">
            <FeatureCard
              title={FEATURES[5].title}
              description={FEATURES[5].description}
              icon={FEATURES[5].icon}
              variant={FEATURES[5].variant}
              onPress={() => handleFeaturePress(FEATURES[5])}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
