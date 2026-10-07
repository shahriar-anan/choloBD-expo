import { Stack } from 'expo-router';

export default function TransportAdminCoachesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[layoutId]" />
      <Stack.Screen name="schedule" />
    </Stack>
  );
}
