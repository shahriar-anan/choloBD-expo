import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { usePathTabBar } from '../../../hooks/useHideTabBar';

function isBookingsIndex(pathname: string): boolean {
  return pathname === '/bookings' || pathname.endsWith('/bookings');
}

export default function BookingsLayout() {
  const pathname = usePathname();
  usePathTabBar(!isBookingsIndex(pathname));

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stay/[bookingId]" />
      <Stack.Screen name="ticket/[bookingId]" />
      <Stack.Screen name="activity/[bookingId]" />
    </Stack>
  );
}
