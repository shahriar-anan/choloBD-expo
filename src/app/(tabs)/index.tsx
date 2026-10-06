import React from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { AppDispatch, RootState } from '../../store/store';
import { logoutUser } from '../../store/slices/authSlice';
import {
  HomeHeader,
  HeroBackground,
  QuickActionGrid,
  HomePromoCarousel,
  PopularPlacesSection,
  TourPackagesSection,
  HomeDealsSection,
  HomeCommunityRow,
} from '../../components/homepage';
import { useFetchTourPackages } from '../../hooks/useFetchTourPackages';

function TravelerHome() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);
  const { isDark } = useTheme();
  const holidays = useFetchTourPackages({ isActive: true, isPopular: true });

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.replace('/(auth)/login');
  };

  const handleNavigate = (section: string, item: string) => {
    console.log(`Navigating to ${section}/${item}`);
    // Navigation logic based on the item selected
    switch (item) {
      case 'explore':
        router.push('/(tabs)/explore');
        break;
      case 'bookings':
        router.push('/(tabs)/dashboard');
        break;
      case 'activity':
        router.push('/(tabs)/explore/attractions?tab=places');
        break;
      case 'tours':
        router.push('/(tabs)/trip-planner?tab=templates&fromHome=true');
        break;
      case 'scan-qr':
        router.push('/(tabs)/dashboard/service-admin/qr-scanner');
        break;
      case 'wallet':
        Alert.alert('Coming Soon', 'Wallet feature is not yet available in this version.');
        break;
      case 'payment':
        Alert.alert('Coming Soon', 'Payment feature is not yet available in this version.');
        break;
      case 'track':
        router.push('/(tabs)/tracking');
        break;
      case 'profile':
        router.push('/(tabs)/dashboard');
        break;
      case 'settings':
        Alert.alert('Info', 'Settings page is not yet available.');
        break;
      case 'help':
        Alert.alert('Help', 'Help page is not yet available.');
        break;
      case 'about':
        Alert.alert('About', 'About page is not yet available.');
        break;
      default:
        console.log('Navigation not implemented for:', item);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <HomeHeader onNavigate={handleNavigate} onLogout={handleLogout} />

      {/* Main Content */}
      <ScrollView className="flex-1 bg-background dark:bg-background-dark" showsVerticalScrollIndicator={false}>
        {/* 1. Hero Background with messaging */}
        <HeroBackground />

        {/* 2. Quick Action Grid */}
        <QuickActionGrid onNavigate={(actionId) => console.log('Quick action pressed:', actionId)} />

        <HomePromoCarousel />
        <PopularPlacesSection />
        <TourPackagesSection
          packages={holidays.packages}
          isLoading={holidays.isLoading}
          error={holidays.error}
          onRetry={holidays.refetch}
        />
        <HomeDealsSection
          packages={holidays.packages}
          packagesLoading={holidays.isLoading}
          packagesError={holidays.error}
          onRetryPackages={holidays.refetch}
        />
        <HomeCommunityRow />

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function HomePage() {
  return <TravelerHome />;
}
