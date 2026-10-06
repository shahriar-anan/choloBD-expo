import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { getTransportById, getTransportTrips, getTransports } from '../../../services/api/transports';
import { TransportOperator, TransportTrip } from '../../../types/transports';
import {
  BusServiceClassFilter,
  countTripsByServiceClass,
  filterTripsByServiceClass,
  tripIsSoldOut,
} from '../../../utilities/transportTripFilters';
import { formatTripClock } from '../../../utilities/transportFormat';
import { longDayLabel, nightsBetween } from '../../../utilities/hotelSearch';
import { useTransportBusCheckout } from '../../../context/TransportBusCheckoutContext';
import { useTransportSearch } from '../../../context/TransportSearchContext';

function tripTitle(trip: TransportTrip): string {
  if (trip.coachLabel) return trip.coachLabel;
  const layoutName = trip.layout?.name?.replace(/^API\s+/i, '').trim();
  if (layoutName) return layoutName;
  return trip.transport?.name ?? '';
}

function tripLabel(trip: TransportTrip): string {
  const origin = trip.route?.originLocation?.name ?? '';
  const dest = trip.route?.destinationLocation?.name ?? '';
  return `${origin} → ${dest}`;
}

export default function TransportResultsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    originId?: string;
    destinationId?: string;
    date?: string;
    returnDate?: string;
    leg?: string;
    locationId?: string;
    pickupName?: string;
    pickupDate?: string;
    returnDateRental?: string;
  }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { outbound } = useTransportBusCheckout();
  const { params: searchParams } = useTransportSearch();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const isBus = params.mode !== 'CAR_RENTAL';
  const isReturnLeg = params.leg === 'return';
  const searchOriginId = isReturnLeg ? params.destinationId : params.originId;
  const searchDestinationId = isReturnLeg ? params.originId : params.destinationId;
  const initialDate = (isReturnLeg ? params.returnDate : params.date) ?? params.date ?? '';

  const [activeDate, setActiveDate] = useState(initialDate);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TransportTrip[]>([]);
  const [operators, setOperators] = useState<TransportOperator[]>([]);
  const [serviceFilter, setServiceFilter] = useState<BusServiceClassFilter>('ALL');
  const [imageByTransportId, setImageByTransportId] = useState<Record<string, string>>({});

  const loadBus = useCallback(async () => {
    if (!searchOriginId || !searchDestinationId || !activeDate) {
      setTrips([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await getTransportTrips({
        originLocationId: searchOriginId,
        destinationLocationId: searchDestinationId,
        departureDate: activeDate,
      });
      setTrips(rows);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [searchOriginId, searchDestinationId, activeDate]);

  useFocusEffect(
    useCallback(() => {
      const next = isReturnLeg ? searchParams.returnDate : searchParams.date;
      if (next) setActiveDate(next);
    }, [isReturnLeg, searchParams.returnDate, searchParams.date])
  );

  useEffect(() => {
    if (!isBus) return;
    loadBus();
  }, [isBus, loadBus]);

  useEffect(() => {
    if (isBus) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (!params.locationId) {
          setOperators([]);
          return;
        }
        const page = await getTransports({
          locationId: params.locationId,
          transportType: 'CAR_RENTAL',
          page: 1,
          limit: 50,
        });
        if (!cancelled) setOperators(page.results);
      } catch {
        if (!cancelled) setOperators([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isBus, params.locationId]);

  useEffect(() => {
    if (!isBus || trips.length === 0) return;
    const missing = [
      ...new Set(
        trips
          .filter((trip) => !trip.transportImageUrl && !trip.transport?.images?.[0]?.url)
          .map((trip) => trip.transportId)
          .filter((id) => id && !imageByTransportId[id])
      ),
    ];
    if (missing.length === 0) return;
    let cancelled = false;
    const loadImages = async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        missing.map(async (transportId) => {
          try {
            const operator = await getTransportById(transportId);
            const url = operator.images?.[0]?.url;
            if (url) next[transportId] = url;
          } catch {
            // Cover photo is optional; the bus icon stays as fallback.
          }
        })
      );
      if (!cancelled && Object.keys(next).length > 0) {
        setImageByTransportId((current) => ({ ...current, ...next }));
      }
    };
    loadImages();
    return () => {
      cancelled = true;
    };
  }, [isBus, trips, imageByTransportId]);

  const counts = useMemo(() => countTripsByServiceClass(trips), [trips]);
  const visibleTrips = useMemo(
    () => filterTripsByServiceClass(trips, serviceFilter),
    [trips, serviceFilter]
  );

  const changeDate = () => {
    router.push({
      pathname: '/(tabs)/explore/transport-date',
      params: { which: isReturnLeg ? 'return' : 'journey' },
    });
  };

  const openTrip = (trip: TransportTrip) => {
    if (tripIsSoldOut(trip)) return;
    router.push({
      pathname: '/(tabs)/explore/transport-trip',
      params: {
        tripId: trip.id,
        transportId: trip.transportId,
        leg: isReturnLeg ? 'return' : 'outbound',
        returnDate: params.returnDate ?? '',
      },
    });
  };

  const title = isBus
    ? isReturnLeg
      ? t(TRANSLATION_KEYS.TRANSPORT.RETURN_TRIPS_TITLE)
      : t(TRANSLATION_KEYS.TRANSPORT.TRIPS_TITLE)
    : t(TRANSLATION_KEYS.TRANSPORT.OPERATORS_TITLE);

  const filterChip = (key: BusServiceClassFilter, label: string) => {
    const selected = serviceFilter === key;
    return (
      <Pressable
        key={key}
        onPress={() => setServiceFilter(key)}
        className="px-4 py-2 mr-2 rounded-full"
        style={{
          backgroundColor: selected ? primary : isDark ? '#1f1f1f' : '#f0f0f0',
        }}
      >
        <Text style={{ color: selected ? '#fff' : isDark ? '#fff' : '#333', fontSize: 13 }}>
          {label} ({counts[key]})
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-text dark:text-text-dark">{title}</Text>
          {isReturnLeg && outbound ? (
            <Text className="text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.RETURN_LEG_HINT)}
            </Text>
          ) : null}
        </View>
      </View>

      {isBus && activeDate ? (
        <View className="flex-row items-center justify-between px-4 mb-3">
          <View className="flex-row items-center flex-1 mr-3">
            <Ionicons name="calendar" size={18} color={primary} />
            <Text className="ml-2 text-base font-semibold text-text dark:text-text-dark" numberOfLines={1}>
              {longDayLabel(activeDate)}
            </Text>
          </View>
          <Pressable
            onPress={changeDate}
            className="px-3 py-2 rounded-full"
            style={{ backgroundColor: primary }}
          >
            <Text className="text-sm font-semibold text-white">
              {t(TRANSLATION_KEYS.TRANSPORT.CHANGE_DATE)}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {isBus ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3" style={{ flexGrow: 0 }}>
          {filterChip('ALL', t(TRANSLATION_KEYS.TRANSPORT.FILTER_ALL))}
          {filterChip('AC', t(TRANSLATION_KEYS.TRANSPORT.FILTER_AC))}
          {filterChip('NON_AC', t(TRANSLATION_KEYS.TRANSPORT.FILTER_NON_AC))}
        </ScrollView>
      ) : null}

      {loading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator color={primary} />
        </View>
      ) : isBus && visibleTrips.length === 0 ? (
        <View className="items-center justify-center flex-1 px-6">
          <Text className="text-base text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT.NO_TRIPS)}
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
          {isBus ? (
            visibleTrips.map((trip) => {
                const soldOut = tripIsSoldOut(trip);
                const imageUrl =
                  trip.transportImageUrl ||
                  trip.transport?.images?.[0]?.url ||
                  imageByTransportId[trip.transportId];
                return (
                  <Pressable
                    key={trip.id}
                    onPress={() => openTrip(trip)}
                    disabled={soldOut}
                    className="flex-row p-4 mb-3 border rounded-2xl border-border dark:border-border-dark opacity-100"
                    style={{ opacity: soldOut ? 0.55 : 1 }}
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        className="w-16 h-16 mr-3 rounded-xl bg-muted"
                      />
                    ) : (
                      <View
                        className="items-center justify-center w-16 h-16 mr-3 rounded-xl"
                        style={{ backgroundColor: isDark ? '#333' : '#eee' }}
                      >
                        <Ionicons name="bus" size={28} color={primary} />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-semibold text-text dark:text-text-dark">
                        {tripTitle(trip)}
                      </Text>
                      <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{tripLabel(trip)}</Text>
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-sm font-semibold text-text dark:text-text-dark">
                          {formatTripClock(trip.departureDateTime)} – {formatTripClock(trip.arrivalDateTime)}
                        </Text>
                        {trip.lowestFare != null ? (
                          <Text className="font-bold" style={{ color: primary }}>
                            ৳{trip.lowestFare}
                          </Text>
                        ) : null}
                      </View>
                      <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                        {soldOut
                          ? t(TRANSLATION_KEYS.TRANSPORT.SOLD_OUT)
                          : t(TRANSLATION_KEYS.TRANSPORT.SEATS_LEFT, {
                              count: trip.availableSeatCount ?? 0,
                            })}
                      </Text>
                    </View>
                  </Pressable>
                );
            })
          ) : (
            <>
              {params.pickupDate && params.returnDateRental ? (
                <View className="p-4 mb-4 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
                  <Text className="text-xs font-semibold uppercase text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT.PICKUP_LOCATION)}
                  </Text>
                  <Text className="mt-1 text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
                    {params.pickupName || t(TRANSLATION_KEYS.TRANSPORT.RENTAL)}
                  </Text>
                  <View className="flex-row items-center mt-3">
                    <View className="flex-1">
                      <Text className="text-xs text-muted dark:text-muted-dark">
                        {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL)}
                      </Text>
                      <Text className="mt-0.5 font-semibold text-text dark:text-text-dark">
                        {longDayLabel(params.pickupDate)}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={primary} style={{ marginHorizontal: 8 }} />
                    <View className="flex-1">
                      <Text className="text-xs text-muted dark:text-muted-dark">
                        {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL)}
                      </Text>
                      <Text className="mt-0.5 font-semibold text-text dark:text-text-dark">
                        {longDayLabel(params.returnDateRental)}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-sm font-semibold" style={{ color: primary }}>
                    {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_DAYS, {
                      count: Math.max(1, nightsBetween(params.pickupDate, params.returnDateRental)),
                    })}
                  </Text>
                </View>
              ) : null}
              {operators.length === 0 ? (
                <View className="items-center px-6 py-16">
                  <View
                    className="items-center justify-center w-16 h-16 mb-4 rounded-full"
                    style={{ backgroundColor: `${primary}18` }}
                  >
                    <Ionicons name="car-outline" size={30} color={primary} />
                  </View>
                  <Text className="text-base font-semibold text-center text-text dark:text-text-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT.NO_OPERATORS)}
                  </Text>
                </View>
              ) : (
                operators.map((operator) => {
                  const imageUrl = operator.images?.[0]?.url;
                  const place = operator.location?.city || operator.location?.district || operator.location?.name || '';
                  const vehicleCount = operator._count?.vehicles;
                  const amenities = (operator.amenities ?? []).slice(0, 2);
                  return (
                    <Pressable
                      key={operator.id}
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/explore/transport-rental',
                          params: {
                            transportId: operator.id,
                            pickupDate: params.pickupDate,
                            returnDate: params.returnDateRental ?? params.returnDate,
                            pickupName: params.pickupName ?? '',
                          },
                        })
                      }
                      className="flex-row mb-3 overflow-hidden bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
                    >
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={{ width: 108, height: 128 }} />
                      ) : (
                        <View
                          className="items-center justify-center"
                          style={{ width: 108, height: 128, backgroundColor: `${primary}14` }}
                        >
                          <Ionicons name="car" size={32} color={primary} />
                        </View>
                      )}
                      <View className="justify-center flex-1 px-3 py-3">
                        <Text className="text-base font-bold text-text dark:text-text-dark" numberOfLines={1}>
                          {operator.name}
                        </Text>
                        {place ? (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="location-outline" size={14} color={isDark ? theme.colors['muted-dark'] : theme.colors.muted} />
                            <Text className="ml-1 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                              {place}
                            </Text>
                          </View>
                        ) : null}
                        <View className="flex-row items-center mt-2">
                          {operator.rating != null && operator.rating > 0 ? (
                            <View className="flex-row items-center mr-3">
                              <Ionicons name="star" size={13} color={theme.colors.warning} />
                              <Text className="ml-1 text-xs font-semibold text-text dark:text-text-dark">
                                {operator.rating.toFixed(1)}
                              </Text>
                            </View>
                          ) : null}
                          {vehicleCount != null ? (
                            <Text className="text-xs text-muted dark:text-muted-dark">
                              {t(TRANSLATION_KEYS.TRANSPORT.VEHICLE_COUNT, { count: vehicleCount })}
                            </Text>
                          ) : null}
                        </View>
                        {amenities.length > 0 ? (
                          <Text className="mt-2 text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                            {amenities.join(' · ')}
                          </Text>
                        ) : (
                          <Text className="mt-2 text-xs font-semibold" style={{ color: primary }}>
                            {t(TRANSLATION_KEYS.TRANSPORT.SEE_CARS)}
                          </Text>
                        )}
                      </View>
                      <View className="items-center justify-center pr-3">
                        <Ionicons name="chevron-forward" size={18} color={primary} />
                      </View>
                    </Pressable>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
