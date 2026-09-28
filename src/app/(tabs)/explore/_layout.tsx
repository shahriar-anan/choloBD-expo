import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { ExploreProvider } from './_provider';
import { HotelSearchProvider } from '../../../context/HotelSearchContext';
import { useHotelFlowTabBar } from '../../../hooks/useHideTabBar';

export default function ExploreLayout() {
  const pathname = usePathname();
  useHotelFlowTabBar(pathname);

  return (
    <ExploreProvider>
      <HotelSearchProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </HotelSearchProvider>
    </ExploreProvider>
  );
}
