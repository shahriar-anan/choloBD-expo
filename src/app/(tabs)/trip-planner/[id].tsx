/**
 * Personal trip detail. One scrolling page, matching the web tour post view.
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useTripPlannerLogic } from '../../../hooks/useTripPlannerLogic';
import { TripPlanDetailView } from '../../../components/tripPlanner/TripPlanDetailView';

export default function TripDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { currentTrip, isTripLoading, tripError, loadTripDetail } = useTripPlannerLogic();
  const tripId = typeof id === 'string' ? id : '';

  useEffect(() => {
    if (tripId) loadTripDetail(tripId);
  }, [tripId]);

  if (isTripLoading || (!currentTrip && !tripError)) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (tripError || !currentTrip) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark px-6 justify-center">
        <Text className="text-lg font-semibold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.TRIP_NOT_FOUND_FALLBACK)}
        </Text>
        <Text className="text-muted mt-2">{tripError?.message}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary rounded-lg py-3 items-center">
          <Text className="text-onPrimary font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BACK)}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <TripPlanDetailView
        trip={currentTrip}
        onEdit={() => router.push({ pathname: '/(tabs)/trip-planner/edit', params: { id: currentTrip.id } })}
        onBack={() => router.back()}
      />
    </SafeAreaView>
  );
}
