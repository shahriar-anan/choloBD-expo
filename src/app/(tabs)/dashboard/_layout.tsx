import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { useDashboardBookingTabBar } from '../../../hooks/useHideTabBar';

export default function DashboardLayout() {
  const pathname = usePathname();
  useDashboardBookingTabBar(pathname);
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="user-bookings" />
      <Stack.Screen name="recent-bookings" />
      <Stack.Screen name="[bookingId]" />
    </Stack>
  );
}
