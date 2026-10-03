import React from 'react';
import { Stack } from 'expo-router';
import { usePathTabBar } from '../../../hooks/useHideTabBar';
import { useIsTraveler } from '../../../hooks/useIsTraveler';

export default function CommunityLayout() {
  const traveler = useIsTraveler();
  usePathTabBar(traveler);
  return <Stack screenOptions={{ headerShown: false }} />;
}
