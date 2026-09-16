import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { useActivityAdminLogic } from '@/hooks/useActivityAdminLogic';
import type { ActivityBooking } from '@/types/activityBookings';

export default function ActivityAdminBookingsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const {
    activitySpot,
    spotLoading,
    spotError,
    bookings,
    bookingsLoading,
    bookingsError,
    actionLoading,
    summary,
    loadDashboard,
    handleCancelBooking,
  } = useActivityAdminLogic();

  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const sections = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'PENDING');
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
    const other = bookings.filter(
      (b) => b.status !== 'PENDING' && b.status !== 'CONFIRMED'
    );
    return [
      { title: 'Pending', data: pending },
      { title: 'Confirmed', data: confirmed },
      { title: 'History', data: other },
    ].filter((s) => s.data.length > 0);
  }, [bookings]);

  const guestName = (b: ActivityBooking) =>
    b.user?.userName ||
    `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim() ||
    'Guest';

  const confirmCancel = (bookingId: string) => {
    Alert.alert('Cancel booking', 'Cancel this activity booking?', [
      { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
      {
        text: t(TRANSLATION_KEYS.COMMON.CONFIRM),
        style: 'destructive',
        onPress: () => handleCancelBooking(bookingId, cancelReason.trim() || undefined),
      },
    ]);
  };

  const renderStat = (label: string, value: string) => (
    <View
      style={{
        flex: 1,
        backgroundColor: surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '800', color: text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: muted, marginTop: 2 }}>{label}</Text>
    </View>
  );

  const loading = (spotLoading || bookingsLoading) && !refreshing;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-6 pb-4">
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_BOOKINGS)}
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {activitySpot?.name || t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.ACTIVITY_BOOKINGS_DESC)}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : spotError ? (
        <View className="px-6">
          <Text className="text-sm text-text dark:text-text-dark">{spotError}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
          ListHeaderComponent={
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {renderStat('Pending', `${summary.pendingBookings}`)}
                {renderStat('Confirmed', `${summary.confirmedBookings}`)}
                {renderStat('Done', `${summary.completedBookings}`)}
              </View>
              {bookingsError ? (
                <Text style={{ color: theme.colors.error, marginTop: 8 }}>{bookingsError}</Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="calendar-outline" size={48} color={muted} />
              <Text className="mt-3 text-base text-muted dark:text-muted-dark">No bookings yet</Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text style={{ fontSize: 15, fontWeight: '700', color: text, marginBottom: 8, marginTop: 8 }}>
              {section.title} ({section.data.length})
            </Text>
          )}
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const canCancel = item.status === 'PENDING' || item.status === 'CONFIRMED';
            return (
              <Pressable
                onPress={() => setExpandedId(expanded ? null : item.id)}
                className="p-4 mb-3 border rounded-xl border-border dark:border-border-dark"
                style={{ backgroundColor: surface }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-semibold text-text dark:text-text-dark">
                      {guestName(item)}
                    </Text>
                    <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                      {new Date(item.bookingDate).toLocaleDateString()} · {item.participantCount} guests
                    </Text>
                    <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                      {item.confirmationCode || item.id.slice(0, 8)}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-primary dark:text-primary-dark">
                    {item.status}
                  </Text>
                </View>
                <Text className="mt-2 text-sm font-semibold text-text dark:text-text-dark">
                  ৳{(item.totalPrice ?? item.totalCost ?? 0).toLocaleString()}
                </Text>

                {expanded ? (
                  <View className="pt-3 mt-3 border-t border-border dark:border-border-dark">
                    {item.specialRequirements || item.specialRequests ? (
                      <Text className="mb-2 text-sm text-muted dark:text-muted-dark">
                        Notes: {item.specialRequirements || item.specialRequests}
                      </Text>
                    ) : null}
                    {canCancel ? (
                      <>
                        <TextInput
                          value={cancelReason}
                          onChangeText={setCancelReason}
                          placeholder="Cancel reason (optional)"
                          placeholderTextColor={muted}
                          style={{
                            borderWidth: 1,
                            borderColor: border,
                            borderRadius: 10,
                            padding: 10,
                            color: text,
                            marginBottom: 8,
                          }}
                        />
                        <Pressable
                          disabled={actionLoading}
                          onPress={() => confirmCancel(item.id)}
                          className="items-center py-2 rounded-lg"
                          style={{ backgroundColor: (isDark ? theme.colors['error-dark'] : theme.colors.error) + '22' }}
                        >
                          <Text
                            style={{
                              color: isDark ? theme.colors['error-dark'] : theme.colors.error,
                              fontWeight: '700',
                            }}
                          >
                            Cancel booking
                          </Text>
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
