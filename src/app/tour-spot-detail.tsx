import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { theme } from '../constants/theme';
import { TRANSLATION_KEYS } from '../constants/translationKeys';
import { TourSpotDetailView } from '../components/tourSpots';
import { getTourSpotDetail } from '../services/api/tourSpots';
import { goBack } from '../utilities/navigation';

export default function TourSpotDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [spot, setSpot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

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
      if (__DEV__) console.error('[TourSpotDetailPage] Error loading spot:', err?.response?.data || err.message);
      setError(err?.message || 'Failed to load tour spot details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    goBack(router);
  };

  const handleRetry = () => {
    loadSpotDetail();
  };

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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-6 py-3 flex-row items-center justify-between border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={handleBack} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={primaryColor} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
            {spot.name}
          </Text>
        </View>
      </View>

      <TourSpotDetailView spot={spot} />
    </SafeAreaView>
  );
}
