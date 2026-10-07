/**
 * Edit an existing personal trip plan with the same wizard used to create one.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TripPlanCreateWizard, WizardInitial } from '../../../components/tripPlanner/TripPlanCreateWizard';
import { getTripDetails } from '../../../services/api/tripPlanner';
import { durationFromTrip, tripPlanToWizardStops } from '../../../services/api/personalPlanMapping';
import { toDateInputValue } from '../../../utils/tripPlanItinerary';
import { TripPlan } from '../../../types/trips';
import { goBack } from '../../../utilities/navigation';

export default function TripPlannerEdit() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const planId = typeof params.id === 'string' ? params.id : '';
  const [initial, setInitial] = useState<WizardInitial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setError(t(TRANSLATION_KEYS.TRIP_PLANNER.TRIP_NOT_FOUND_FALLBACK));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const trip: TripPlan = await getTripDetails(planId);
        if (cancelled) return;
        setInitial({
          packageName: trip.name,
          shortDescription: trip.shortDescription || trip.description || '',
          tourType: trip.tourType || '',
          locationId: trip.primaryLocationId,
          startDate: toDateInputValue(trip.startDate),
          duration: durationFromTrip(trip),
          totalBudget: trip.estimatedBudget,
          basedOnPackageId: trip.basedOnPackageId,
          stops: tripPlanToWizardStops(trip),
          images: trip.images,
        });
      } catch (loadError: any) {
        if (!cancelled) setError(loadError?.message || t(TRANSLATION_KEYS.TRIP_PLANNER.TRIP_NOT_FOUND_FALLBACK));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId, t]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      {!initial && !error ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-error">{error}</Text>
        </View>
      ) : (
        <TripPlanCreateWizard
          mode="edit"
          planId={planId}
          initial={initial || undefined}
          onCancel={() => goBack(router)}
          onSaved={() => goBack(router)}
        />
      )}
    </SafeAreaView>
  );
}
