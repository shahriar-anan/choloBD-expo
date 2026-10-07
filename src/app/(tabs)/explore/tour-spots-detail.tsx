/**
 * Tour Spot Detail Page
 * Displays complete information for a single tour spot
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExplore } from './_provider';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TourSpotDetailView } from '../../../components/tourSpots';
import { getTourSpotDetail } from '../../../services/api/tourSpots';
import { goBack } from '../../../utilities/navigation';

export default function TourSpotDetailPage() {
  const router = useRouter();
  const { id, fromHome } = useLocalSearchParams<{ id: string; fromHome?: string }>();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { clearExploreState } = useExplore();

  const [spot, setSpot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  useEffect(() => {
    if (id) {
      loadSpotDetail();
    }
  }, [id]);

  const loadSpotDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTourSpotDetail(id!);
      setSpot(data);
    } catch (err: any) {
      console.error('[TourSpotDetailPage] Error loading spot:', err);
      setError(err?.message || 'Failed to load tour spot details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (fromHome === 'true') {
      try {
        clearExploreState();
      } catch (e) {
        // ignore if clearExploreState is not available
      }
    }
    goBack(router);
  };

  const handleRetry = () => {
    loadSpotDetail();
  };

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TOUR_SPOTS.LOADING_DETAILS)}
        </Text>
      </SafeAreaView>
    );
  }

  // Error State
  if (error || !spot) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
        <View className="px-6 pt-2 pb-4 flex-row items-center">
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color={primaryColor} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TOUR_SPOTS.DETAILS.ABOUT)}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text className="mt-4 text-lg font-semibold text-text dark:text-text-dark text-center">
            {error || 'Tour spot not found'}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
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
      </SafeAreaView>
    );
  }

  // Success State
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <View className="px-6 py-3 flex-row items-center justify-between border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={handleBack} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
            {spot.name}
          </Text>
        </View>
        {/* Future: Share button */}
        {/* <TouchableOpacity style={{ marginLeft: 12 }}>
          <Ionicons name="share-outline" size={24} color={primaryColor} />
        </TouchableOpacity> */}
      </View>

      {/* Content */}
      <TourSpotDetailView spot={spot} />
    </SafeAreaView>
  );
}
