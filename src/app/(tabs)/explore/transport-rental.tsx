import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientAppBar } from '../../../components/hotelSearch/HotelFlowChrome';
import { useTheme } from '../../../hooks/useTheme';
import { useTransportBookingLogic } from '../../../hooks/useTransportBookingLogic';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { getTransportById, getTransportVehicles } from '../../../services/api/transports';
import { TransportOperator, TransportVehicle } from '../../../types/transports';
import { formatMoney, longDayLabel, nightsBetween } from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

function toPickupIso(date: string): string {
  return new Date(`${date}T10:00:00`).toISOString();
}

function toReturnIso(date: string): string {
  return new Date(`${date}T10:00:00`).toISOString();
}

function titleCase(value?: string | null): string {
  if (!value) return '';
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function TransportRentalPage() {
  const router = useRouter();
  const { transportId, pickupDate, returnDate, pickupName } = useLocalSearchParams<{
    transportId: string;
    pickupDate: string;
    returnDate: string;
    pickupName?: string;
  }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { createBooking, submitting } = useTransportBookingLogic();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const success = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;

  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState<TransportOperator | null>(null);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const rentalDays = pickupDate && returnDate
    ? Math.max(1, nightsBetween(pickupDate, returnDate))
    : 1;

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
          setVehicles(rows.filter((row) => row.isAvailable !== false));
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
    if (!transportId || !pickupDate || !returnDate || submitting) return;
    if (vehicle.isAvailable === false) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.UNAVAILABLE));
      return;
    }
    setPendingId(vehicle.id);
    const result = await createBooking({
      transportId,
      transportVehicleId: vehicle.id,
      departureDateTime: toPickupIso(pickupDate),
      arrivalDateTime: toReturnIso(returnDate),
    });
    setPendingId(null);
    if (!result || result.kind !== 'single') return;
    router.replace({
      pathname: '/(tabs)/explore/transport-payment',
      params: { bookingId: result.booking.id },
    });
  };

  const place = pickupName || operator?.location?.city || operator?.location?.district || operator?.location?.name || '';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <GradientAppBar
        title={t(TRANSLATION_KEYS.TRANSPORT.VEHICLES_TITLE)}
        subtitle={operator?.name}
        onBack={() => goBack(router)}
      />
      {loading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator color={primary} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}>
          {pickupDate && returnDate ? (
            <View className="p-4 mb-4 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
              {place ? (
                <View className="flex-row items-center mb-3">
                  <Ionicons name="location" size={16} color={primary} />
                  <Text className="ml-2 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
                    {place}
                  </Text>
                </View>
              ) : null}
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-xs text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL)}
                  </Text>
                  <Text className="mt-0.5 font-semibold text-text dark:text-text-dark">
                    {longDayLabel(pickupDate)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={primary} style={{ marginHorizontal: 8 }} />
                <View className="flex-1">
                  <Text className="text-xs text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL)}
                  </Text>
                  <Text className="mt-0.5 font-semibold text-text dark:text-text-dark">
                    {longDayLabel(returnDate)}
                  </Text>
                </View>
              </View>
              <Text className="mt-3 text-sm font-semibold" style={{ color: primary }}>
                {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_DAYS, { count: rentalDays })}
              </Text>
            </View>
          ) : null}

          {vehicles.length === 0 ? (
            <View className="items-center px-6 py-16">
              <View
                className="items-center justify-center w-16 h-16 mb-4 rounded-full"
                style={{ backgroundColor: `${primary}18` }}
              >
                <Ionicons name="car-outline" size={30} color={primary} />
              </View>
              <Text className="text-base font-semibold text-center text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.TRANSPORT.NO_VEHICLES)}
              </Text>
            </View>
          ) : (
            vehicles.map((vehicle) => {
              const available = vehicle.isAvailable !== false;
              const daily = vehicle.transportClass?.basePrice ?? 0;
              const total = daily * rentalDays;
              const category = titleCase(vehicle.transportClass?.vehicleRentalCategory) || vehicle.transportClass?.name || '';
              const plate = vehicle.licensePlate || '';
              const busy = pendingId === vehicle.id;
              return (
                <View
                  key={vehicle.id}
                  className="p-4 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
                  style={{ opacity: available ? 1 : 0.7 }}
                >
                  <View className="flex-row">
                    {(vehicle.imageUrl || operator?.images?.[0]?.url) ? (
                      <Image source={{ uri: vehicle.imageUrl || operator?.images?.[0]?.url || '' }} style={{ width: 72, height: 72, borderRadius: 16 }} resizeMode="cover" />
                    ) : (
                    <View
                      className="items-center justify-center w-14 h-14 rounded-2xl"
                      style={{ backgroundColor: `${primary}14` }}
                    >
                      <Ionicons name="car-sport" size={26} color={primary} />
                    </View>
                    )}
                    <View className="flex-1 ml-3">
                      <Text className="text-base font-bold text-text dark:text-text-dark" numberOfLines={1}>
                        {vehicle.name || category || plate || t(TRANSLATION_KEYS.TRANSPORT.RENTAL)}
                      </Text>
                      <Text className="mt-1 text-sm text-muted dark:text-muted-dark" numberOfLines={1}>
                        {[category, plate].filter(Boolean).join(' · ')}
                      </Text>
                      <View
                        className="self-start px-2 py-1 mt-2 rounded-full"
                        style={{ backgroundColor: available ? `${success}20` : `${errorColor}20` }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: available ? success : errorColor }}>
                          {available
                            ? t(TRANSLATION_KEYS.TRANSPORT.AVAILABLE)
                            : t(TRANSLATION_KEYS.TRANSPORT.UNAVAILABLE)}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-base font-bold text-text dark:text-text-dark">
                        {formatMoney(daily)}
                      </Text>
                      <Text className="text-xs text-muted dark:text-muted-dark">
                        {t(TRANSLATION_KEYS.TRANSPORT.PER_DAY)}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-sm font-semibold text-text dark:text-text-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT.ESTIMATED_TOTAL, { amount: Math.round(total).toLocaleString('en-US') })}
                  </Text>
                  <Pressable
                    onPress={() => book(vehicle)}
                    disabled={!available || submitting}
                    className="items-center py-3 mt-3 rounded-full"
                    style={{ backgroundColor: !available || submitting ? muted : primary }}
                  >
                    {busy ? (
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
