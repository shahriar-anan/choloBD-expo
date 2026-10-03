/**
 * Create a personal trip plan with the 3-step wizard.
 */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TripPlanCreateWizard } from '../../../components/tripPlanner/TripPlanCreateWizard';

function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw || undefined;
}

export default function TripPlannerCreate() {
  const router = useRouter();
  const params = useLocalSearchParams<{ templateId?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <TripPlanCreateWizard
        mode="create"
        templateId={readParam(params.templateId)}
        onCancel={() => router.back()}
        onSaved={(plan) => router.replace(`/(tabs)/trip-planner/${plan.id}`)}
      />
    </SafeAreaView>
  );
}
