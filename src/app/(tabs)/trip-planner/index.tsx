/**
 * Trip Planner Index
 * Shows all user trips with option to create new trip
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useTripPlannerLogic } from '../../../hooks/useTripPlannerLogic';

export default function TripPlannerIndex() {
  const router = useRouter();
  const { t } = useTranslation();
  const { trips, isTripsLoading, tripsError, loadTrips, deleteTrip } = useTripPlannerLogic();

  useEffect(() => {
    loadTrips();
  }, []);

  const handleCreateNew = () => {
    router.push('/(tabs)/trip-planner/create');
  };

  const handleTripPress = (tripId: string) => {
    router.push(`/(tabs)/trip-planner/${tripId}`);
  };

  const handleDeleteTrip = (tripId: string, tripName: string) => {
    Alert.alert(
      t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_TRIP_TITLE),
      t(TRANSLATION_KEYS.TRIP_PLANNER.DELETE_TRIP_MESSAGE, { name: tripName }),
      [
        { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
        {
          text: t(TRANSLATION_KEYS.COMMON.DELETE),
          style: 'destructive',
          onPress: () => deleteTrip(tripId),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.MY_TRIPS_TITLE)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.MY_TRIPS_SUBTITLE)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleCreateNew}
          className="bg-primary rounded-full p-3"
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isTripsLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : tripsError ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-center text-error dark:text-error-dark mb-4">
            {tripsError.message}
          </Text>
          <TouchableOpacity
            onPress={() => loadTrips()}
            className="px-6 py-3 bg-primary rounded-lg"
          >
            <Text className="text-onPrimary font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.RETRY)}</Text>
          </TouchableOpacity>
        </View>
      ) : trips.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Feather name="map" size={48} color="#9CA3AF" />
          <Text className="mt-4 text-lg font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.NO_TRIPS_TITLE)}
          </Text>
          <Text className="mt-2 text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.NO_TRIPS_SUBTITLE)}
          </Text>
          <TouchableOpacity
            onPress={handleCreateNew}
            className="mt-6 px-8 py-3 bg-primary rounded-lg"
          >
            <Text className="text-onPrimary font-semibold">{t(TRANSLATION_KEYS.TRIP_PLANNER.CREATE_TRIP_BTN)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pb-6" showsVerticalScrollIndicator={false}>
          {trips.map((trip) => (
            <View
              key={trip.id}
              className="flex-row items-stretch mb-4 overflow-hidden border rounded-lg bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
            >
              {/* Main tappable area */}
              <TouchableOpacity
                onPress={() => handleTripPress(trip.id)}
                activeOpacity={0.7}
                className="flex-1 p-4"
              >
                <Text className="text-lg font-bold text-text dark:text-text-dark">
                  {trip.name}
                </Text>
                <Text className="text-xs text-muted dark:text-muted-dark mt-1">
                  {trip.primaryLocation.name}
                </Text>
                <View className="mt-3 flex-row items-center">
                  <View className="bg-primary/10 dark:bg-primary-dark/10 px-3 py-1 rounded">
                    <Text className="text-xs font-semibold text-primary dark:text-primary-dark">
                      {trip.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Delete button */}
              <TouchableOpacity
                onPress={() => handleDeleteTrip(trip.id, trip.name)}
                activeOpacity={0.7}
                className="items-center justify-center px-4 border-l border-border dark:border-border-dark"
              >
                <Feather name="trash-2" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
