/**
 * Trip Planner Navigation Layout
 */

import { Stack } from 'expo-router';

export default function TripPlannerLayout() {
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
