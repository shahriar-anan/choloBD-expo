/**
 * Trip Planner Wizard Screen
 */

import React from 'react';
import { SafeAreaView, View, ActivityIndicator } from 'react-native';
import { useTripPlannerLogic } from '../../../hooks/useTripPlannerLogic';
import { TripPlanCreateWizard } from '../../../components/tripPlanner/TripPlanCreateWizard';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';

export default function TripPlannerWizard() {
  const { isDark } = useTheme();
  const { createTrip, isFormSubmitting } = useTripPlannerLogic();
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <TripPlanCreateWizard
        onCreate={async (payload) => {
          const trip = await createTrip(payload);
          return trip;
        }}
        isSubmitting={isFormSubmitting}
      />
      {isFormSubmitting && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      )}
    </SafeAreaView>
  );
}
