import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScroll } from '../../../../../components/ui/KeyboardAwareScroll';
import { format, parseISO } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../hooks/useTheme';
import theme from '../../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { useTransportOperator } from '../../../../../hooks/useTransportOperator';
import * as ImagePicker from 'expo-image-picker';
import { CoachCabinMap } from '../../../../../components/transportOperator/CoachCabinMap';
import { uploadCommunityImageToCloudinary } from '../../../../../services/api/cloudinaryUpload';
import {
  deleteTransportClass,
  deleteTransportLayout,
  deleteTransportTrip,
  getOperatorTransportTrips,
  getTransportLayouts,
  getTransportTripSeats,
  setTransportTripSeatSold,
  updateTransportClass,
  updateTransportLayout,
} from '../../../../../services/api/transports';
import { TransportLayoutRef, TransportSeat, TransportTrip } from '../../../../../types/transports';
import {
  coachTypeLabelKey,
  layoutCoachClass,
  layoutSeatCount,
  routeLabelFromRef,
} from '../../../../../utilities/coachOperator';
import { formatTripClock, formatTripDayKey } from '../../../../../utilities/transportFormat';
import { goBack } from '../../../../../utilities/navigation';

type DetailTab = 'overview' | 'seats' | 'departures';

export default function TransportAdminCoachDetailPage() {
  const router = useRouter();
  const { layoutId } = useLocalSearchParams<{ layoutId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const { transport, transportId, loading: opLoading } = useTransportOperator(true);

  const [layout, setLayout] = useState<TransportLayoutRef | null>(null);
  const [trips, setTrips] = useState<TransportTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [openTripId, setOpenTripId] = useState<string | null>(null);
  const [tripSeats, setTripSeats] = useState<TransportSeat[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [routeQuery, setRouteQuery] = useState('');
  const [markingSeatId, setMarkingSeatId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFare, setEditFare] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;

  const cabin = isDark ? '#23252D' : '#F3F4F6';
  const soldFill = isDark ? '#4B5563' : '#D1D5DB';
  const availableFill = isDark ? '#18191E' : '#FFFFFF';
  const ink = isDark ? '#F9FAFB' : '#111827';

  const reload = useCallback(async () => {
    if (!transportId || !layoutId) return;
    const [layouts, tripRows] = await Promise.all([
      getTransportLayouts(transportId),
      getOperatorTransportTrips(transportId),
    ]);
    setLayout(layouts.find((row) => row.id === layoutId) ?? null);
    setTrips(tripRows.filter((trip) => trip.layoutId === layoutId));
  }, [transportId, layoutId]);

  const openTripIdRef = React.useRef<string | null>(null);
  openTripIdRef.current = openTripId;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      reload()
        .then(async () => {
          const tripId = openTripIdRef.current;
          if (!tripId) return;
          try {
            const map = await getTransportTripSeats(tripId);
            setTripSeats(map.seats);
          } catch {
            setTripSeats([]);
          }
        })
        .catch(() => {
          setLayout(null);
          setTrips([]);
        })
        .finally(() => setLoading(false));
    }, [reload])
  );

  const coachClass = layout ? layoutCoachClass(layout) : null;
  const typeKey = coachTypeLabelKey(coachClass?.busServiceType);
  const imageUri = layout?.imageUrl || transport?.images?.[0]?.url || null;

  const mapCopy = useMemo(
    () => ({
      gateLabel: t(TRANSLATION_KEYS.TRANSPORT.BUS_GATE),
      wheelLabel: t(TRANSLATION_KEYS.TRANSPORT.BUS_WHEEL),
      windowLabel: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.WINDOW),
      aisleLabel: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.AISLE),
      muted,
      ink,
      soldFill,
      availableFill,
      cabin,
    }),
    [t, muted, ink, soldFill, availableFill, cabin]
  );

  const departureDays = useMemo(() => {
    const keys = new Set(trips.map((trip) => formatTripDayKey(trip.departureDateTime)));
    return [...keys].sort();
  }, [trips]);

  useEffect(() => {
    if (departureDays.length === 0) {
      setSelectedDay(null);
      return;
    }
    if (selectedDay && departureDays.includes(selectedDay)) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setSelectedDay(departureDays.find((day) => day >= today) ?? departureDays[0]);
  }, [departureDays, selectedDay]);

  const seatDayTrips = useMemo(() => {
    return trips
      .filter((trip) => formatTripDayKey(trip.departureDateTime) === selectedDay)
      .sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime));
  }, [trips, selectedDay]);

  const dayTrips = useMemo(() => {
    const needle = routeQuery.trim().toLowerCase();
    return trips
      .filter((trip) => formatTripDayKey(trip.departureDateTime) === selectedDay)
      .filter((trip) => {
        if (!needle) return true;
        const label = trip.route ? routeLabelFromRef(trip.route) : trip.coachLabel || '';
        return label.toLowerCase().includes(needle);
      })
      .sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime));
  }, [trips, selectedDay, routeQuery]);

  const markSeat = async (seat: TransportSeat) => {
    if (!openTripId || markingSeatId) return;
    if (!seat.isAvailable && !seat.operatorManaged) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.OCCUPANCY));
      return;
    }
    setMarkingSeatId(seat.id);
    try {
      const map = await setTransportTripSeatSold(openTripId, seat.id, seat.isAvailable);
      setTripSeats(map.seats);
      const free = map.seats.filter((row) => row.isAvailable).length;
      setTrips((current) =>
        current.map((trip) =>
          trip.id === openTripId
            ? { ...trip, availableSeatCount: free, totalSeatCount: map.seats.length }
            : trip
        )
      );
    } catch (error) {
      Alert.alert(
        t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setMarkingSeatId(null);
    }
  };

  const loadTripSeats = useCallback(async (tripId: string) => {
    setOpenTripId(tripId);
    setSeatsLoading(true);
    try {
      const map = await getTransportTripSeats(tripId);
      setTripSeats(map.seats);
    } catch {
      setTripSeats([]);
    } finally {
      setSeatsLoading(false);
    }
  }, []);

  const openTrip = async (tripId: string) => {
    if (openTripId === tripId) {
      setOpenTripId(null);
      setTripSeats([]);
      return;
    }
    await loadTripSeats(tripId);
  };

  useEffect(() => {
    if (tab !== 'seats') return;
    if (seatDayTrips.length === 0) return;
    if (openTripId && seatDayTrips.some((trip) => trip.id === openTripId)) return;
    void loadTripSeats(seatDayTrips[0].id);
  }, [tab, seatDayTrips, openTripId, loadTripSeats]);

  const startEdit = () => {
    if (!layout) return;
    setEditName(layout.name);
    setEditFare(coachClass?.basePrice != null ? String(coachClass.basePrice) : '');
    setPhotoUri(layout.imageUrl || null);
    setEditing(true);
    setTab('overview');
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const saveEdit = async () => {
    if (!layout) return;
    const fare = Number(editFare);
    if (!editName.trim() || !Number.isFinite(fare) || fare <= 0) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FILL_REQUIRED));
      return;
    }
    setBusy(true);
    try {
      let imageUrl = photoUri;
      if (photoUri && !photoUri.startsWith('http://') && !photoUri.startsWith('https://')) {
        imageUrl = await uploadCommunityImageToCloudinary({ uri: photoUri });
      }
      await updateTransportLayout(layout.id, {
        name: editName.trim(),
        imageUrl,
      });
      if (coachClass?.id) {
        await updateTransportClass(coachClass.id, {
          name: editName.trim(),
          basePrice: fare,
        });
      }
      setEditing(false);
      await reload();
    } catch (error: unknown) {
      Alert.alert(
        t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setBusy(false);
    }
  };

  const removeCoach = async () => {
    if (!layout) return;
    setBusy(true);
    try {
      await deleteTransportLayout(layout.id);
      if (coachClass?.id) {
        try {
          await deleteTransportClass(coachClass.id);
        } catch {
          // A shared fare group can stay after the coach itself is gone.
        }
      }
      goBack(router);
    } catch (error: unknown) {
      Alert.alert(
        t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteCoach = () => {
    Alert.alert(t(TRANSLATION_KEYS.COMMON.DELETE), t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DELETE_COACH_CONFIRM), [
      { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
      { text: t(TRANSLATION_KEYS.COMMON.DELETE), style: 'destructive', onPress: () => { void removeCoach(); } },
    ]);
  };

  const removeDeparture = async (tripId: string) => {
    setBusy(true);
    try {
      await deleteTransportTrip(tripId);
      if (openTripId === tripId) {
        setOpenTripId(null);
        setTripSeats([]);
      }
      await reload();
    } catch (error: unknown) {
      Alert.alert(
        t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteDeparture = (tripId: string) => {
    Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DELETE_DEPARTURE), t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DELETE_DEPARTURE_CONFIRM), [
      { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
      { text: t(TRANSLATION_KEYS.COMMON.DELETE), style: 'destructive', onPress: () => { void removeDeparture(tripId); } },
    ]);
  };

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.TAB_OVERVIEW) },
    { id: 'seats', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.TAB_SEATS) },
    { id: 'departures', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.TAB_DEPARTURES) },
  ];

  if (opLoading || loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  if (!layout) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 px-6 bg-background dark:bg-background-dark">
        <Pressable onPress={() => goBack(router)} className="pt-4">
          <Ionicons name="arrow-back" size={22} color={primary} />
        </Pressable>
        <Text className="mt-8 text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED)}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center mb-3">
          <Pressable onPress={() => goBack(router)} style={{ padding: 6, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={22} color={primary} />
          </Pressable>
          <Text className="flex-1 text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
            {layout.name}
          </Text>
          <Pressable
            onPress={startEdit}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.COMMON.EDIT)}
            style={{ padding: 8 }}
          >
            <Ionicons name="create-outline" size={22} color={primary} />
          </Pressable>
          <Pressable
            onPress={confirmDeleteCoach}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.COMMON.DELETE)}
            style={{ padding: 8 }}
          >
            <Ionicons name="trash-outline" size={22} color={errorColor} />
          </Pressable>
        </View>
        <View className="flex-row border-b border-border dark:border-border-dark">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                className={`flex-1 items-center py-3 border-b-2 ${active ? 'border-primary dark:border-primary-dark' : 'border-transparent'}`}
              >
                <Text className={`text-sm ${active ? 'font-semibold text-primary dark:text-primary-dark' : 'text-muted dark:text-muted-dark'}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <KeyboardAwareScroll className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {tab === 'overview' && editing ? (
          <View className="pt-4">
            <Pressable onPress={pickPhoto} className="mb-4 overflow-hidden rounded-2xl" style={{ height: 176 }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View className="items-center justify-center flex-1 bg-primary/10">
                  <Ionicons name="camera-outline" size={28} color={primary} />
                  <Text className="mt-2 text-sm font-semibold text-primary dark:text-primary-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_CAR_PHOTO)}
                  </Text>
                </View>
              )}
            </Pressable>
            <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STEP_COACH)}
            </Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              className="px-4 py-3 mb-4 text-base border rounded-2xl border-border dark:border-border-dark text-text dark:text-text-dark"
            />
            <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FARE)}
            </Text>
            <TextInput
              value={editFare}
              onChangeText={setEditFare}
              keyboardType="numeric"
              className="px-4 py-3 mb-4 text-base border rounded-2xl border-border dark:border-border-dark text-text dark:text-text-dark"
            />
            <Pressable
              disabled={busy}
              onPress={saveEdit}
              className="items-center py-4 rounded-2xl bg-primary dark:bg-primary-dark"
            >
              {busy ? <ActivityIndicator color="#fff" /> : (
                <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.COMMON.SAVE)}</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setEditing(false)} className="items-center py-3 mt-2">
              <Text className="font-semibold text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.COMMON.CANCEL)}</Text>
            </Pressable>
          </View>
        ) : null}

        {tab === 'overview' && !editing ? (
          <View className="pt-4">
            {imageUri ? (
              <Image source={{ uri: imageUri }} className="w-full h-44 mb-4 rounded-2xl" resizeMode="cover" />
            ) : (
              <View className="items-center justify-center w-full h-44 mb-4 rounded-2xl bg-primary/10">
                <Ionicons name="bus" size={48} color={primary} />
              </View>
            )}
            <View className="p-4 mb-4 rounded-2xl bg-surface dark:bg-surface-dark">
              <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STEP_COACH)}</Text>
              <Text className="mt-1 text-lg font-bold text-text dark:text-text-dark">{layout.name}</Text>
              {typeKey ? (
                <Text className="mt-2 text-sm text-text dark:text-text-dark">{t(typeKey)}</Text>
              ) : null}
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              <View className="flex-1 p-4 rounded-2xl bg-surface dark:bg-surface-dark">
                <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FARE)}</Text>
                <Text className="mt-1 text-lg font-bold text-text dark:text-text-dark">
                  {coachClass?.basePrice != null ? `৳${coachClass.basePrice}` : '—'}
                </Text>
              </View>
              <View className="flex-1 p-4 rounded-2xl bg-surface dark:bg-surface-dark">
                <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SEAT_COUNT)}</Text>
                <Text className="mt-1 text-lg font-bold text-text dark:text-text-dark">{layoutSeatCount(layout)}</Text>
              </View>
            </View>
            <Text className="mt-4 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.TRIPS_COUNT, { count: trips.length })}
            </Text>
          </View>
        ) : null}

        {tab === 'seats' ? (
          <View className="pt-4">
            <Text className="mb-3 text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SEAT_MANAGE_HINT)}
            </Text>
            {trips.length === 0 ? (
              <>
                <Text className="mb-3 text-sm text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NO_DEPARTURES)}
                </Text>
                <Pressable
                  onPress={() => setTab('departures')}
                  className="flex-row items-center justify-center py-3 mb-4 rounded-xl bg-primary dark:bg-primary-dark"
                >
                  <Ionicons name="calendar-outline" size={18} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">
                    {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.OPEN_DEPARTURES)}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
                  {departureDays.map((day) => {
                    const active = day === selectedDay;
                    const label = format(parseISO(`${day}T12:00:00`), 'EEE, d MMM');
                    return (
                      <Pressable
                        key={day}
                        onPress={() => {
                          setSelectedDay(day);
                          setOpenTripId(null);
                          setTripSeats([]);
                        }}
                        className={`px-3 py-2 rounded-full border ${active ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark' : 'border-border dark:border-border-dark'}`}
                      >
                        <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {seatDayTrips.length === 0 ? (
                  <Text className="text-sm text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NO_DEPARTURES_DAY)}
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
                    {seatDayTrips.map((trip) => {
                      const active = trip.id === openTripId;
                      return (
                        <Pressable
                          key={trip.id}
                          onPress={() => { void loadTripSeats(trip.id); }}
                          className={`px-3 py-2 rounded-xl border ${active ? 'border-primary dark:border-primary-dark' : 'border-border dark:border-border-dark'}`}
                        >
                          <Text className={`text-sm font-semibold ${active ? 'text-primary dark:text-primary-dark' : 'text-text dark:text-text-dark'}`}>
                            {formatTripClock(trip.departureDateTime)}
                          </Text>
                          <Text className="text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                            {trip.route ? routeLabelFromRef(trip.route) : trip.coachLabel || ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
                {seatsLoading ? <ActivityIndicator className="mt-4" color={primary} /> : null}
                {openTripId && !seatsLoading ? (
                  <View>
                    <View className="flex-row items-center mb-3">
                      <View className="w-4 h-4 mr-1 bg-white border rounded-sm" style={{ borderColor: ink }} />
                      <Text className="mr-4 text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT.AVAILABLE)}</Text>
                      <View className="w-4 h-4 mr-1 rounded-sm" style={{ backgroundColor: soldFill }} />
                      <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT.LEGEND_SOLD)}</Text>
                    </View>
                    <CoachCabinMap
                      seats={tripSeats}
                      showAvailability
                      onSeatPress={markSeat}
                      busySeatId={markingSeatId}
                      {...mapCopy}
                    />
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {tab === 'departures' ? (
          <View className="pt-4">
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/dashboard/transport-admin/coaches/schedule',
                  params: { layoutId: layout.id },
                })
              }
              className="flex-row items-center justify-center py-3 mb-4 rounded-xl bg-primary dark:bg-primary-dark"
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text className="ml-2 font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_DEPARTURE)}</Text>
            </Pressable>
            <Text className="mb-3 text-xs text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SEAT_MANAGE_HINT)}
            </Text>
            {trips.length === 0 ? (
              <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NO_DEPARTURES)}</Text>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
                  {departureDays.map((day) => {
                    const active = day === selectedDay;
                    const label = format(parseISO(`${day}T12:00:00`), 'EEE, d MMM');
                    return (
                      <Pressable
                        key={day}
                        onPress={() => {
                          setSelectedDay(day);
                          setOpenTripId(null);
                          setTripSeats([]);
                        }}
                        className={`px-3 py-2 rounded-full border ${active ? 'bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark' : 'border-border dark:border-border-dark'}`}
                      >
                        <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <TextInput
                  value={routeQuery}
                  onChangeText={setRouteQuery}
                  placeholder={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SEARCH_ROUTE)}
                  placeholderTextColor={muted}
                  className="px-3 py-3 mb-3 text-sm border rounded-xl border-border dark:border-border-dark text-text dark:text-text-dark"
                />
                {dayTrips.length === 0 ? (
                  <Text className="text-sm text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NO_DEPARTURES_DAY)}
                  </Text>
                ) : (
                  dayTrips.map((trip) => {
                    const open = openTripId === trip.id;
                    const free = trip.availableSeatCount;
                    const total = trip.totalSeatCount;
                    const sold = free != null && total != null ? total - free : null;
                    return (
                      <View
                        key={trip.id}
                        className={`px-3 py-3 mb-3 border rounded-xl ${open ? 'border-primary dark:border-primary-dark' : 'border-border dark:border-border-dark'}`}
                      >
                        <Pressable onPress={() => openTrip(trip.id)}>
                          <View className="flex-row items-center">
                            <View className="flex-1">
                              <Text className="text-xs text-muted dark:text-muted-dark">
                                {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DEPARTURE)}
                              </Text>
                              <Text className="text-xl font-bold text-text dark:text-text-dark">
                                {formatTripClock(trip.departureDateTime)}
                              </Text>
                            </View>
                            <Ionicons name="arrow-forward" size={16} color={muted} />
                            <View className="items-end flex-1">
                              <Text className="text-xs text-muted dark:text-muted-dark">
                                {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ARRIVAL)}
                              </Text>
                              <Text className="text-xl font-bold text-text dark:text-text-dark">
                                {formatTripClock(trip.arrivalDateTime)}
                              </Text>
                            </View>
                          </View>
                          <Text className="mt-2 text-sm font-medium text-text dark:text-text-dark">
                            {trip.route ? routeLabelFromRef(trip.route) : trip.coachLabel || ''}
                          </Text>
                          {sold != null && free != null ? (
                            <Text className="mt-1 text-xs text-primary dark:text-primary-dark">
                              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SOLD_FREE, { free, sold })}
                            </Text>
                          ) : null}
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDeleteDeparture(trip.id)}
                          disabled={busy}
                          className="self-start mt-3"
                        >
                          <Text className="text-sm font-semibold" style={{ color: errorColor }}>
                            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DELETE_DEPARTURE)}
                          </Text>
                        </Pressable>
                        {open && seatsLoading ? <ActivityIndicator className="mt-4" color={primary} /> : null}
                        {open && !seatsLoading ? (
                          <View className="mt-4">
                            <View className="flex-row items-center mb-3">
                              <View className="w-4 h-4 mr-1 bg-white border rounded-sm" style={{ borderColor: ink }} />
                              <Text className="mr-4 text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT.AVAILABLE)}</Text>
                              <View className="w-4 h-4 mr-1 rounded-sm" style={{ backgroundColor: soldFill }} />
                              <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.TRANSPORT.LEGEND_SOLD)}</Text>
                            </View>
                            <CoachCabinMap
                              seats={tripSeats}
                              showAvailability
                              onSeatPress={markSeat}
                              busySeatId={markingSeatId}
                              {...mapCopy}
                            />
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </>
            )}
          </View>
        ) : null}
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
