import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useTransportBookingLogic } from '../../../hooks/useTransportBookingLogic';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { getTransportById, getTransportVehicles } from '../../../services/api/transports';
import { TransportOperator, TransportVehicle } from '../../../types/transports';

function toPickupIso(date: string): string {
  return new Date(`${date}T10:00:00`).toISOString();
}

function toReturnIso(date: string): string {
  return new Date(`${date}T10:00:00`).toISOString();
}

export default function TransportRentalPage() {
  const router = useRouter();
  const { transportId, pickupDate, returnDate } = useLocalSearchParams<{
    transportId: string;
    pickupDate: string;
    returnDate: string;
  }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { createBooking, submitting } = useTransportBookingLogic();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState<TransportOperator | null>(null);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);

  useEffect(() => {
    if (!transportId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [transport, rows] = await Promise.all([
          getTransportById(transportId),
          getTransportVehicles({
            transportId,
            checkInDate: pickupDate ? toPickupIso(pickupDate) : undefined,
            checkOutDate: returnDate ? toReturnIso(returnDate) : undefined,
          }),
        ]);
        if (!cancelled) {
          setOperator(transport);
          setVehicles(rows);
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
  }, [transportId, pickupDate, returnDate, t]);

  const book = async (vehicle: TransportVehicle) => {
    if (!transportId || !pickupDate || !returnDate) return;
    if (vehicle.isAvailable === false) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.UNAVAILABLE));
      return;
    }
    const result = await createBooking({
      transportId,
      transportVehicleId: vehicle.id,
      departureDateTime: toPickupIso(pickupDate),
      arrivalDateTime: toReturnIso(returnDate),
    });
    if (!result || result.kind !== 'single') return;
    router.replace({
      pathname: '/(tabs)/explore/transport-payment',
      params: { bookingId: result.booking.id },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
        </Pressable>
        <Text className="text-xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRANSPORT.VEHICLES_TITLE)}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator className="mt-8" color={primary} />
      ) : (
        <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 32 }}>
          <Text className="mb-4 font-semibold text-text dark:text-text-dark">{operator?.name}</Text>
          {vehicles.length === 0 ? (
            <Text className="text-center text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT.NO_VEHICLES)}
            </Text>
          ) : (
            vehicles.map((vehicle) => {
              const available = vehicle.isAvailable !== false;
              return (
                <View
                  key={vehicle.id}
                  className="p-4 mb-3 border rounded-xl border-border dark:border-border-dark"
                >
                  <Text className="font-semibold text-text dark:text-text-dark">
                    {vehicle.name || vehicle.licensePlate || vehicle.id}
                  </Text>
                  <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                    {vehicle.transportClass?.name} · ৳{vehicle.transportClass?.basePrice ?? 0}
                  </Text>
                  <Text className="mt-1 text-xs" style={{ color: available ? primary : muted }}>
                    {available ? t(TRANSLATION_KEYS.TRANSPORT.AVAILABLE) : t(TRANSLATION_KEYS.TRANSPORT.UNAVAILABLE)}
                  </Text>
                  <Pressable
                    onPress={() => book(vehicle)}
                    disabled={!available || submitting}
                    className="items-center py-3 mt-3 rounded-xl"
                    style={{ backgroundColor: !available || submitting ? muted : primary }}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="font-semibold text-white">
                        {t(TRANSLATION_KEYS.TRANSPORT.BOOK_VEHICLE)}
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
