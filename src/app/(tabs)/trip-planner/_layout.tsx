/**
 * Trip Planner Navigation Layout
 */

import { Stack, usePathname } from 'expo-router';
import { useTripPlannerTabBar } from '../../../hooks/useHideTabBar';
import { useIsTraveler } from '../../../hooks/useIsTraveler';

export default function TripPlannerLayout() {
  const pathname = usePathname();
  const traveler = useIsTraveler();
  useTripPlannerTabBar(pathname, traveler);

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
