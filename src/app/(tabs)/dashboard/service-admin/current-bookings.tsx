import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCurrentBookingsFetch } from '../../../../hooks/useCurrentBookingsFetch';
import { BookingCard } from '../../../../components/ui/bookingCard';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';

export default function CurrentBookingsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { bookings, pagination, loading, error, currentPage, setCurrentPage } =
    useCurrentBookingsFetch(20);

  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <View className="flex-1 p-6">
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={text} />
        </Pressable>

        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.CURRENT_BOOKINGS)}
        </Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.CURRENT_BOOKINGS_DESC)}
        </Text>

        {loading ? (
          <View className="items-center justify-center flex-1 mt-6">
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : error ? (
          <View className="p-4 mt-6 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
            <Text className="text-sm text-text dark:text-text-dark">{error}</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View className="items-center p-6 py-12 mt-6 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
            <Ionicons
              name="calendar-clear-outline"
              size={40}
              color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
            />
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.NO_BOOKINGS)}
            </Text>
          </View>
        ) : (
          <View className="flex-1 mt-6">
            <FlatList
              data={bookings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <BookingCard
                  booking={item}
                  onPress={(id) => router.push(`/(tabs)/dashboard/${id}`)}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
            />

            <View className="flex-row items-center justify-between p-3 mt-4 border rounded-lg border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
              <Pressable
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                style={{ opacity: currentPage <= 1 ? 0.4 : 1, padding: 8 }}
              >
                <Ionicons name="chevron-back" size={18} color={primary} />
              </Pressable>

              <Text className="text-sm text-text dark:text-text-dark">
                {currentPage} / {pagination?.pages ?? '—'}
              </Text>

              <Pressable
                onPress={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination || pagination.page >= pagination.pages}
                style={{
                  opacity: !pagination || pagination.page >= pagination.pages ? 0.4 : 1,
                  padding: 8,
                }}
              >
                <Ionicons name="chevron-forward" size={18} color={primary} />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
