/**
 * User Explore Interface Component
 * Displays explore options for regular users
 */

import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ExploreMainCard } from '../explore/ExploreMainCard';

console.log('[UserExploreInterface] Component loaded');

export function UserExploreInterface() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBookHotel = () => {
    console.log('[UserExploreInterface] Navigating to hotel search');
    router.push('/(tabs)/explore/hotel-search');
  };

  const handleBrowseTours = () => {
    console.log('[UserExploreInterface] Navigating to tour list');
    router.push('/(tabs)/trip-planner?tab=templates');
  };

  const handleCreateTripPlan = () => {
    console.log('[UserExploreInterface] Navigating to trip planner');
    router.push('/(tabs)/trip-planner?tab=mine');
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4 pb-6">
          <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
            Explore
          </Text>
          <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
            Discover amazing hotels and tours
          </Text>
        </View>

        <View className="px-6 pb-6">
          <ExploreMainCard
            title="Book a Hotel"
            description="Find and book your perfect stay"
            iconName="bed"
            colorKey="primary"
            onPress={handleBookHotel}
          />

          <ExploreMainCard
            title="Browse Tours"
            description="Explore exciting tour packages"
            iconName="map"
            colorKey="success"
            onPress={handleBrowseTours}
          />

          <ExploreMainCard
            title="Plan Your Trip"
            description="Create a custom trip itinerary"
            iconName="compass"
            colorKey="accent"
            onPress={handleCreateTripPlan}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default UserExploreInterface;
