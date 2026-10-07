/**
 * Tour Edit Page
 * Nested page under explore for service admins to edit tour packages
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchTourPlanDetail } from '../../../store/slices/tourBuilderSlice';
import { TourBuilderForm } from '../../../components/tourBuilder/TourBuilderForm';
import { ErrorAlert } from '../../../components/tourBuilder/ErrorAlert';
import { UpdateTourPlanData } from '../../../types/tours';
import { useTourBuilderLogic } from '../../../hooks/useTourBuilderLogic';
import { useExplore } from './_provider';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function TourEditPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tourId } = useLocalSearchParams<{ tourId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { locations } = useExplore();

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  // Get tour detail from Redux store
  const { detail, detailLoading } = useSelector(
    (state: RootState) => state.tourBuilder
  );

  // Get update function from hook
  const { updateTour, isFormSubmitting, formError } = useTourBuilderLogic();

  useEffect(() => {
    if (tourId) {
      dispatch(fetchTourPlanDetail(tourId));
    }
  }, [tourId, dispatch]);

  const handleBack = () => {
    goBack(router);
  };

  const handleEditTour = async (data: UpdateTourPlanData | any) => {
    if (!tourId) {
      console.error('[TourEditPage] No tourId provided');
      return;
    }

    try {
      await updateTour(tourId, data);
      goBack(router);
    } catch (error) {
      if (__DEV__) console.error('[TourEditPage] Error updating tour:', error);
      // Error is stored in Redux state and shown via ErrorAlert
    }
  };

  // Show loading state if detail is loading
  if (detailLoading || !detail) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark flex items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TOUR_BUILDER.LOADING_DETAILS)}
        </Text>
      </SafeAreaView>
    );
  }

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
            {t(TRANSLATION_KEYS.TOUR_BUILDER.EDIT_TOUR_TITLE)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TOUR_BUILDER.EDIT_TOUR_SUBTITLE)}
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
          {locations && locations.length > 0 && detail ? (
            <TourBuilderForm
              locations={locations}
              initialData={detail}
              isEditing={true}
              onSubmit={handleEditTour}
              isSubmitting={isFormSubmitting}
            />
          ) : (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={primaryColor} />
              <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TOUR_BUILDER.LOADING_LOCATIONS)}
              </Text>
            </View>
          )}
        </View>
    </SafeAreaView>
  );
}
