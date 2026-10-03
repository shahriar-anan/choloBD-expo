/**
 * Explore Interface Component
 * Main explore page for browsing hotels and tours
 * Supports both user and admin views
 * Language changes are automatically reflected
 */

import React, { useMemo } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../providers/LanguageProvider';
import { ExploreMainCard } from './ExploreMainCard';
import { TourBuilderCard } from '../tourBuilder/TourBuilderCard';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface ExploreInterfaceProps {
  isAdmin?: boolean;
}

export function ExploreInterface({ isAdmin = false }: ExploreInterfaceProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // Memoize navigation handlers to prevent unnecessary recreations
  const navigationHandlers = useMemo(
    () => ({
      handleBookHotel: () => router.push('/(tabs)/explore/hotel-search'),
      handleBrowseAttractions: () => router.push('/(tabs)/explore/attractions?tab=places'),
      handleBrowseTours: () => router.push('/(tabs)/explore/tour-list'),
      handleCreateTripPlan: () => router.push('/(tabs)/trip-planner'),
      handleCreateTours: () => router.push('/(tabs)/explore/tour-create'),
      handleMyTours: () => router.push('/(tabs)/explore/my-tours'),
    }),
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
            {isAdmin
              ? t(TRANSLATION_KEYS.EXPLORE.TITLE_WITH_MANAGE)
              : t(TRANSLATION_KEYS.EXPLORE.TITLE)}
          </Text>
          <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
            {isAdmin
              ? t(TRANSLATION_KEYS.EXPLORE.SUBTITLE_ADMIN)
              : t(TRANSLATION_KEYS.EXPLORE.SUBTITLE_USER)}
          </Text>
        </View>

        {/* Cards Section */}
        <View className="px-6 pb-6">
          {/* Book Hotel Card */}
          <ExploreMainCard
            title={t(TRANSLATION_KEYS.EXPLORE.CARDS.BOOK_HOTEL)}
            description={t(TRANSLATION_KEYS.EXPLORE.CARDS.BOOK_HOTEL_DESC)}
            iconName="bed"
            colorKey="primary"
            onPress={navigationHandlers.handleBookHotel}
          />

          {/* Browse Attractions Card */}
          <ExploreMainCard
            title={t(TRANSLATION_KEYS.EXPLORE.CARDS.BROWSE_TOUR_SPOTS)}
            description={t(TRANSLATION_KEYS.EXPLORE.CARDS.BROWSE_TOUR_SPOTS_DESC)}
            iconName="location"
            colorKey="accent"
            onPress={navigationHandlers.handleBrowseAttractions}
          />

          {/* Browse Tours Card */}
          <ExploreMainCard
            title={t(TRANSLATION_KEYS.EXPLORE.CARDS.BROWSE_TOURS)}
            description={
              isAdmin
                ? t(TRANSLATION_KEYS.EXPLORE.CARDS.BROWSE_TOURS_DESC_ADMIN)
                : t(TRANSLATION_KEYS.EXPLORE.CARDS.BROWSE_TOURS_DESC)
            }
            iconName="map"
            colorKey="success"
            onPress={navigationHandlers.handleBrowseTours}
          />

          {/* Admin or User Specific Section */}
          {isAdmin ? (
            <>
              {/* Create Tours Card */}
              <TourBuilderCard
                subtitle={t(TRANSLATION_KEYS.EXPLORE.CARDS.CREATE_TOURS_DESC)}
                onPress={navigationHandlers.handleCreateTours}
              />

              {/* My Tours Card */}
              <ExploreMainCard
                title={t(TRANSLATION_KEYS.EXPLORE.CARDS.MY_TOURS)}
                description={t(TRANSLATION_KEYS.EXPLORE.CARDS.MY_TOURS_DESC)}
                iconName="list"
                colorKey="warning"
                onPress={navigationHandlers.handleMyTours}
              />
            </>
          ) : (
            /* Plan Trip Card */
            <ExploreMainCard
              title={t(TRANSLATION_KEYS.EXPLORE.CARDS.PLAN_TRIP)}
              description={t(TRANSLATION_KEYS.EXPLORE.CARDS.PLAN_TRIP_DESC)}
              iconName="compass"
              colorKey="warning"
              onPress={navigationHandlers.handleCreateTripPlan}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ExploreInterface;
