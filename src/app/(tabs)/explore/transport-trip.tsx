import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import {
  createTransportSeatHolds,
  getTransportTripById,
  getTransportTripSeats,
} from '../../../services/api/transports';
import { TransportRouteStop, TransportSeat, TransportTrip } from '../../../types/transports';
import { useTransportBusCheckout } from '../../../context/TransportBusCheckoutContext';
import { useTransportSearch } from '../../../context/TransportSearchContext';
import { displayLabelMap, LaidOutSeat, layoutDeck } from '../../../utilities/busSeatLayout';
import { formatTripClock, sumSelectedSeatPrices } from '../../../utilities/transportFormat';

function groupByCompartment(seats: TransportSeat[]): { name: string; seats: TransportSeat[] }[] {
  const order: string[] = [];
  const map = new Map<string, TransportSeat[]>();
  seats.forEach((seat) => {
    const name = seat.compartmentName || 'Coach';
    if (!map.has(name)) {
      map.set(name, []);
      order.push(name);
    }
    map.get(name)!.push(seat);
  });
  return order.map((name) => ({ name, seats: map.get(name) ?? [] }));
}

function stopMoment(trip: TransportTrip | null, stop: TransportRouteStop): Date | null {
  if (!trip?.departureDateTime) return null;
  const offset = stop.arrivalOffsetMinutes ?? 0;
  return new Date(new Date(trip.departureDateTime).getTime() + offset * 60 * 1000);
}

function SteeringWheel({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export default function TransportTripPage() {
  const router = useRouter();
  const { tripId, transportId, leg, returnDate } = useLocalSearchParams<{
    tripId: string;
    transportId: string;
    leg?: string;
    returnDate?: string;
  }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { setOutboundHold, setReturnHold, setStops } = useTransportBusCheckout();
  const { params: searchParams } = useTransportSearch();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const success = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const isReturnLeg = leg === 'return';

  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [trip, setTrip] = useState<TransportTrip | null>(null);
  const [seats, setSeats] = useState<TransportSeat[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeDeck, setActiveDeck] = useState(0);
  const [stopTab, setStopTab] = useState<'boarding' | 'dropping'>('boarding');
  const [boardingId, setBoardingId] = useState<string | null>(null);
  const [droppingId, setDroppingId] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [tripRow, seatMap] = await Promise.all([
          getTransportTripById(tripId),
          getTransportTripSeats(tripId),
        ]);
        if (!cancelled) {
          setTrip(tripRow);
          setSeats(seatMap.seats);
          setActiveDeck(0);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : t(TRANSLATION_KEYS.TRANSPORT.LOAD_FAILED);
          Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tripId, t]);

  const decks = useMemo(() => groupByCompartment(seats), [seats]);
  const deck = decks[activeDeck] ?? decks[0];
  const rows = useMemo(() => layoutDeck(deck?.seats ?? []), [deck]);
  const seatLabels = useMemo(
    () => displayLabelMap(decks.map((item) => item.seats)),
    [decks]
  );
  const selectedSeats = useMemo(
    () => seats.filter((seat) => selected.includes(seat.id)),
    [seats, selected]
  );
  const totalFare = useMemo(() => sumSelectedSeatPrices(selectedSeats), [selectedSeats]);
  const stops = useMemo(() => {
    return [...(trip?.route?.stops ?? [])]
      .map((stop, index) => ({
        ...stop,
        stopOrder: Number.isFinite(Number(stop.stopOrder)) ? Number(stop.stopOrder) : index + 1,
      }))
      .sort((a, b) => a.stopOrder - b.stopOrder || a.name.localeCompare(b.name));
  }, [trip]);
  const originId = trip?.route?.originLocation?.id ?? null;
  const destinationId = trip?.route?.destinationLocation?.id ?? null;
  const boardingStops = useMemo(() => {
    const atOrigin = originId
      ? stops.filter((stop) => (stop.location?.id || stop.locationId) === originId)
      : [];
    if (atOrigin.length > 0) return atOrigin;
    if (stops.length <= 1) return stops;
    const lastOrder = stops[stops.length - 1].stopOrder;
    return stops.filter((stop) => stop.stopOrder < lastOrder);
  }, [stops, originId]);
  const droppingStops = useMemo(() => {
    const boarding = boardingId ? stops.find((stop) => stop.id === boardingId) : undefined;
    const afterOrder = boarding ? boarding.stopOrder : -1;
    const atDestination = destinationId
      ? stops.filter(
          (stop) =>
            (stop.location?.id || stop.locationId) === destinationId && stop.stopOrder > afterOrder
        )
      : [];
    if (atDestination.length > 0) return atDestination;
    if (stops.length <= 1) return [];
    const floor = boarding ? boarding.stopOrder : stops[0].stopOrder;
    return stops.filter((stop) => stop.stopOrder > floor);
  }, [stops, boardingId, destinationId]);
  const visibleStops = stopTab === 'boarding' ? boardingStops : droppingStops;

  const cabin = isDark ? '#23252D' : '#F3F4F6';
  const soldFill = isDark ? '#4B5563' : '#D1D5DB';
  const availableFill = isDark ? '#18191E' : '#FFFFFF';
  const ink = isDark ? '#F9FAFB' : '#111827';

  const toggleSeat = (seat: TransportSeat) => {
    if (!seat.isAvailable) return;
    setSelected((current) =>
      current.includes(seat.id) ? current.filter((id) => id !== seat.id) : [...current, seat.id]
    );
  };

  const openDirections = (stop: TransportRouteStop) => {
    if (stop.latitude == null || stop.longitude == null) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
    Linking.openURL(url).catch(() => undefined);
  };

  const continueWithHold = async () => {
    if (!transportId || !tripId) return;
    if (selected.length === 0) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.SELECT_SEATS));
      return;
    }
    if (!isReturnLeg && (!boardingId || !droppingId)) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.STOPS_REQUIRED));
      return;
    }
    setHolding(true);
    try {
      const hold = await createTransportSeatHolds(tripId, selected);
      const labeledSeats = selectedSeats.map((seat) => ({
        ...seat,
        seatLabel: seatLabels.get(seat.id) ?? seat.seatLabel,
      }));
      const legState = {
        tripId,
        transportId,
        seatIds: selected,
        seats: labeledSeats,
        holdExpiresAt: hold.expiresAt,
      };
      if (isReturnLeg) {
        setReturnHold(legState);
        router.push('/(tabs)/explore/transport-passengers');
        return;
      }
      setOutboundHold(legState);
      setStops(boardingId as string, droppingId as string);
      const returnDay = returnDate?.trim() || searchParams.returnDate;
      if (returnDay && searchParams.from?.locationId && searchParams.to?.locationId) {
        router.push({
          pathname: '/(tabs)/explore/transport-results',
          params: {
            mode: 'BUS',
            originId: searchParams.to.locationId,
            destinationId: searchParams.from.locationId,
            date: searchParams.date,
            returnDate: returnDay,
            leg: 'return',
          },
        });
        return;
      }
      router.push('/(tabs)/explore/transport-passengers');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t(TRANSLATION_KEYS.TRANSPORT.HOLD_FAILED);
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), message);
    } finally {
      setHolding(false);
    }
  };

  const renderSeat = (seat: LaidOutSeat) => {
    const isSelected = selected.includes(seat.id);
    const taken = !seat.isAvailable;
    const backgroundColor = taken ? soldFill : isSelected ? success : availableFill;
    const borderColor = taken ? soldFill : isSelected ? success : ink;
    const labelColor = taken ? (isDark ? '#D1D5DB' : '#4B5563') : isSelected ? '#fff' : ink;
    return (
      <Pressable
        key={seat.id}
        onPress={() => toggleSeat(seat)}
        disabled={taken}
        className="items-center justify-center"
        style={{
          width: 52,
          height: 40,
          marginHorizontal: 4,
          marginBottom: 8,
          borderRadius: 10,
          backgroundColor,
          borderWidth: 1.5,
          borderColor,
        }}
      >
        <Text style={{ color: labelColor, fontSize: 11, fontWeight: '600' }}>{seat.displayLabel}</Text>
      </Pressable>
    );
  };

  const renderStop = (stop: TransportRouteStop) => {
    const chosen = stopTab === 'boarding' ? boardingId === stop.id : droppingId === stop.id;
    const when = stopMoment(trip, stop);
    const timeLabel = when ? format(when, 'h:mm a') : formatTripClock(trip?.departureDateTime ?? '');
    const dateLabel = when ? format(when, 'dd MMM, yyyy') : '';
    return (
      <Pressable
        key={stop.id}
        onPress={() => {
          if (stopTab === 'boarding') {
            setBoardingId(stop.id);
            if (droppingId) {
              const drop = stops.find((row) => row.id === droppingId);
              if (drop && drop.stopOrder <= stop.stopOrder) setDroppingId(null);
            }
            return;
          }
          setDroppingId(stop.id);
        }}
        className="flex-row items-center py-3"
      >
        <View className="mr-3" style={{ width: 92 }}>
          <Text style={{ color: chosen ? success : textColor, fontWeight: '700', fontSize: 16 }}>
            {timeLabel}
          </Text>
          {dateLabel ? (
            <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{dateLabel}</Text>
          ) : null}
        </View>
        <Ionicons name="location-outline" size={16} color={chosen ? success : muted} />
        <Text className="flex-1 ml-2 text-sm font-medium text-text dark:text-text-dark">{stop.name}</Text>
        {stop.latitude != null && stop.longitude != null ? (
          <Pressable
            onPress={() => openDirections(stop)}
            className="p-2"
            accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT.OPEN_MAPS)}
          >
            <Ionicons name="navigate" size={18} color={primary} />
          </Pressable>
        ) : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="text-xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRANSPORT.SEATS_TITLE)}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator className="mt-8" color={primary} />
      ) : (
        <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 140 }}>
          <Text className="text-lg font-bold text-text dark:text-text-dark">
            {trip?.transport?.name || trip?.coachLabel}
          </Text>
          {trip?.coachLabel ? (
            <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{trip.coachLabel}</Text>
          ) : null}
          <View className="flex-row justify-between mt-4 mb-4">
            <View className="flex-1 pr-3">
              <Text className="text-xs tracking-wide text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.DEPARTURE)}
              </Text>
              <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">
                {trip?.route?.originLocation?.name}
              </Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark">
                {trip ? formatTripClock(trip.departureDateTime) : ''}
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark">
                {trip ? format(new Date(trip.departureDateTime), 'dd MMM, yyyy') : ''}
              </Text>
            </View>
            <View className="items-end flex-1 pl-3">
              <Text className="text-xs tracking-wide text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.TRANSPORT_BOOKING.ARRIVAL)}
              </Text>
              <Text className="mt-1 text-base font-bold text-right text-text dark:text-text-dark">
                {trip?.route?.destinationLocation?.name}
              </Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark">
                {trip ? formatTripClock(trip.arrivalDateTime) : ''}
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark">
                {trip ? format(new Date(trip.arrivalDateTime), 'dd MMM, yyyy') : ''}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <View className="w-4 h-4 mr-1 bg-white border rounded-sm" style={{ borderColor: ink }} />
            <Text className="mr-4 text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.AVAILABLE)}
            </Text>
            <View className="w-4 h-4 mr-1 rounded-sm" style={{ backgroundColor: soldFill }} />
            <Text className="mr-4 text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.LEGEND_SOLD)}
            </Text>
            <View className="w-4 h-4 mr-1 rounded-sm" style={{ backgroundColor: success }} />
            <Text className="text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.LEGEND_SELECTED)}
            </Text>
          </View>

          {decks.length > 1 ? (
            <View className="flex-row mb-3 overflow-hidden border-b border-border dark:border-border-dark">
              {decks.map((item, index) => {
                const active = index === activeDeck;
                return (
                  <Pressable
                    key={item.name}
                    onPress={() => setActiveDeck(index)}
                    className="items-center flex-1 py-3"
                    style={{ backgroundColor: active ? (isDark ? '#14532D' : '#DCFCE7') : 'transparent' }}
                  >
                    <Text style={{ color: active ? success : muted, fontWeight: '700', fontSize: 12 }}>
                      {item.name.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View className="px-3 pt-4 pb-2 mb-5 rounded-3xl" style={{ backgroundColor: cabin }}>
            <View className="flex-row items-center justify-between px-2 mb-4">
              <View className="items-center">
                <Ionicons name="enter-outline" size={22} color={muted} />
                <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT.BUS_GATE)}
                </Text>
              </View>
              <View className="items-center">
                <SteeringWheel color={muted} />
                <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT.BUS_WHEEL)}
                </Text>
              </View>
            </View>
            {rows.map((row) => {
              const leftSlots = row.variant === 'ac' ? 1 : 2;
              return (
                <View key={row.rowKey} className="flex-row items-start justify-center">
                  <View style={{ width: leftSlots * 60, flexDirection: 'row', justifyContent: 'flex-end' }}>
                    {row.left.map(renderSeat)}
                  </View>
                  <View style={{ width: 28 }} />
                  <View style={{ width: 120, flexDirection: 'row', justifyContent: 'flex-start' }}>
                    {row.right.map(renderSeat)}
                  </View>
                </View>
              );
            })}
          </View>

          {!isReturnLeg ? (
            <View className="mb-4">
              <Text className="mb-3 text-base font-bold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.TRANSPORT.BOARDING_AND_DROPPING)}
              </Text>
              <View className="flex-row p-1 mb-2 rounded-xl" style={{ backgroundColor: cabin }}>
                {(['boarding', 'dropping'] as const).map((tab) => {
                  const active = stopTab === tab;
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => setStopTab(tab)}
                      className="items-center flex-1 py-2 rounded-lg"
                      style={{ backgroundColor: active ? (isDark ? '#18191E' : '#FFFFFF') : 'transparent' }}
                    >
                      <Text style={{ color: active ? success : muted, fontWeight: '600' }}>
                        {tab === 'boarding'
                          ? t(TRANSLATION_KEYS.TRANSPORT.BOARDING_POINT)
                          : t(TRANSLATION_KEYS.TRANSPORT.DROPPING_POINT)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {visibleStops.length === 0 ? (
                <Text className="py-3 text-sm text-muted dark:text-muted-dark">
                  {stopTab === 'dropping'
                    ? t(TRANSLATION_KEYS.TRANSPORT.NO_DROPPING_POINTS)
                    : t(TRANSLATION_KEYS.TRANSPORT.STOPS_REQUIRED)}
                </Text>
              ) : (
                visibleStops.map(renderStop)
              )}
            </View>
          ) : null}
        </ScrollView>
      )}
      <View className="absolute bottom-0 left-0 right-0 p-4 border-t border-border dark:border-border-dark bg-background dark:bg-background-dark">
        <Text className="mb-2 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRANSPORT.SELECTED_SUMMARY, {
            count: selected.length,
            fare: totalFare,
          })}
        </Text>
        <Pressable
          onPress={continueWithHold}
          disabled={holding}
          className="items-center py-4 rounded-xl"
          style={{ backgroundColor: holding ? muted : primary }}
        >
          {holding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT.CONTINUE)}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
