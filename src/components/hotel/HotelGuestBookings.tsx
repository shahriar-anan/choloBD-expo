import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, TextInput } from 'react-native';
import { KeyboardAwareScroll } from '../ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCurrentBookingsFetch } from '../../hooks/useCurrentBookingsFetch';
import { BookingCard } from '../ui/bookingCard';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import {
  cancelHotelBooking,
  getHotelCancellationEligibility,
  updateHotelStayStatus,
} from '../../services/api/bookings';
import { getCancelActionLabel } from '../../utilities/bookingCancelHelpers';
import { updateHotelRoomStatus } from '../../services/api/hotels';
import { canRecordStay, DeskBucket, matchesDeskBucket } from '../../utilities/hotelDesk';

const DESK_BUCKETS: { id: DeskBucket; labelKey: string }[] = [
  { id: 'arriving', labelKey: TRANSLATION_KEYS.HOTEL_DESK.ARRIVING },
  { id: 'inHouse', labelKey: TRANSLATION_KEYS.HOTEL_DESK.IN_HOUSE },
  { id: 'departing', labelKey: TRANSLATION_KEYS.HOTEL_DESK.DEPARTING },
  { id: 'unpaid', labelKey: TRANSLATION_KEYS.HOTEL_DESK.UNPAID },
  { id: 'all', labelKey: TRANSLATION_KEYS.HOTEL_DESK.ALL },
];

function lensFromParam(value: string | string[] | undefined): DeskBucket {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'inHouse' || raw === 'departing' || raw === 'unpaid' || raw === 'all' || raw === 'arriving') {
    return raw;
  }
  return 'arriving';
}

function bookingSearchText(booking: {
  guestName?: string;
  confirmationCode?: string;
  status?: string;
  guestEmail?: string;
  user?: { firstName?: string; lastName?: string; userName?: string; email?: string };
  roomDetails?: Array<{ hotelRoom?: { roomNumber?: string } }>;
}): string {
  const guest = booking.guestName
    || [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(' ')
    || booking.user?.userName
    || '';
  const rooms = (booking.roomDetails || [])
    .map((room) => room.hotelRoom?.roomNumber || '')
    .join(' ');
  return [guest, booking.guestEmail, booking.user?.email, booking.confirmationCode, booking.status, rooms]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

interface HotelGuestBookingsProps {
  showBack?: boolean;
  showEarningsLink?: boolean;
  showSubtitle?: boolean;
  headingKey?: string;
  stayPath?: 'bookings' | 'dashboard';
}

export function HotelGuestBookings({
  showBack = false,
  showEarningsLink = false,
  showSubtitle = false,
  headingKey = TRANSLATION_KEYS.BOOKINGS_TAB.TITLE,
  stayPath = 'bookings',
}: HotelGuestBookingsProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ lens?: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const {
    bookings,
    hotels,
    hotelId,
    selectHotel,
    pagination,
    loading,
    error,
    currentPage,
    setCurrentPage,
    refetch,
  } = useCurrentBookingsFetch(100);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [stayId, setStayId] = useState<string | null>(null);
  const [bucket, setBucket] = useState<DeskBucket>(lensFromParam(params.lens));
  const [query, setQuery] = useState('');

  useEffect(() => {
    setBucket(lensFromParam(params.lens));
  }, [params.lens]);

  const visibleBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (!matchesDeskBucket(booking, bucket)) return false;
      if (!needle) return true;
      return bookingSearchText(booking).includes(needle);
    });
  }, [bookings, bucket, query]);
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  const openStay = (id: string) => {
    if (stayPath === 'dashboard') {
      router.push(`/(tabs)/dashboard/${id}`);
      return;
    }
    router.push(`/(tabs)/bookings/stay/${id}`);
  };

  const onStay = (booking: { id: string; roomDetails?: Array<{ hotelRoomId?: string }> }, status: 'COMPLETED' | 'NO_SHOW') => {
    const label = status === 'COMPLETED' ? 'Check out' : 'No-show';
    Alert.alert(label, 'This updates the stay and does not change the payment.', [
      { text: 'Back', style: 'cancel' },
      {
        text: label,
        onPress: () => {
          void (async () => {
            try {
              setStayId(booking.id);
              await updateHotelStayStatus(booking.id, status);
              await refetch();
              if (status !== 'COMPLETED') return;
              const roomIds = (booking.roomDetails || []).map((detail) => detail.hotelRoomId).filter((id): id is string => Boolean(id));
              if (roomIds.length === 0) return;
              Alert.alert('Needs cleaning', 'Mark these rooms as needing cleaning? Skipping leaves the room status unchanged.', [
                { text: 'Skip', style: 'cancel' },
                {
                  text: 'Needs cleaning',
                  onPress: () => {
                    void Promise.all(roomIds.map((roomId) => updateHotelRoomStatus(roomId, 'MAINTENANCE'))).catch(() => {
                      Alert.alert('Needs cleaning', 'Could not mark the rooms for cleaning.');
                    });
                  },
                },
              ]);
            } catch (stayError: any) {
              Alert.alert(label, stayError?.response?.data?.message || 'Could not update this stay.');
            } finally {
              setStayId(null);
            }
          })();
        },
      },
    ]);
  };

  const onCancel = (booking: { id: string; status?: string }) => {
    if (String(booking.status || '').toUpperCase() === 'CANCELLED' || cancellingId) {
      return;
    }

    void (async () => {
      try {
        setCancellingId(booking.id);
        const eligibility = await getHotelCancellationEligibility(booking.id);
        if (!eligibility?.canCancel) {
          Alert.alert('Cancel booking', eligibility?.reason || 'This booking cannot be cancelled.');
          return;
        }
        const label = getCancelActionLabel(eligibility);
        Alert.alert(label, eligibility.reason, [
          { text: 'Back', style: 'cancel' },
          {
            text: label,
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await cancelHotelBooking(booking.id);
                  await refetch();
                } catch (cancelError: any) {
                  Alert.alert('Cancel booking', cancelError?.response?.data?.message || 'Could not cancel this booking.');
                }
              })();
            },
          },
        ]);
      } catch (eligibilityError: any) {
        Alert.alert('Cancel booking', eligibilityError?.response?.data?.message || 'Could not check cancellation.');
      } finally {
        setCancellingId(null);
      }
    })();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAwareScroll
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      >
        {showBack ? (
          <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6 }} accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </Pressable>
        ) : null}

        <Text className={`${showBack ? 'mt-2 ' : ''}text-2xl font-bold text-text dark:text-text-dark`}>{t(headingKey)}</Text>
        {showSubtitle ? (
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.SUBTITLE)}</Text>
        ) : null}

        {hotels.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
            {hotels.map((hotel) => {
              const selected = hotel.id === hotelId;
              return (
                <Pressable
                  key={hotel.id}
                  onPress={() => selectHotel(hotel.id)}
                  className={`px-3 py-2 mr-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-white border-border dark:bg-surface-dark dark:border-border-dark'}`}
                >
                  <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                    {hotel.name || 'Hotel'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View className="flex-row items-center px-3 mt-4 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
          <Ionicons name="search" size={18} color={muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t(TRANSLATION_KEYS.HOTEL_DESK.SEARCH)}
            placeholderTextColor={muted}
            className="flex-1 px-2 py-3 text-text dark:text-text-dark"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel={t(TRANSLATION_KEYS.HOTEL_DESK.CLEAR_SEARCH)}>
              <Ionicons name="close-circle" size={18} color={muted} />
            </Pressable>
          ) : null}
        </View>

        {showEarningsLink ? (
          <Pressable onPress={() => router.push('/(tabs)/dashboard/service-admin/earnings')} className="mt-4">
            <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
              {t(TRANSLATION_KEYS.HOTEL_DESK.EARNINGS_LINK)}
            </Text>
          </Pressable>
        ) : null}

        <View className="flex-row flex-wrap gap-2 mt-4">
          {DESK_BUCKETS.map((item) => {
            const selected = bucket === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setBucket(item.id)}
                className={`px-3 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-white border-border dark:bg-surface-dark dark:border-border-dark'}`}
              >
                <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>{t(item.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-4 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.LOADING)}</Text>
          </View>
        ) : error ? (
          <View className="p-4 mt-6 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
            <Text className="text-sm text-text dark:text-text-dark">{error}</Text>
            <Pressable onPress={() => { void refetch(); }} className="self-start mt-3" accessibilityRole="button">
              <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                {t(TRANSLATION_KEYS.COMMON.TRY_AGAIN)}
              </Text>
            </Pressable>
          </View>
        ) : visibleBookings.length === 0 ? (
          <View className="items-center py-8 mt-6 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
            <Ionicons name="calendar-clear" size={32} color={muted} />
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
              {query.trim() ? t(TRANSLATION_KEYS.HOTEL_DESK.EMPTY_SEARCH) : t(TRANSLATION_KEYS.HOTEL_DESK.EMPTY)}
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            {visibleBookings.map((item) => {
              const showStay = canRecordStay(item);
              const showCancel = String(item.status || '').toUpperCase() !== 'CANCELLED';
              return (
                <BookingCard
                  key={item.id}
                  booking={item}
                  deskView
                  showGenerateQr={false}
                  onPress={openStay}
                  footer={showStay || showCancel ? (
                    <View className="gap-2">
                      {showStay ? (
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => onStay(item, 'COMPLETED')}
                            disabled={stayId === item.id}
                            className="flex-1 px-3 py-3 border rounded-lg border-border dark:border-border-dark"
                          >
                            <Text className="text-sm font-semibold text-center text-text dark:text-text-dark">Check out</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => onStay(item, 'NO_SHOW')}
                            disabled={stayId === item.id}
                            className="flex-1 px-3 py-3 border rounded-lg border-border dark:border-border-dark"
                          >
                            <Text className="text-sm font-semibold text-center text-text dark:text-text-dark">No-show</Text>
                          </Pressable>
                        </View>
                      ) : null}
                      {showCancel ? (
                        <Pressable
                          onPress={() => onCancel(item)}
                          disabled={cancellingId === item.id}
                          className="px-3 py-3"
                        >
                          <Text className="text-sm font-semibold text-center text-red-600 dark:text-red-300">
                            {cancellingId === item.id ? 'Checking...' : 'Cancel booking'}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : undefined}
                />
              );
            })}
          </View>
        )}

        {pagination && pagination.pages > 1 ? (
          <View className="flex-row items-center justify-between p-3 mt-2 bg-white border rounded-lg dark:bg-surface-dark border-border dark:border-border-dark">
            <Pressable
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={`px-3 py-2 rounded-lg ${currentPage <= 1 ? 'bg-gray-200' : 'bg-primary'}`}
            >
              <Ionicons name="chevron-back" size={18} color={currentPage <= 1 ? theme.colors.muted : theme.colors['onPrimary']} />
            </Pressable>
            <Text className="text-sm text-text dark:text-text-dark">
              Page {currentPage} of {pagination.pages}
            </Text>
            <Pressable
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= pagination.pages}
              className={`px-3 py-2 rounded-lg ${currentPage >= pagination.pages ? 'bg-gray-200' : 'bg-primary'}`}
            >
              <Ionicons name="chevron-forward" size={18} color={currentPage >= pagination.pages ? theme.colors.muted : theme.colors['onPrimary']} />
            </Pressable>
          </View>
        ) : null}
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
