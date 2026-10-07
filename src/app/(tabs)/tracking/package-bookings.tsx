import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { RootState, AppDispatch } from '../../../store/store';
import { fetchTourPlansByAdmin } from '../../../store/slices/tourBuilderSlice';
import { fetchPackageBookingStats } from '../../../store/slices/packageBookingSlice';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function PackageBookingsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const { list: tourPlans, listLoading: packagesLoading } = useSelector((s: RootState) => s.tourBuilder);
  const { stats } = useSelector((s: RootState) => s.packageBooking);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchTourPlansByAdmin({}));
  }, [dispatch]);

  // Fetch stats for each package when packages are loaded
  useEffect(() => {
    if (tourPlans && tourPlans.length > 0) {
      console.log('[package-bookings.tsx] Fetching stats for', tourPlans.length, 'packages');
      tourPlans.forEach((pkg) => {
        dispatch(fetchPackageBookingStats(pkg.id));
      });
    }
  }, [tourPlans, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchTourPlansByAdmin({}));
    setRefreshing(false);
  };

  const handlePackagePress = (packageId: string) => {
    router.push(`/(tabs)/tracking/package-bookings/${packageId}`);
  };

  const renderPackageCard = ({ item }: { item: any }) => {
    // Get stats for this package if available
    const packageStats = stats[item.id];
    const bookingCount = packageStats?.totalBookings || 0;
    
    console.log('[package-bookings.tsx] Package:', item.packageName, 'ID:', item.id, 'Stats:', packageStats, 'Count:', bookingCount);

    return (
      <TouchableOpacity
        onPress={() => handlePackagePress(item.id)}
        activeOpacity={0.7}
        className="mb-3"
      >
        <View className="p-4 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-lg font-semibold text-text dark:text-text-dark">
                {item.packageName}
              </Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                {item.location?.name || 'Location'}
              </Text>
              
              <View className="flex-row items-center mt-2">
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
                />
                <Text className="ml-1 text-xs text-muted dark:text-muted-dark">
                  {item.durationDays} {item.durationDays === 1 ? 'day' : 'days'}
                </Text>
                <Text className="mx-2 text-muted dark:text-muted-dark">•</Text>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
                />
                <Text className="ml-1 text-xs text-muted dark:text-muted-dark">
                  Max {item.maxGroupSize}
                </Text>
              </View>
            </View>

            <View className="items-center">
              <View className="px-3 py-1 rounded-full bg-primary/10 dark:bg-primary-dark/10">
                <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                  {bookingCount}
                </Text>
              </View>
              <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TRACKING.BOOKINGS)}
              </Text>
            </View>
          </View>

          {!item.isActive && (
            <View className="px-2 py-1 mt-2 rounded bg-muted/10 dark:bg-muted-dark/10">
              <Text className="text-xs text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TOUR_BUILDER.INACTIVE_BADGE)}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-end mt-2">
            <Text className="mr-1 text-sm text-primary dark:text-primary-dark">
              {t(TRANSLATION_KEYS.TRACKING.VIEW_BOOKINGS)}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isDark ? theme.colors['primary-dark'] : theme.colors.primary}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View className="px-6 pt-8 pb-4">
        <TouchableOpacity onPress={() => goBack(router)} className="mb-4">
          <View className="flex-row items-center">
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? theme.colors['text-dark'] : theme.colors.text}
            />
            <Text className="ml-2 text-base text-primary dark:text-primary-dark">
              {t(TRANSLATION_KEYS.COMMON.BACK)}
            </Text>
          </View>
        </TouchableOpacity>

        <Text className="text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRACKING.PACKAGE_BOOKINGS_SUBTITLE)}
        </Text>
        <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRACKING.PACKAGE_BOOKINGS)}
        </Text>
      </View>

      {packagesLoading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : tourPlans && tourPlans.length > 0 ? (
        <View className="px-6 pb-8">
          <FlatList
            data={tourPlans}
            keyExtractor={(item) => item.id}
            renderItem={renderPackageCard}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <View className="items-center px-6 py-12">
          <Ionicons
            name="briefcase-outline"
            size={64}
            color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
          />
          <Text className="mt-4 mb-2 text-lg font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRACKING.NO_PACKAGES_FOUND)}
          </Text>
          <Text className="text-sm text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRACKING.NO_PACKAGES_DESC)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
