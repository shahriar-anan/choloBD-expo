/**
 * Tour List Page
 * Nested page under explore for browsing tour packages
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchTourPlans, setFilters } from '../../../store/slices/tourBuilderSlice';
import { TourFilterBar } from '../../../components/tourBuilder/TourFilterBar';
import { TourListCard } from '../../../components/tourBuilder/TourListCard';
import { ErrorAlert } from '../../../components/tourBuilder/ErrorAlert';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthWithAdminCheck } from '../../../hooks/useAuthWithAdminCheck';
import { theme } from '../../../constants/theme';
import { goBack } from '../../../utilities/navigation';

export default function TourListPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { isDark } = useTheme();
  const { isAdmin } = useAuthWithAdminCheck();
  const { list, listLoading, listError, filters } = useSelector((state: RootState) => state.tourBuilder);
  const [showFilters, setShowFilters] = useState(false);

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  useEffect(() => {
    dispatch(fetchTourPlans(filters));
  }, []);

  const handleBack = () => {
    goBack(router);
  };

  const handleTourPress = (tourId: string) => {
    router.push({
      pathname: '/(tabs)/explore/tour-detail',
      params: { id: tourId },
    });
  };

  const handleTourEdit = (tourId: string) => {
    router.push({
      pathname: '/(tabs)/explore/tour-edit',
      params: { tourId },
    });
  };

  const renderTourCard = ({ item }: any) => (
    <View className="px-4 mb-3">
      <TourListCard
        tour={item}
        onPress={() => handleTourPress(item.id)}
        showAdminActions={isAdmin}
        onEdit={handleTourEdit}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Ionicons name="map" size={48} color={mutedColor} />
      <Text className="mt-4 text-lg font-semibold text-text dark:text-text-dark">
        No Tours Available
      </Text>
      <Text className="mt-2 text-sm text-muted dark:text-muted-dark text-center px-6">
        Check back later for exciting tour packages
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-background-dark"
    >
      {/* Header with Back Button */}
      <View className="px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons
            name="chevron-back"
            size={24}
            color={primaryColor}
            onPress={handleBack}
            style={{ marginRight: 12 }}
          />
          <View className="flex-1">
            <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
              Tours
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              Explore amazing packages
            </Text>
          </View>
        </View>
        <Ionicons
          name="funnel"
          size={20}
          color={showFilters ? primaryColor : mutedColor}
          onPress={() => setShowFilters(!showFilters)}
        />
      </View>

      {/* Error Alert */}
      {listError && (
        <View className="px-4">
          <ErrorAlert error={listError} onDismiss={() => {}} />
        </View>
      )}

      {/* Filter Bar */}
      {showFilters && (
        <View className="px-4 mb-4">
          <TourFilterBar
            onFilterChange={(f) => {
              dispatch(setFilters(f));
              dispatch(fetchTourPlans(f));
            }}
          />
        </View>
      )}

      {/* Tour List */}
      {listLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
            Loading tours...
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          renderItem={renderTourCard}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
