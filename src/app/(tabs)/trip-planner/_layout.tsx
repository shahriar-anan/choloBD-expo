/**
 * Trip Planner Navigation Layout
 */

import { Stack, usePathname } from 'expo-router';
import { useTripPlannerTabBar } from '../../../hooks/useHideTabBar';

export default function TripPlannerLayout() {
  const pathname = usePathname();
  useTripPlannerTabBar(pathname);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="list" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
