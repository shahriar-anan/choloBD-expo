import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BookingCard } from '../../../../components/ui/bookingCard';
import { useTheme } from '../../../../hooks/useTheme';
import { useDashboardLogic } from '../../../../hooks/useDashboardLogic';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';

/**
 * Owner / service-admin personal hotel bookings (traveler bookings for this account).
 * Not a hotel-ops queue — reuses the same user bookings API as the user dashboard.
 */
export default function YourBookingsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { bookings, loading, onRefresh, onPressBooking } = useDashboardLogic();

  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <View className="flex-1 p-6">
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 6, marginRight: 12 }}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={text} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.YOUR_BOOKINGS_ADMIN)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.YOUR_BOOKINGS_ADMIN_DESC)}
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="items-center justify-center flex-1">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : bookings.length === 0 ? (
          <View className="items-center p-6 py-12 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
            <Ionicons
              name="calendar-clear-outline"
              size={48}
              color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
            />
            <Text className="mt-4 text-base font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.NO_BOOKINGS)}
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookingCard booking={item} onPress={onPressBooking} />
            )}
            onRefresh={onRefresh}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
