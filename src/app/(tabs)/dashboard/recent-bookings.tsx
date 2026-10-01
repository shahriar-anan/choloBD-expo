import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RecentBookingCard } from '../../../components/ui/recentBookingCard';
import { useTheme } from '../../../hooks/useTheme';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { RecentBookingView } from '../../../utilities/recentBookingItems';

function canOpen(item: RecentBookingView): boolean {
  return item.kind === 'hotel' || item.kind === 'transport' || item.kind === 'package';
}

export default function RecentBookingsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { recentBookingItems, loading, onRefresh, onPressRecentBooking } = useDashboardLogic();
  const [hasLoaded, setHasLoaded] = useState(false);
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      onRefresh().finally(() => {
        if (active) {
          setHasLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, [onRefresh])
  );

  const busy = !hasLoaded || (loading && recentBookingItems.length === 0);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 p-6">
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 6, marginRight: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.DASHBOARD.RECENT_BOOKINGS)}
            </Text>
          </View>
        </View>

        {busy ? (
          <View className="items-center justify-center flex-1 mt-6">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.COMMON.LOADING)}
            </Text>
          </View>
        ) : recentBookingItems.length === 0 ? (
          <View className="items-center p-6 py-12 mt-6 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
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
            data={recentBookingItems}
            keyExtractor={(item) => `${item.kind}-${item.id}`}
            renderItem={({ item }) => (
              <RecentBookingCard
                item={item}
                onPress={canOpen(item) ? onPressRecentBooking : undefined}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
            onRefresh={onRefresh}
            refreshing={loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
