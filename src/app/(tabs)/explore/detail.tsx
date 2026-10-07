import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { ExploreHotelDetailUI } from '../../../components/ui/exploreHotelDetailUI';
import { useExplore } from './_provider';
import { useRouter } from 'expo-router';
import { goBack } from '../../../utilities/navigation';

export default function ExploreDetail() {
  const { hotelDetail, detailLoading } = useExplore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  if (!hotelDetail) return null;

  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ExploreHotelDetailUI
        hotel={hotelDetail}
        onBack={() => goBack(router)}
        onBackToSearch={() => router.push('/(tabs)/explore')}
        onBooking={() => router.push('/(tabs)/explore/booking')}
        loading={detailLoading}
      />
    </SafeAreaView>
  );
}
