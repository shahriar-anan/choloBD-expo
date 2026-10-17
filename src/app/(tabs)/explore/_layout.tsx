import React from 'react';
import { Stack, usePathname } from 'expo-router';
import { ExploreProvider } from './_provider';
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
        <TransportSearchProvider>
          <TransportBusCheckoutProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </TransportBusCheckoutProvider>
        </TransportSearchProvider>
    </ExploreProvider>
  );
}
