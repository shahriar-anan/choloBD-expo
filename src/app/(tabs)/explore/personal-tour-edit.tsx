/**
 * Personal Tour Edit Screen
 * Screen for users to edit their custom tour packages
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { PersonalTourPackageForm } from '../../../components/personalTours';
import { useFetchLocations } from '../../../hooks/useFetchLocations';
import { useFetchTourSpots } from '../../../hooks/useFetchTourSpots';
import { useFetchActivitySpots } from '../../../hooks/useFetchActivitySpots';
import { usePersonalTourPlanLogic } from '../../../hooks/usePersonalTourPlanLogic';
import { getPersonalTourPlan } from '../../../services/api/tourBuilder';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

export default function PersonalTourEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tourId = params.tourId as string;
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { updatePlan } = usePersonalTourPlanLogic();

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const { locations, loading: locationsLoading } = useFetchLocations();
  const { spots: tourSpots, isLoading: tourSpotsLoading } = useFetchTourSpots();
  const { spots: activitySpots, isLoading: activitySpotsLoading } = useFetchActivitySpots();

  const [tourData, setTourData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTourData = async () => {
      if (!tourId) {
        Alert.alert('Error', 'Tour ID is missing');
        router.back();
        return;
      }

      try {
        const data = await getPersonalTourPlan(tourId);
        setTourData(data);
      } catch (error) {
        if (__DEV__) console.error('[PersonalTourEditScreen] Error loading tour:', error);
        Alert.alert('Error', 'Failed to load tour data');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadTourData();
  }, [tourId]);

  const handleBack = () => {
    router.back();
  };

  const handleUpdate = async (data: any) => {
    if (!tourId) return;

    setIsSubmitting(true);
    try {
      await updatePlan(tourId, data);
      Alert.alert('Success', 'Your custom tour package has been updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      if (__DEV__) console.error('[PersonalTourEditScreen] Error updating tour:', error);
      Alert.alert('Error', 'Failed to update tour package. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dataLoading = isLoading || locationsLoading || tourSpotsLoading || activitySpotsLoading;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      {/* Header with Back Button */}
      <View className="px-6 pt-6 pb-2 flex-row items-center border-b border-border dark:border-border-dark">
        <TouchableOpacity onPress={handleBack} className="mr-3">
          <Ionicons
            name="chevron-back"
            size={24}
            color={primaryColor}
          />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
            Edit Custom Tour
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            Update your personalized tour package
          </Text>
        </View>
      </View>

      {/* Main Content */}
      {dataLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
            Loading tour data...
          </Text>
        </View>
      ) : tourData ? (
        <PersonalTourPackageForm
          mode="edit"
          initialData={tourData}
          locations={locations || []}
          tourSpots={tourSpots || []}
          activitySpots={activitySpots || []}
          onSubmit={handleUpdate}
          onCancel={handleBack}
          isSubmitting={isSubmitting}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle" size={48} color={primaryColor} />
          <Text className="mt-4 text-lg font-semibold text-text dark:text-text-dark text-center">
            Failed to load tour data
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            className="mt-4 py-2 px-6 rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Text className="text-white font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
