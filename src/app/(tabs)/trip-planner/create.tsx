/**
 * Create a personal trip plan with the 3-step wizard.
 */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TripPlanCreateWizard } from '../../../components/tripPlanner/TripPlanCreateWizard';

export default function TripPlannerCreate() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <TripPlanCreateWizard
        mode="create"
        onCancel={() => router.back()}
        onSaved={(plan) => router.replace(`/(tabs)/trip-planner/${plan.id}`)}
      />
    </SafeAreaView>
  );
}
