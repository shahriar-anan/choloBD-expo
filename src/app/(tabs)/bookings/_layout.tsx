import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { useHotelAdminSession } from '../../../hooks/useHotelAdminSession';
import { usePathTabBar } from '../../../hooks/useHideTabBar';

function isBookingsIndex(pathname: string): boolean {
  return pathname === '/bookings' || pathname.endsWith('/bookings');
}

export default function BookingsLayout() {
  const pathname = usePathname();
  const { isHotelAdmin, isHotelEmployee } = useHotelAdminSession();
  usePathTabBar(!((isHotelAdmin || isHotelEmployee) && isBookingsIndex(pathname)));

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stay/[bookingId]" />
      <Stack.Screen name="ticket/[bookingId]" />
      <Stack.Screen name="activity/[bookingId]" />
    </Stack>
  );
}
