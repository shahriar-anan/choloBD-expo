/**
 * Trip Details/Management Screen
 * Phase 4: Overview section + horizontal tab navigation
 * Tabs: Hotels, Day Plan, Transport, Itinerary
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useTripPlannerLogic } from '../../../hooks/useTripPlannerLogic';
import { TripOverview } from '../../../components/tripPlanner/TripOverview';
import { HotelsTab } from '../../../components/tripPlanner/tabs/HotelsTab';
import { DayPlanTab } from '../../../components/tripPlanner/tabs/DayPlanTab';
import { TransportTab } from '../../../components/tripPlanner/tabs/TransportTab';
import { ItineraryTab } from '../../../components/tripPlanner/tabs/ItineraryTab';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';

type TabName = 'hotels' | 'dayplan' | 'transport' | 'itinerary';

const TAB_NAMES: { key: TabName; labelKey: string; icon: string }[] = [
  { key: 'hotels', labelKey: TRANSLATION_KEYS.TRIP_PLANNER.TAB_HOTELS, icon: 'home' },
  { key: 'dayplan', labelKey: TRANSLATION_KEYS.TRIP_PLANNER.TAB_DAY_PLAN, icon: 'map' },
  { key: 'transport', labelKey: TRANSLATION_KEYS.TRIP_PLANNER.TAB_TRANSPORT, icon: 'truck' },
  { key: 'itinerary', labelKey: TRANSLATION_KEYS.TRIP_PLANNER.TAB_ITINERARY, icon: 'list' },
];

export default function TripDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { currentTrip, isTripLoading, tripError, loadTripDetail } = useTripPlannerLogic();
  const [activeTab, setActiveTab] = useState<TabName>('hotels');

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadTripDetail(id);
    }
  }, [id]);

  if (isTripLoading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator size="large" color={primaryColor} />
      </SafeAreaView>
    );
  }

  if (tripError) {
    const isForbidden = tripError.type === 'FORBIDDEN' || tripError.statusCode === 403;
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center px-6 pt-4 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="chevron-left" size={24} color={primaryColor} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRIP_PLANNER.TRIP_DETAILS_TITLE)}</Text>
        </View>
        <View className="items-center justify-center flex-1 px-6">
          <Feather name={isForbidden ? 'lock' : 'alert-circle'} size={48} color={mutedColor} />
          <Text className="mt-4 text-lg font-semibold text-center text-text dark:text-text-dark">
            {isForbidden ? t(TRANSLATION_KEYS.TRIP_PLANNER.ACCESS_DENIED) : t(TRANSLATION_KEYS.TRIP_PLANNER.TRIP_NOT_FOUND)}
          </Text>
          <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
            {isForbidden
              ? t(TRANSLATION_KEYS.TRIP_PLANNER.ACCESS_DENIED_MESSAGE)
              : tripError.message}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-8 py-3 mt-6 rounded-lg bg-primary"
          >
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRIP_PLANNER.GO_BACK)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentTrip) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <Text className="text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRIP_PLANNER.TRIP_NOT_FOUND_FALLBACK)}</Text>
      </SafeAreaView>
    );
  }

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'hotels':
        return <HotelsTab trip={currentTrip} />;
      case 'dayplan':
        return <DayPlanTab trip={currentTrip} />;
      case 'transport':
        return <TransportTab trip={currentTrip} />;
      case 'itinerary':
        return <ItineraryTab trip={currentTrip} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-6 pt-4 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="chevron-left" size={24} color={primaryColor} />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-text dark:text-text-dark" numberOfLines={1}>
            {currentTrip.name}
          </Text>
        </View>

        {/* Trip Overview Section */}
        <TripOverview trip={currentTrip} />

        {/* Horizontal Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-6">
          <View className="flex-row px-6 gap-6">
            {TAB_NAMES.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="items-center py-3 min-w-[72px]"
                style={{
                  borderBottomWidth: activeTab === tab.key ? 2 : 0,
                  borderBottomColor: activeTab === tab.key ? primaryColor : 'transparent',
                }}
              >
                <Feather
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? primaryColor : mutedColor}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  className={`text-xs font-semibold text-center ${
                    activeTab === tab.key
                      ? 'text-primary dark:text-primary-dark'
                      : 'text-muted dark:text-muted-dark'
                  }`}
                >
                  {t(tab.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Tab Content */}
        <View className="px-6 py-6 pb-12">
          {renderTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
