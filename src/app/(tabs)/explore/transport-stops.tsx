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
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { getTransportTripById } from '../../../services/api/transports';
import { TransportRouteStop, TransportTrip } from '../../../types/transports';
import { useTransportBusCheckout } from '../../../context/TransportBusCheckoutContext';
import { useTransportSearch } from '../../../context/TransportSearchContext';
import { formatTripClock } from '../../../utilities/transportFormat';

function stopTimeLabel(trip: TransportTrip | null, stop: TransportRouteStop): string {
  if (!trip?.departureDateTime) return '';
  const offset = stop.arrivalOffsetMinutes ?? 0;
  const when = new Date(new Date(trip.departureDateTime).getTime() + offset * 60 * 1000);
  return formatTripClock(when.toISOString());
}

export default function TransportStopsPage() {
  const router = useRouter();
  const { returnDate } = useLocalSearchParams<{ returnDate?: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { outbound, returnLeg, setStops } = useTransportBusCheckout();
  const isFocused = useIsFocused();
  const { params: searchParams } = useTransportSearch();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<TransportTrip | null>(null);
  const [boardingId, setBoardingId] = useState<string | null>(null);
  const [droppingId, setDroppingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) return;
    if (!outbound?.tripId) {
      router.replace('/(tabs)/explore/transport-search');
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const row = await getTransportTripById(outbound.tripId);
        if (!cancelled) setTrip(row);
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
  }, [outbound?.tripId, router, t, isFocused]);

  const stops = useMemo(
    () => [...(trip?.route?.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder),
    [trip]
  );

  const boardingStops = stops;
  const droppingStops = useMemo(() => {
    if (!boardingId) return [];
    const boarding = stops.find((stop) => stop.id === boardingId);
    if (!boarding) return [];
    return stops.filter((stop) => stop.stopOrder > boarding.stopOrder);
  }, [stops, boardingId]);

  const openDirections = (stop: TransportRouteStop) => {
    if (stop.latitude == null || stop.longitude == null) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
    Linking.openURL(url).catch(() => undefined);
  };

  const continueNext = () => {
    if (!boardingId || !droppingId) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.STOPS_REQUIRED));
      return;
    }
    setStops(boardingId, droppingId);
    const returnDay = returnDate?.trim() || searchParams.returnDate;
    const hasReturn = Boolean(returnDay) && !returnLeg;
    if (hasReturn && searchParams.from?.locationId && searchParams.to?.locationId) {
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
  };

  const renderStop = (
    stop: TransportRouteStop,
    selected: boolean,
    onSelect: () => void,
    showDirections: boolean
  ) => (
    <Pressable
      key={stop.id}
      onPress={onSelect}
      className="p-4 mb-2 border rounded-xl border-border dark:border-border-dark"
      style={{ borderColor: selected ? primary : undefined, borderWidth: selected ? 2 : 1 }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="font-semibold text-text dark:text-text-dark">{stop.name}</Text>
          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
            {stopTimeLabel(trip, stop)}
          </Text>
        </View>
        {showDirections && stop.latitude != null && stop.longitude != null ? (
          <Pressable
            onPress={() => openDirections(stop)}
            className="p-2"
            accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT.OPEN_MAPS)}
          >
            <Ionicons name="navigate" size={22} color={primary} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
        </Pressable>
        <Text className="text-xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRANSPORT.STOPS_TITLE)}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator className="mt-8" color={primary} />
      ) : (
        <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 120 }}>
          <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT.BOARDING_POINT)}
          </Text>
          {boardingStops.map((stop) =>
            renderStop(stop, boardingId === stop.id, () => {
              setBoardingId(stop.id);
              if (droppingId) {
                const drop = stops.find((row) => row.id === droppingId);
                if (drop && drop.stopOrder <= stop.stopOrder) setDroppingId(null);
              }
            }, true)
          )}
          <Text className="mt-4 mb-2 text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT.DROPPING_POINT)}
          </Text>
          {droppingStops.length === 0 ? (
            <Text className="text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.PICK_BOARDING_FIRST)}
            </Text>
          ) : (
            droppingStops.map((stop) =>
              renderStop(stop, droppingId === stop.id, () => setDroppingId(stop.id), true)
            )
          )}
        </ScrollView>
      )}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background dark:bg-background-dark">
        <Pressable onPress={continueNext} className="items-center py-4 rounded-xl" style={{ backgroundColor: primary }}>
          <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT.CONTINUE)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
