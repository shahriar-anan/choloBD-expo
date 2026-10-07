import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { useTransportOperator } from '../../../../hooks/useTransportOperator';
import { getTransportBookings } from '../../../../services/api/transportBookings';
import { TransportBooking } from '../../../../types/transports';
import { format } from 'date-fns';
import { formatTripDateTime, operatorStatusLabel } from '../../../../utilities/transportFormat';
import { goBack } from '../../../../utilities/navigation';

const PAGE_SIZE = 20;

function passengerLabel(booking: TransportBooking, fallback: string): string {
  const itemName = booking.items?.find((item) => item.passengerName)?.passengerName;
  if (itemName) return itemName;
  const first = booking.items?.[0];
  const fromParts = [first?.passengerFirstName, first?.passengerLastName].filter(Boolean).join(' ');
  if (fromParts) return fromParts;
  const user = booking.user;
  if (user) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || user.userName || user.email || fallback;
  }
  return fallback;
}

function statusTone(status: string | undefined, isDark: boolean): { bg: string; fg: string } {
  const key = (status || '').toUpperCase();
  if (key === 'CONFIRMED' || key === 'PAID' || key === 'COMPLETED') {
    return {
      bg: isDark ? 'rgba(34,197,94,0.18)' : 'rgba(22,163,74,0.12)',
      fg: isDark ? '#4ADE80' : '#15803D',
    };
  }
  if (key === 'PENDING' || key === 'UNPAID') {
    return {
      bg: isDark ? 'rgba(245,158,11,0.18)' : 'rgba(217,119,6,0.12)',
      fg: isDark ? '#FBBF24' : '#B45309',
    };
  }
  return {
    bg: isDark ? 'rgba(156,163,175,0.18)' : 'rgba(107,114,128,0.12)',
    fg: isDark ? '#D1D5DB' : '#4B5563',
  };
}

function dayPart(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return format(date, 'EEE, d MMM');
  } catch {
    return '—';
  }
}

function timePart(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
}

function seatSummary(booking: TransportBooking): string {
  const seats = (booking.items || [])
    .map((item) => item.assignedSeatLabel || item.transportSeat?.seatLabel)
    .filter(Boolean);
  if (seats.length > 0) return seats.join(', ');
  const vehicle = booking.items?.find((item) => item.transportVehicle)?.transportVehicle;
  if (vehicle?.name || vehicle?.licensePlate) {
    return [vehicle.name, vehicle.licensePlate].filter(Boolean).join(' · ');
  }
  return `${booking.passengerCount} pax`;
}

export default function TransportAdminBookingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const { transportType } = useTransportOperator(true);
  const rental = transportType === 'CAR_RENTAL';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const travelerLabel = t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.TRAVELER);

  const load = useCallback(async (page: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else if (page === 1) setLoading(true);
    try {
      const result = await getTransportBookings({ page, limit: PAGE_SIZE });
      setTotal(result.total);
      setBookings((current) => (append ? [...current, ...result.results] : result.results));
      setError(null);
    } catch (e: unknown) {
      if (!append) setBookings([]);
      setError(e instanceof Error ? e.message : t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    load(1, false);
  }, [load]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center mb-6">
          <Pressable onPress={() => goBack(router)} style={{ padding: 6, marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color={primary} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-text dark:text-text-dark">
              {t(rental ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.RENTALS : TRANSLATION_KEYS.TRANSPORT_OPERATOR.PASSENGERS)}
            </Text>
            <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark">
              {t(rental ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.RENTALS_DESC : TRANSLATION_KEYS.TRANSPORT_OPERATOR.PASSENGERS_DESC)}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={primary} />
        ) : error ? (
          <Text className="text-sm text-error dark:text-error-dark">{error}</Text>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load(1, false);
                }}
              />
            }
            ListEmptyComponent={
              <View className="items-center px-6 py-16">
                <View className="items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                  <Ionicons name={rental ? 'car-outline' : 'people-outline'} size={28} color={primary} />
                </View>
                <Text className="text-base font-semibold text-center text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NO_BOOKINGS)}
                </Text>
              </View>
            }
            ListFooterComponent={
              bookings.length < total ? (
                <Pressable
                  onPress={() => load(Math.floor(bookings.length / PAGE_SIZE) + 1, true)}
                  disabled={loadingMore}
                  className="items-center py-4"
                >
                  {loadingMore ? (
                    <ActivityIndicator color={primary} />
                  ) : (
                    <Text className="font-semibold text-primary dark:text-primary-dark">
                      {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.LOAD_MORE)}
                    </Text>
                  )}
                </Pressable>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => {
              const name = passengerLabel(item, travelerLabel);
              const initial = name.trim().charAt(0).toUpperCase() || 'P';
              const tone = statusTone(item.status, isDark);
              const seats = seatSummary(item);
              const hire = rental || item.transportType === 'CAR_RENTAL';
              const vehicle = item.items?.find((row) => row.transportVehicle)?.transportVehicle;
              const carName = vehicle?.name || item.serviceClass || t(TRANSLATION_KEYS.TRANSPORT.FILTER_CAR);
              if (hire) {
                return (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/dashboard/transport-admin/bookings/[bookingId]',
                        params: { bookingId: item.id },
                      })
                    }
                    className="mb-3 overflow-hidden bg-white border rounded-2xl border-border dark:border-border-dark dark:bg-surface-dark"
                  >
                    <View className="flex-row items-center px-4 pt-4">
                      {vehicle?.imageUrl ? (
                        <Image source={{ uri: vehicle.imageUrl }} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 12 }} resizeMode="cover" />
                      ) : (
                      <View className="items-center justify-center w-11 h-11 mr-3 rounded-2xl bg-primary/10">
                        <Ionicons name="car-sport" size={20} color={primary} />
                      </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-text dark:text-text-dark" numberOfLines={1}>
                          {carName}
                        </Text>
                        <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                          {[vehicle?.licensePlate, item.confirmationCode].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: tone.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: tone.fg, fontSize: 11, fontWeight: '700' }}>
                          {operatorStatusLabel(item.status, t)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row mx-4 mt-3 overflow-hidden border rounded-xl border-border dark:border-border-dark">
                      <View className="flex-1 px-3 py-2.5">
                        <Text className="text-xs text-muted dark:text-muted-dark">
                          {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL)}
                        </Text>
                        <Text className="mt-1 text-sm font-semibold text-text dark:text-text-dark">{dayPart(item.departureDateTime)}</Text>
                        <Text className="text-xs text-muted dark:text-muted-dark">{timePart(item.departureDateTime)}</Text>
                      </View>
                      <View className="w-px bg-border dark:bg-border-dark" />
                      <View className="flex-1 px-3 py-2.5">
                        <Text className="text-xs text-muted dark:text-muted-dark">
                          {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL)}
                        </Text>
                        <Text className="mt-1 text-sm font-semibold text-text dark:text-text-dark">{dayPart(item.arrivalDateTime)}</Text>
                        <Text className="text-xs text-muted dark:text-muted-dark">{timePart(item.arrivalDateTime)}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between px-4 py-3">
                      <Text className="flex-1 mr-3 text-sm text-text dark:text-text-dark" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="text-base font-bold text-text dark:text-text-dark">
                        ৳{Number(item.totalPrice).toLocaleString()}
                      </Text>
                    </View>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/dashboard/transport-admin/bookings/[bookingId]',
                      params: { bookingId: item.id },
                    })
                  }
                  className="p-4 mb-3 bg-white border rounded-2xl border-border dark:border-border-dark dark:bg-surface-dark"
                >
                  <View className="flex-row items-center">
                    <View className="items-center justify-center w-11 h-11 mr-3 rounded-full bg-primary/10">
                      <Text className="text-base font-bold text-primary dark:text-primary-dark">{initial}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-text dark:text-text-dark" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                        {item.confirmationCode}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: tone.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: tone.fg, fontSize: 11, fontWeight: '700' }}>
                        {operatorStatusLabel(item.status, t)}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-sm font-medium text-text dark:text-text-dark">
                    {rental || item.transportType === 'CAR_RENTAL'
                      ? item.departureLocation
                      : `${item.departureLocation} → ${item.arrivalLocation}`}
                  </Text>
                  <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                    {rental || item.transportType === 'CAR_RENTAL'
                      ? `${formatTripDateTime(item.departureDateTime)} → ${formatTripDateTime(item.arrivalDateTime)}`
                      : formatTripDateTime(item.departureDateTime)}
                  </Text>
                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-sm text-text dark:text-text-dark">{seats}</Text>
                    <Text className="text-sm font-semibold text-text dark:text-text-dark">
                      ৳{Number(item.totalPrice).toLocaleString()} · {operatorStatusLabel(item.paymentStatus, t)}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
