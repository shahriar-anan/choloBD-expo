/**
 * Tour Create Page
 * Nested page under explore for service admins to create tour packages
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { createTourPlanAsync } from '../../../store/slices/tourBuilderSlice';
import { TourBuilderForm } from '../../../components/tourBuilder/TourBuilderForm';
import { ErrorAlert } from '../../../components/tourBuilder/ErrorAlert';
import { CreateTourPlanData } from '../../../types/tours';
import { useExplore } from './_provider';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function TourCreatePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { formError, formLoading } = useSelector((state: RootState) => state.tourBuilder);
  const { locations } = useExplore();

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const handleBack = () => {
    goBack(router);
  };

  const handleCreateTour = async (data: CreateTourPlanData | any) => {
    try {
      await dispatch(createTourPlanAsync(data)).unwrap();
      goBack(router);
    } catch (error) {
      if (__DEV__) console.error('[TourCreatePage] Error creating tour:', error);
      // Error is stored in Redux state and shown via ErrorAlert
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
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
            {t(TRANSLATION_KEYS.TOUR_BUILDER.CREATE_PAGE_TITLE)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.CREATE_PAGE_SUBTITLE)}
          </Text>
        </View>

        {/* Main Form Error Alert */}
        {formError && (
          <View className="px-6 mb-4">
            <ErrorAlert error={formError} onDismiss={() => {}} />
          </View>
        )}

        {/* Tour Builder Form */}
        <View className="flex-1 px-4 pb-6">
          {locations && locations.length > 0 ? (
            <TourBuilderForm
              locations={locations}
              onSubmit={handleCreateTour}
              isSubmitting={formLoading}
            />
          ) : (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={primaryColor} />
              <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
                Loading locations...
              </Text>
            </View>
          )}
        </View>
    </SafeAreaView>
  );
}
