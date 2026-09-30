import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCurrentBookingsFetch } from '../../../../hooks/useCurrentBookingsFetch';
import { BookingCard } from '../../../../components/ui/bookingCard';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import {
  cancelHotelBooking,
  getHotelCancellationEligibility,
  updateHotelStayStatus,
} from '../../../../services/api/bookings';
import { getCancelActionLabel } from '../../../../utilities/bookingCancelHelpers';
import { canRecordStay, DeskBucket, matchesDeskBucket, summarizeBookings } from '../../../../utilities/hotelDesk';

const DESK_BUCKETS: { id: DeskBucket; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'arriving', label: 'Arriving' },
  { id: 'inHouse', label: 'In house' },
  { id: 'departing', label: 'Departing' },
];

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

export default function CurrentBookingsPage() {
  const router = useRouter();
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
  const [bucket, setBucket] = useState<DeskBucket>('all');
  const [query, setQuery] = useState('');
  const summary = summarizeBookings(bookings);
  const visibleBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (!matchesDeskBucket(booking, bucket)) return false;
      if (!needle) return true;
      return bookingSearchText(booking).includes(needle);
    });
  }, [bookings, bucket, query]);
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;

  const onStay = (bookingId: string, status: 'COMPLETED' | 'NO_SHOW') => {
    const label = status === 'COMPLETED' ? 'Check out' : 'No-show';
    Alert.alert(label, 'This updates the stay and does not change the payment.', [
      { text: 'Back', style: 'cancel' },
      {
        text: label,
        onPress: () => {
          void (async () => {
            try {
              setStayId(bookingId);
              await updateHotelStayStatus(bookingId, status);
              await refetch();
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
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>

        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">Current Bookings</Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">Bookings for your hotel</Text>

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
          <Ionicons name="search" size={18} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search guest, code, or room"
            placeholderTextColor={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
            className="flex-1 px-2 py-3 text-text dark:text-text-dark"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row gap-2 mt-4">
          <View className="flex-1 p-3 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
            <Text className="text-xs text-muted dark:text-muted-dark">Paid</Text>
            <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">৳{summary.paidTotal.toLocaleString()}</Text>
          </View>
          <View className="flex-1 p-3 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
            <Text className="text-xs text-muted dark:text-muted-dark">Unpaid</Text>
            <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">৳{summary.unpaidTotal.toLocaleString()}</Text>
          </View>
          <View className="flex-1 p-3 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
            <Text className="text-xs text-muted dark:text-muted-dark">Cancelled</Text>
            <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">{summary.cancelledCount}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 mt-4">
          {DESK_BUCKETS.map((item) => {
            const selected = bucket === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setBucket(item.id)}
                className={`px-3 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-white border-border dark:bg-surface-dark dark:border-border-dark'}`}
              >
                <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-4 text-sm text-muted dark:text-muted-dark">Loading bookings...</Text>
          </View>
        ) : error ? (
          <View className="p-4 mt-6 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
            <Text className="text-sm text-text dark:text-text-dark">{error}</Text>
          </View>
        ) : visibleBookings.length === 0 ? (
          <View className="items-center py-8 mt-6 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
            <Ionicons name="calendar-clear" size={32} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
            <Text className="mt-3 text-sm text-muted dark:text-muted-dark">
              {query.trim() ? 'No bookings match your search' : 'No bookings in this list'}
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
                footer={showStay || showCancel ? (
                  <View className="gap-2">
                    {showStay ? (
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => onStay(item.id, 'COMPLETED')}
                          disabled={stayId === item.id}
                          className="flex-1 px-3 py-3 border rounded-lg border-border dark:border-border-dark"
                        >
                          <Text className="text-sm font-semibold text-center text-text dark:text-text-dark">Check out</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => onStay(item.id, 'NO_SHOW')}
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
      </ScrollView>
    </SafeAreaView>
  );
}
