/**
 * Personal Tour Create Screen
 * Screen for users to create their own custom tour packages
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { PersonalTourPackageForm } from '../../../components/personalTours';
import { useFetchLocations } from '../../../hooks/useFetchLocations';
import { useFetchTourSpots } from '../../../hooks/useFetchTourSpots';
import { useFetchActivitySpots } from '../../../hooks/useFetchActivitySpots';
import { usePersonalTourPlanLogic } from '../../../hooks/usePersonalTourPlanLogic';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

export default function PersonalTourCreateScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { createPlan } = usePersonalTourPlanLogic();

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const { locations, loading: locationsLoading } = useFetchLocations();
  const { spots: tourSpots, isLoading: tourSpotsLoading } = useFetchTourSpots();
  const { spots: activitySpots, isLoading: activitySpotsLoading } = useFetchActivitySpots();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = locationsLoading || tourSpotsLoading || activitySpotsLoading;

  const handleBack = () => {
    router.back();
  };

  const handleCreate = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createPlan(data);
      Alert.alert('Success', 'Your custom tour package has been created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      if (__DEV__) console.error('[PersonalTourCreateScreen] Error creating tour:', error);
      Alert.alert('Error', 'Failed to create tour package. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Create Custom Tour
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            Build your personalized tour package
          </Text>
        </View>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
            Loading tour data...
          </Text>
        </View>
      ) : (
        <PersonalTourPackageForm
          mode="create"
          locations={locations || []}
          tourSpots={tourSpots || []}
          activitySpots={activitySpots || []}
          onSubmit={handleCreate}
          onCancel={handleBack}
          isSubmitting={isSubmitting}
        />
      )}
    </SafeAreaView>
  );
}
