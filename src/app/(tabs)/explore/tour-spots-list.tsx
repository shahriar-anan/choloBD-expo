/**
 * Tour Spots List Page
 * Nested page under explore for browsing tour spots/attractions
 */

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useFetchTourSpots, TourSpot } from '../../../hooks/useFetchTourSpots';
import { useFetchLocations } from '../../../hooks/useFetchLocations';
import { TourSpotListCard, TourSpotFilters } from '../../../components/tourSpots';
import { TourSpotFilters as Filters } from '../../../services/api/tourSpots';

export default function TourSpotsListPage() {
  const router = useRouter();
  const { fromHome, locationId: locationIdParam } = useLocalSearchParams<{ fromHome?: string; locationId?: string }>();
  const locationId = typeof locationIdParam === 'string' ? locationIdParam : undefined;
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  const [filters, setFilters] = useState<Filters>(locationId ? { locationId } : {});
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { spots, isLoading, error } = useFetchTourSpots(filters);
  const { locations } = useFetchLocations();

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  const handleBack = () => {
    if (fromHome === 'true') {
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  };

  const handleSpotPress = (spot: TourSpot) => {
    router.push({
      pathname: '/(tabs)/explore/tour-spots-detail',
      params: { id: spot.id },
    });
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderSpotCard = ({ item }: { item: TourSpot }) => (
    <View className="px-4">
      <TourSpotListCard spot={item} onPress={() => handleSpotPress(item)} />
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12 px-6">
      <Ionicons name="map-outline" size={64} color={mutedColor} />
      <Text className="mt-4 text-lg font-semibold text-text dark:text-text-dark text-center">
        {t(TRANSLATION_KEYS.TOUR_SPOTS.NO_SPOTS)}
      </Text>
      <Text className="mt-2 text-sm text-muted dark:text-muted-dark text-center">
        {t(TRANSLATION_KEYS.TOUR_SPOTS.NO_SPOTS_DESC)}
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center py-12 px-6">
      <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
      <Text className="mt-4 text-lg font-semibold text-text dark:text-text-dark text-center">
        {error}
      </Text>
      <TouchableOpacity
        onPress={handleRefresh}
        style={{
          marginTop: 16,
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: primaryColor,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <View className="px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color={primaryColor} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TOUR_SPOTS.TITLE)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TOUR_SPOTS.SUBTITLE)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <TourSpotFilters
        locations={locations}
        currentFilters={filters}
        onFilterChange={setFilters}
      />

      {/* Results Count */}
      {!isLoading && !error && spots.length > 0 && (
        <View className="px-6 py-2">
          <Text className="text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TOUR_SPOTS.RESULTS_COUNT, { count: spots.length })}
          </Text>
        </View>
      )}

      {/* Content */}
      {error ? (
        renderErrorState()
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TOUR_SPOTS.LOADING)}
          </Text>
        </View>
      ) : (
        <FlatList
          key={refreshKey}
          data={spots}
          renderItem={renderSpotCard}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={primaryColor}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
