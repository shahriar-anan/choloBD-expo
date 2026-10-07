/**
 * My Tours Page
 * View all tour packages created by the service admin
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchTourPlansByAdmin } from '../../../store/slices/tourBuilderSlice';
import { TourListCard } from '../../../components/tourBuilder/TourListCard';
import { useTourBuilderLogic } from '../../../hooks/useTourBuilderLogic';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function MyToursPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { list, listLoading, listError } = useSelector((state: RootState) => state.tourBuilder);
  const { deleteTour } = useTourBuilderLogic();

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  // Fetch tours when page loads
  useEffect(() => {
    dispatch(fetchTourPlansByAdmin({}));
  }, [dispatch]);

  const handleBack = () => {
    goBack(router);
  };

  const handlePressTour = (tourId: string) => {
    router.push(`/(tabs)/explore/tour-detail?id=${tourId}`);
  };

  const handleEditTour = (tourId: string) => {
    router.push(`/(tabs)/explore/tour-edit?tourId=${tourId}`);
  };

  const handleDeleteTour = (tourId: string) => {
    Alert.alert(
      'Delete Tour',
      'Are you sure you want to delete this tour package? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTour(tourId);
              Alert.alert('Deleted', 'Tour package deleted successfully.');
            } catch {
              Alert.alert('Error', 'Failed to delete tour. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    router.push('/(tabs)/explore/tour-create');
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View className="px-6 pt-6 pb-2 flex-row items-center">
          <Ionicons
            name="chevron-back"
            size={24}
            color={primaryColor}
            onPress={handleBack}
          />
        </View>

        <View className="px-6 pb-4">
          <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.MY_TOURS_TITLE)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.MY_TOURS_SUBTITLE, { count: list?.length || 0 })}
          </Text>
          <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.CATALOG_LIST_NOTE)}
          </Text>
        </View>

        {/* Loading State */}
        {listLoading && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TOUR_BUILDER.LOADING_TOURS)}
            </Text>
          </View>
        )}

        {/* Error State */}
        {listError && (
          <View className="px-6 py-6 mx-6 rounded-lg border border-red-500 bg-red-50 dark:bg-red-900">
            <View className="flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text className="flex-1 text-sm text-red-600 dark:text-red-200 font-semibold">
                {listError.message}
              </Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!listLoading && (!list || list.length === 0) && (
          <View className="px-6 py-12 items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <Ionicons name="map" size={32} color={primaryColor} />
            </View>
            <Text className="text-lg font-bold text-text dark:text-text-dark text-center mb-2">
              {t(TRANSLATION_KEYS.TOUR_BUILDER.NO_TOURS_TITLE)}
            </Text>
            <Text className="text-sm text-muted dark:text-muted-dark text-center mb-6">
              {t(TRANSLATION_KEYS.TOUR_BUILDER.NO_TOURS_DESC)}
            </Text>
            <TouchableOpacity
              className="py-3 px-6 rounded-lg active:opacity-80"
              style={{ backgroundColor: primaryColor }}
              onPress={handleCreateNew}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="add" size={18} color="#fff" />
                <Text className="text-white font-bold text-base">{t(TRANSLATION_KEYS.TOUR_BUILDER.CREATE_TOUR_BTN)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Tours List */}
        {!listLoading && list && list.length > 0 && (
          <View className="px-2 pb-6">
            {list.map((tour) => (
              <TourListCard
                key={tour.id}
                tour={tour}
                onPress={handlePressTour}
                onEdit={handleEditTour}
                onDelete={handleDeleteTour}
                showAdminActions={true}
              />
            ))}
          </View>
        )}

        {/* Create Tour Button (Footer) */}
        {!listLoading && list && list.length > 0 && (
          <View className="px-6 pb-8">
            <TouchableOpacity
              className="py-3.5 rounded-lg flex-row items-center justify-center gap-2 active:opacity-80"
              style={{ backgroundColor: primaryColor }}
              onPress={handleCreateNew}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text className="text-white font-bold text-base">{t(TRANSLATION_KEYS.TOUR_BUILDER.CREATE_NEW_TOUR_BTN)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
