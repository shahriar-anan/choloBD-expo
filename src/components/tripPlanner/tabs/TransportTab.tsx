/**
 * Transport tab — plan stop preferences plus live bookings fetched by id.
 */

import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TripPlan } from '../../../types/trips';
import { TransportBooking } from '../../../types/transports';
import { getTransportBookingById } from '../../../services/api/transportBookings';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';

interface TransportTabProps {
  trip: TripPlan;
}

export function TransportTab({ trip }: TransportTabProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const [liveBookings, setLiveBookings] = useState<TransportBooking[]>([]);

  const preferenceStops = (trip.userSegments || []).filter((s) => s.customTransport);
  const bookingIds = Array.from(
    new Set(
      (trip.userSegments || [])
        .map((segment) => segment.transportBookingId)
        .filter((id): id is string => Boolean(id))
    )
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const rows: TransportBooking[] = [];
      for (const bookingId of bookingIds) {
        try {
          rows.push(await getTransportBookingById(bookingId));
        } catch {
          // Stale ids on the plan are not shown as live bookings.
        }
      }
      if (!cancelled) {
        setLiveBookings(rows);
      }
    };
    if (bookingIds.length > 0) {
      load();
    } else {
      setLiveBookings([]);
    }
    return () => {
      cancelled = true;
    };
  }, [bookingIds.join(',')]);

  const openSearch = () => {
    router.push('/(tabs)/explore/transport-search');
  };

  return (
    <View className="px-2">
      <Pressable
        onPress={openSearch}
        className="items-center py-3 mb-4 rounded-xl"
        style={{ backgroundColor: primaryColor }}
      >
        <Text className="font-semibold text-white">
          {t(TRANSLATION_KEYS.TRIP_PLANNER.TRANSPORT_BOOK_CTA)}
        </Text>
      </Pressable>

      {liveBookings.length > 0 ? (
        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.TRANSPORT_LINKED_TITLE)}
          </Text>
          {liveBookings.map((booking) => (
            <Pressable
              key={booking.id}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/dashboard/transport-bookings/[bookingId]',
                  params: { bookingId: booking.id },
                })
              }
              className="p-4 mb-3 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
            >
              <Text className="font-semibold text-text dark:text-text-dark">
                {booking.transport?.name || booking.transportType}
              </Text>
              <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                {booking.confirmationCode} · {booking.departureLocation} → {booking.arrivalLocation}
              </Text>
              <Text className="mt-2 text-xs" style={{ color: primaryColor }}>
                {t(TRANSLATION_KEYS.TRIP_PLANNER.TRANSPORT_OPEN_BOOKING)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {preferenceStops.length === 0 && liveBookings.length === 0 ? (
        <View className="items-center py-8">
          <Feather name="truck" size={36} color={mutedColor} />
          <Text className="mt-3 text-muted dark:text-muted-dark text-center">
            {t(TRANSLATION_KEYS.TRIP_PLANNER.TRANSPORT_EMPTY_TITLE)}
          </Text>
        </View>
      ) : (
        preferenceStops.map((seg) => (
          <View
            key={seg.id}
            className="p-4 mb-3 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
          >
            <View className="flex-row items-center mb-1">
              <Feather name="truck" size={14} color={primaryColor} />
              <Text className="ml-2 font-semibold text-text dark:text-text-dark">{seg.customTransport}</Text>
            </View>
            <Text className="text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.TRANSPORT_PREFERENCE_NOTE)}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRIP_PLANNER.DAY_PLAN_DAY, { day: seg.dayNumber })} · {seg.shortDescription}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
