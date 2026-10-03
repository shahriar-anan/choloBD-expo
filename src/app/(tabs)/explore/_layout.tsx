import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { ExploreProvider } from './_provider';
import { HotelSearchProvider } from '../../../context/HotelSearchContext';
import { TransportBusCheckoutProvider } from '../../../context/TransportBusCheckoutContext';
import { TransportSearchProvider } from '../../../context/TransportSearchContext';
import { useHotelFlowTabBar } from '../../../hooks/useHideTabBar';
import { useIsTraveler } from '../../../hooks/useIsTraveler';

export default function ExploreLayout() {
  const pathname = usePathname();
  const traveler = useIsTraveler();
  useHotelFlowTabBar(pathname, traveler);

  return (
    <ExploreProvider>
      <HotelSearchProvider>
        <TransportSearchProvider>
          <TransportBusCheckoutProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </TransportBusCheckoutProvider>
        </TransportSearchProvider>
      </HotelSearchProvider>
    </ExploreProvider>
  );
}
