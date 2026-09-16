/**
 * My Tours Page
 * View all personal/custom tour packages created by the user
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TourListCard } from '../../../components/tourBuilder/TourListCard';
import { useFetchPersonalTourPlans } from '../../../hooks/useFetchPersonalTourPlans';
import { usePersonalTourPlanLogic } from '../../../hooks/usePersonalTourPlanLogic';
import { useTheme } from '../../../hooks/useTheme';
import { theme } from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import type { TourPackage } from '../../../types/tours';

export default function MyToursPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { plans: tourPlans, isLoading: listLoading, error: listError, refetch } = useFetchPersonalTourPlans();
  const { deletePlan } = usePersonalTourPlanLogic();

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  // Fetch tours when page loads
  useEffect(() => {
    refetch();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handlePressTour = (tourId: string) => {
    router.push(`/(tabs)/explore/tour-detail?id=${tourId}`);
  };

  const handleEditTour = (tourId: string) => {
    router.push(`/(tabs)/explore/personal-tour-edit?tourId=${tourId}`);
  };

  const handleDeleteTour = (tourId: string) => {
    Alert.alert(
      'Delete Tour',
      'Are you sure you want to delete this custom tour package? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(tourId);
              Alert.alert('Deleted', 'Tour package deleted successfully.');
              refetch(); // Refresh the list
            } catch {
              Alert.alert('Error', 'Failed to delete tour. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    router.push('/(tabs)/explore/personal-tour-create');
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View className="px-6 pt-6 pb-2 flex-row items-center">
          <Ionicons
            name="chevron-back"
            size={24}
            color={primaryColor}
            onPress={handleBack}
          />
        </View>

        <View className="px-6 pb-4">
          <Text className="text-3xl font-bold font-heading text-text dark:text-text-dark">
            My Custom Tours
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {tourPlans?.length || 0} custom tour package{(tourPlans?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Loading State */}
        {listLoading && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TOUR_BUILDER.LOADING_TOURS)}
            </Text>
          </View>
        )}

        {/* Error State */}
        {listError && (
          <View className="px-6 py-6 mx-6 rounded-lg border border-red-500 bg-red-50 dark:bg-red-900">
            <View className="flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text className="flex-1 text-sm text-red-600 dark:text-red-200 font-semibold">
                {listError}
              </Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!listLoading && (!tourPlans || tourPlans.length === 0) && (
          <View className="px-6 py-12 items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <Ionicons name="map" size={32} color={primaryColor} />
            </View>
            <Text className="text-lg font-bold text-text dark:text-text-dark text-center mb-2">
              No Custom Tours Yet
            </Text>
            <Text className="text-sm text-muted dark:text-muted-dark text-center mb-6">
              Create your first personalized tour package
            </Text>
            <TouchableOpacity
              className="py-3 px-6 rounded-lg active:opacity-80"
              style={{ backgroundColor: primaryColor }}
              onPress={handleCreateNew}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="add" size={18} color="#fff" />
                <Text className="text-white font-bold text-base">Create Custom Tour</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Tours List */}
        {!listLoading && tourPlans && tourPlans.length > 0 && (
          <View className="px-2 pb-6">
            {tourPlans.map((tour: TourPackage) => (
              <TourListCard
                key={tour.id}
                tour={tour}
                onPress={handlePressTour}
                onEdit={handleEditTour}
                onDelete={handleDeleteTour}
                showAdminActions={true}
              />
            ))}
          </View>
        )}

        {/* Create Tour Button (Footer) */}
        {!listLoading && tourPlans && tourPlans.length > 0 && (
          <View className="px-6 pb-8">
            <TouchableOpacity
              className="py-3.5 rounded-lg flex-row items-center justify-center gap-2 active:opacity-80"
              style={{ backgroundColor: primaryColor }}
              onPress={handleCreateNew}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text className="text-white font-bold text-base">Create Another Tour</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
