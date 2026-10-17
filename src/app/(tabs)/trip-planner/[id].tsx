/**
 * Personal trip detail. One scrolling page, matching the web tour post view.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useTripPlannerLogic } from '../../../hooks/useTripPlannerLogic';
import { TripPlanDetailView } from '../../../components/tripPlanner/TripPlanDetailView';
import { deleteTrip } from '../../../services/api/tripPlanner';
import { goBack } from '../../../utilities/navigation';

export default function TripDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; saved?: string }>();
  const { t } = useTranslation();
  const { currentTrip, isTripLoading, tripError, loadTripDetail } = useTripPlannerLogic();
  const tripId = typeof params.id === 'string' ? params.id : '';
  const [refreshing, setRefreshing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(params.saved === '1');

  useEffect(() => {
    if (params.saved !== '1') return;
    setSavedNotice(true);
    router.setParams({ saved: '' });
  }, [params.saved, router]);

  useFocusEffect(
    useCallback(() => {
      if (tripId) loadTripDetail(tripId);
    }, [tripId])
  );

  const refresh = async () => {
    if (!tripId) return;
    setRefreshing(true);
    try {
      await loadTripDetail(tripId);
    } finally {
      setRefreshing(false);
    }
  };

  const confirmDelete = () => {
    if (!currentTrip) return;
    Alert.alert(
      t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_DELETE_TITLE),
      t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_DELETE_BODY),
      [
        { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
        {
          text: t(TRANSLATION_KEYS.COMMON.DELETE),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip(currentTrip.id);
              goBack(router);
            } catch (error: any) {
              Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), error?.message || t(TRANSLATION_KEYS.COMMON.ERROR));
            }
          },
        },
      ]
    );
  };

  if (isTripLoading || (!currentTrip && !tripError)) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark px-4 pt-6">
        <View className="h-64 rounded-2xl bg-surface dark:bg-surface-dark" />
        <View className="h-16 rounded-2xl bg-surface dark:bg-surface-dark mt-4" />
        <View className="h-28 rounded-2xl bg-surface dark:bg-surface-dark mt-4" />
        <ActivityIndicator className="mt-6" />
      </SafeAreaView>
    );
  }

  if (tripError || !currentTrip) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark px-6 justify-center">
        <Text className="text-lg font-semibold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.TRIP_NOT_FOUND_FALLBACK)}
        </Text>
        <Text className="text-muted dark:text-muted-dark mt-2">{tripError?.message}</Text>
        <TouchableOpacity
          onPress={() => tripId && loadTripDetail(tripId)}
          className="mt-4 bg-primary rounded-lg py-3 items-center"
          style={{ minHeight: 44 }}
        >
          <Text className="text-onPrimary font-semibold">{t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goBack(router)} className="mt-3 py-3 items-center" style={{ minHeight: 44 }}>
          <Text className="text-primary font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_BACK)}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <TripPlanDetailView
        trip={currentTrip}
        refreshing={refreshing}
        savedNotice={savedNotice}
        onDismissSaved={() => setSavedNotice(false)}
        onRefresh={refresh}
        onDelete={confirmDelete}
        onEdit={() => router.push({ pathname: '/(tabs)/trip-planner/edit', params: { id: currentTrip.id } })}
        onEditDay={(day) =>
          router.push({ pathname: '/(tabs)/trip-planner/edit', params: { id: currentTrip.id, day: String(day) } })
        }
        onBack={() => goBack(router)}
      />
    </SafeAreaView>
  );
}
