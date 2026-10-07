import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTransportOperator } from '../../hooks/useTransportOperator';
import { getTransportTrips } from '../../services/api/transports';
import { getTransportBookings } from '../../services/api/transportBookings';
import { TransportBooking, TransportTrip } from '../../types/transports';
import { formatTripClock } from '../../utilities/transportFormat';
import { routeLabelFromRef } from '../../utilities/coachOperator';

const WINDOW_MS = 12 * 60 * 60 * 1000;

function localDay(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function passengerLabel(booking: TransportBooking): string {
  const itemName = booking.items?.find((item) => item.passengerName)?.passengerName;
  if (itemName) return itemName;
  const user = booking.user;
  if (!user) return booking.confirmationCode;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.userName || user.email || booking.confirmationCode;
}

function inWindow(departure: string, arrival: string, now: number): 'now' | 'soon' | null {
  const start = new Date(departure).getTime();
  const end = new Date(arrival).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (start <= now && now <= end) return 'now';
  if (start > now && start <= now + WINDOW_MS) return 'soon';
  return null;
}

export function TransportLiveBoard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const { transportId, transportType, loading: opLoading } = useTransportOperator(true);
  const rental = transportType === 'CAR_RENTAL';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onRoad, setOnRoad] = useState<TransportTrip[]>([]);
  const [leaving, setLeaving] = useState<TransportTrip[]>([]);
  const [tickets, setTickets] = useState<TransportBooking[]>([]);
  const [outNow, setOutNow] = useState<TransportBooking[]>([]);
  const [pickups, setPickups] = useState<TransportBooking[]>([]);
  const [returnsDue, setReturnsDue] = useState<TransportBooking[]>([]);

  const load = useCallback(async () => {
    if (!transportId) {
      setOnRoad([]);
      setLeaving([]);
      setTickets([]);
      setOutNow([]);
      setPickups([]);
      setReturnsDue([]);
      setLoading(false);
      return;
    }
    const now = Date.now();
    if (rental) {
      const page = await getTransportBookings({
        departureFrom: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
        departureTo: new Date(now + WINDOW_MS).toISOString(),
        limit: 50,
        page: 1,
      });
      const active = page.results.filter((booking) => booking.status !== 'CANCELLED' && booking.status !== 'REFUNDED');
      setOutNow(active.filter((booking) => {
        const start = new Date(booking.departureDateTime).getTime();
        const end = new Date(booking.arrivalDateTime).getTime();
        return start <= now && now <= end;
      }));
      setPickups(active.filter((booking) => {
        const start = new Date(booking.departureDateTime).getTime();
        return start > now && start <= now + WINDOW_MS;
      }));
      setReturnsDue(active.filter((booking) => {
        const end = new Date(booking.arrivalDateTime).getTime();
        return new Date(booking.departureDateTime).getTime() <= now && end > now && end <= now + WINDOW_MS;
      }));
      setOnRoad([]);
      setLeaving([]);
      setTickets([]);
      return;
    }
    const [tripLists, bookingPage] = await Promise.all([
      Promise.all([-1, 0, 1].map((offset) => getTransportTrips({
        transportId,
        departureDate: localDay(offset),
      }))),
      getTransportBookings({
        departureFrom: new Date(now - WINDOW_MS).toISOString(),
        departureTo: new Date(now + WINDOW_MS).toISOString(),
        limit: 50,
        page: 1,
      }),
    ]);
    const trips = tripLists.flat().filter((trip) => trip.isActive !== false);
    const moving: TransportTrip[] = [];
    const upcoming: TransportTrip[] = [];
    for (const trip of trips) {
      const place = inWindow(trip.departureDateTime, trip.arrivalDateTime, now);
      if (place === 'now') moving.push(trip);
      if (place === 'soon') upcoming.push(trip);
    }
    moving.sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime));
    upcoming.sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime));
    setOnRoad(moving);
    setLeaving(upcoming);
    setTickets(
      bookingPage.results.filter((booking) => booking.status !== 'CANCELLED' && booking.status !== 'REFUNDED')
    );
  }, [transportId, rental]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch(() => {
          setOnRoad([]);
          setLeaving([]);
          setTickets([]);
          setOutNow([]);
          setPickups([]);
          setReturnsDue([]);
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    }, [load])
  );

  const openTrip = (trip: TransportTrip) => {
    if (!trip.layoutId) return;
    router.push(`/(tabs)/dashboard/transport-admin/coaches/${trip.layoutId}`);
  };

  const renderTrip = (trip: TransportTrip) => {
    const free = trip.availableSeatCount;
    const total = trip.totalSeatCount;
    const sold = free != null && total != null ? total - free : null;
    return (
      <Pressable
        key={trip.id}
        onPress={() => openTrip(trip)}
        className="p-4 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
      >
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">
            {formatTripClock(trip.departureDateTime)}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={muted} style={{ marginHorizontal: 10 }} />
          <Text className="text-lg font-semibold text-text dark:text-text-dark">
            {formatTripClock(trip.arrivalDateTime)}
          </Text>
        </View>
        <Text className="mt-2 text-base font-medium text-text dark:text-text-dark">
          {trip.route ? routeLabelFromRef(trip.route) : trip.coachLabel || ''}
        </Text>
        {sold != null && free != null ? (
          <Text className="mt-1 text-sm text-primary dark:text-primary-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SOLD_FREE, { free, sold })}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  const renderHire = (booking: TransportBooking) => {
    const vehicle = booking.items?.find((item) => item.transportVehicle)?.transportVehicle;
    const car = [vehicle?.name, vehicle?.licensePlate].filter(Boolean).join(' · ') || booking.serviceClass || booking.departureLocation;
    return (
      <Pressable
        key={booking.id}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/dashboard/transport-admin/bookings/[bookingId]',
            params: { bookingId: booking.id },
          })
        }
        className="p-4 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
      >
        <View className="flex-row items-center">
          <View className="items-center justify-center w-10 h-10 mr-3 rounded-2xl bg-primary/10">
            <Ionicons name="car-sport" size={18} color={primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-text dark:text-text-dark" numberOfLines={1}>
              {car}
            </Text>
            <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark" numberOfLines={1}>
              {passengerLabel(booking)}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center mt-3">
          <Text className="text-sm font-semibold text-text dark:text-text-dark">
            {formatTripClock(booking.departureDateTime)}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={muted} style={{ marginHorizontal: 8 }} />
          <Text className="text-sm font-semibold text-text dark:text-text-dark">
            {formatTripClock(booking.arrivalDateTime)}
          </Text>
        </View>
      </Pressable>
    );
  };

  const empty = rental
    ? !loading && outNow.length === 0 && pickups.length === 0 && returnsDue.length === 0
    : !loading && onRoad.length === 0 && leaving.length === 0 && tickets.length === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <View className="px-6 pt-6 pb-2">
          <Text className="text-sm text-muted dark:text-muted-dark">
            {t(rental ? TRANSLATION_KEYS.TRACKING.LIVE_HINT_RENTAL : TRANSLATION_KEYS.TRACKING.LIVE_HINT)}
          </Text>
          <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRACKING.LIVE_TITLE)}
          </Text>
        </View>

        {opLoading || loading ? (
          <ActivityIndicator className="mt-10" color={primary} />
        ) : empty ? (
          <View className="items-center px-8 mt-16">
            <Ionicons name="time-outline" size={36} color={primary} />
            <Text className="mt-4 text-base font-semibold text-center text-text dark:text-text-dark">
              {t(rental ? TRANSLATION_KEYS.TRACKING.NOTHING_NOW_RENTAL : TRANSLATION_KEYS.TRACKING.NOTHING_NOW)}
            </Text>
          </View>
        ) : (
          <View className="px-6 pt-4">
            {rental && outNow.length > 0 ? (
              <View className="mb-4">
                <Text className="mb-3 text-base font-bold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRACKING.OUT_NOW)}
                </Text>
                {outNow.map(renderHire)}
              </View>
            ) : null}
            {rental && pickups.length > 0 ? (
              <View className="mb-4">
                <Text className="mb-3 text-base font-bold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRACKING.PICKUPS)}
                </Text>
                {pickups.map(renderHire)}
              </View>
            ) : null}
            {rental && returnsDue.length > 0 ? (
              <View className="mb-4">
                <Text className="mb-3 text-base font-bold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRACKING.RETURNS_DUE)}
                </Text>
                {returnsDue.map(renderHire)}
              </View>
            ) : null}
            {onRoad.length > 0 ? (
              <View className="mb-4">
                <Text className="mb-3 text-base font-bold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRACKING.ON_THE_ROAD)}
                </Text>
                {onRoad.map(renderTrip)}
              </View>
            ) : null}
            {leaving.length > 0 ? (
              <View className="mb-4">
                <Text className="mb-3 text-base font-bold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRACKING.LEAVING_SOON)}
                </Text>
                {leaving.map(renderTrip)}
              </View>
            ) : null}
            {tickets.length > 0 ? (
              <View className="mb-4">
                <Text className="mb-3 text-base font-bold text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.TRACKING.TICKETS)}
                </Text>
                {tickets.map((booking) => (
                  <Pressable
                    key={booking.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/dashboard/transport-admin/bookings/[bookingId]',
                        params: { bookingId: booking.id },
                      })
                    }
                    className="p-4 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
                  >
                    <Text className="text-base font-semibold text-text dark:text-text-dark">
                      {passengerLabel(booking)}
                    </Text>
                    <Text className="mt-1 text-sm text-text dark:text-text-dark">
                      {booking.departureLocation} → {booking.arrivalLocation}
                    </Text>
                    <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                      {formatTripClock(booking.departureDateTime)} · {booking.confirmationCode}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
