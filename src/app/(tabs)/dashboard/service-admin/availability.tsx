import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { appDateLocale } from '../../../../utilities/hotelDesk';
import { getMyHotel } from '../../../../services/api/users';
import { fetchHotelStayAvailability } from '../../../../services/api/hotels';
import { useTheme } from '../../../../hooks/useTheme';
import { tabBarClearance } from '../../../../hooks/useHideTabBar';
import theme from '../../../../constants/theme';
import { formatDeskDay } from '../../../../utilities/hotelDesk';

const STAYS = [
  { id: 'ALL_DAY', labelKey: TRANSLATION_KEYS.HOTEL_DESK.ALL_DAY, hintKey: TRANSLATION_KEYS.HOTEL_DESK.ALL_DAY_HINT },
  { id: 'MORNING', labelKey: TRANSLATION_KEYS.HOTEL_DESK.MORNING, hint: '08:00–15:00' },
  { id: 'AFTERNOON', labelKey: TRANSLATION_KEYS.HOTEL_DESK.AFTERNOON, hint: '15:00–22:00' },
  { id: 'NIGHT', labelKey: TRANSLATION_KEYS.HOTEL_DESK.NIGHT, hint: '22:00–08:00' },
] as const;

type StayId = (typeof STAYS)[number]['id'];

interface RoomCell {
  available: number | null;
  total: number | null;
}

type DayCells = Record<string, RoomCell> | null;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function sameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function toISODate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function shiftSlotForSale(
  row: { allowShiftBooking?: boolean; morningShiftPrice?: number; afternoonShiftPrice?: number; nightShiftPrice?: number },
  stay: 'MORNING' | 'AFTERNOON' | 'NIGHT',
): boolean {
  const price = stay === 'MORNING'
    ? row.morningShiftPrice
    : stay === 'AFTERNOON'
      ? row.afternoonShiftPrice
      : row.nightShiftPrice;
  return row.allowShiftBooking === true && typeof price === 'number' && price > 0;
}

function formatRoomLabel(label: string): string {
  return label
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function weekRangeLabel(start: Date, locale: ReturnType<typeof appDateLocale>): string {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.getDate()}–${formatDeskDay(end, locale)}`;
  }
  return `${formatDeskDay(start, locale)} – ${formatDeskDay(end, locale)}`;
}

type RoomStatus = 'open' | 'low' | 'sold' | 'unknown';

function roomStatus(available: number | null): RoomStatus {
  if (available === null) return 'unknown';
  if (available <= 0) return 'sold';
  if (available <= 2) return 'low';
  return 'open';
}

function statusLabel(status: RoomStatus, available: number | null, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (status === 'sold') return t(TRANSLATION_KEYS.HOTEL_DESK.SOLD_OUT);
  if (status === 'unknown') return '—';
  if (status === 'low') return t(TRANSLATION_KEYS.HOTEL_DESK.LEFT_COUNT, { count: available ?? 0 });
  return t(TRANSLATION_KEYS.HOTEL_DESK.FREE_COUNT, { count: available ?? 0 });
}

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HotelAvailabilityScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = appDateLocale(i18n.resolvedLanguage || i18n.language);
  const weekdays = Array.from({ length: 7 }, (_, index) => format(addDays(new Date(2024, 0, 7), index), 'EEE', { locale }));
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const trackColor = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];
  const today = startOfToday();

  const [weekStart, setWeekStart] = useState(today);
  const [stay, setStay] = useState<StayId>('ALL_DAY');
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [hotelAllowsShift, setHotelAllowsShift] = useState(false);
  const [hotelReady, setHotelReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<{ id: string; label: string }[]>([]);
  const [cells, setCells] = useState<Record<string, DayCells>>({});

  const palette = {
    open: isDark ? theme.colors['success-dark'] : theme.colors.success,
    low: isDark ? theme.colors['warning-dark'] : theme.colors.warning,
    sold: isDark ? theme.colors['error-dark'] : theme.colors.error,
    unknown: mutedColor,
  };

  const load = useCallback(async (start: Date, id: string, selectedStay: StayId) => {
    setLoading(true);
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
    const names = new Map<string, string>();
    const nextCells: Record<string, DayCells> = {};

    await Promise.all(days.map(async (day) => {
      const dayKey = toISODate(day);
      try {
        const data = await fetchHotelStayAvailability(id, dayKey, selectedStay);
        const rows = data?.availableRoomsByType || [];
        const values: Record<string, RoomCell> = {};
        rows.forEach((row) => {
          if (!row.roomTypeId) return;
          if (selectedStay !== 'ALL_DAY' && !shiftSlotForSale(row, selectedStay)) return;
          names.set(row.roomTypeId, row.roomType || row.roomTypeId);
          values[row.roomTypeId] = {
            available: typeof row.availableRooms === 'number' ? row.availableRooms : null,
            total: typeof row.totalRooms === 'number' ? row.totalRooms : null,
          };
        });
        nextCells[dayKey] = values;
      } catch {
        nextCells[dayKey] = null;
      }
    }));

    setRoomTypes([...names.entries()]
      .map(([idKey, label]) => ({ id: idKey, label: formatRoomLabel(label) }))
      .sort((left, right) => left.label.localeCompare(right.label)));
    setCells(nextCells);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const hotels = await getMyHotel();
        const hotel = Array.isArray(hotels) ? hotels[0] : null;
        const id = hotel?.id ?? null;
        if (!mounted) return;
        setHotelId(id || null);
        setHotelAllowsShift(hotel?.allowShiftBooking === true);
        if (hotel?.allowShiftBooking !== true) {
          setStay('ALL_DAY');
        }
      } catch {
        if (mounted) setHotelId(null);
      } finally {
        if (mounted) setHotelReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hotelReady) return;
    if (!hotelId) {
      setLoading(false);
      return;
    }
    void load(weekStart, hotelId, stay);
  }, [hotelReady, hotelId, weekStart, stay, load]);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const stayChoices = hotelAllowsShift ? STAYS : STAYS.filter((item) => item.id === 'ALL_DAY');
  const selectedStay = stayChoices.find((item) => item.id === stay) ?? stayChoices[0];
  const onThisWeek = sameDay(weekStart, today);

  const loadedDays = days.filter((day) => cells[toISODate(day)] != null);
  const fullyBookedDays = loadedDays.filter((day) => {
    const dayCells = cells[toISODate(day)];
    if (!dayCells || roomTypes.length === 0) return false;
    return roomTypes.every((roomType) => {
      const available = dayCells[roomType.id]?.available;
      return typeof available === 'number' && available <= 0;
    });
  }).length;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: tabBarClearance(insets.bottom) }}>
        <Pressable
          onPress={() => router.replace('/(tabs)/dashboard')}
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.HOTEL_DESK.BACK_TO_DASHBOARD)}
          hitSlop={8}
          style={{ padding: 6, alignSelf: 'flex-start' }}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>

        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.WEEK_TITLE)}</Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.HOTEL_DESK.WEEK_BODY)}
        </Text>

        <View
          className="flex-row items-center justify-between px-2 py-2 mt-5 border rounded-2xl"
          style={{ backgroundColor: surfaceColor, borderColor }}
        >
          <Pressable
            onPress={() => setWeekStart((current) => addDays(current, -7))}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.HOTEL_DESK.PREVIOUS_WEEK)}
            hitSlop={8}
            className="items-center justify-center w-10 h-10 rounded-full"
            style={{ backgroundColor: trackColor }}
          >
            <Ionicons name="chevron-back" size={18} color={textColor} />
          </Pressable>
          <View className="items-center flex-1 px-2">
            <Text className="text-base font-bold text-text dark:text-text-dark">{weekRangeLabel(weekStart, locale)}</Text>
            {onThisWeek ? (
              <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.THIS_WEEK)}</Text>
            ) : (
              <Pressable onPress={() => setWeekStart(startOfToday())} accessibilityRole="button" hitSlop={6}>
                <Text className="mt-0.5 text-xs font-semibold" style={{ color: primaryColor }}>{t(TRANSLATION_KEYS.HOTEL_DESK.JUMP_THIS_WEEK)}</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => setWeekStart((current) => addDays(current, 7))}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.HOTEL_DESK.NEXT_WEEK)}
            hitSlop={8}
            className="items-center justify-center w-10 h-10 rounded-full"
            style={{ backgroundColor: trackColor }}
          >
            <Ionicons name="chevron-forward" size={18} color={textColor} />
          </Pressable>
        </View>

        <Text className="mt-5 text-xs font-semibold tracking-wide uppercase text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.STAY)}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2" contentContainerStyle={{ gap: 8 }}>
          {stayChoices.map((item) => {
            const selected = item.id === stay;
            return (
              <Pressable
                key={item.id}
                onPress={() => setStay(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: selected ? primaryColor : surfaceColor,
                  borderWidth: 1,
                  borderColor: selected ? primaryColor : borderColor,
                }}
              >
                <Text className="text-sm font-semibold" style={{ color: selected ? '#fff' : textColor }}>{t(item.labelKey)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text className="mt-2 text-sm text-muted dark:text-muted-dark">{'hintKey' in selectedStay ? t(selectedStay.hintKey) : selectedStay.hint}</Text>

        <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-3">
          {([
            ['open', t(TRANSLATION_KEYS.HOTEL_DESK.OPEN)],
            ['low', t(TRANSLATION_KEYS.HOTEL_DESK.FEW_LEFT)],
            ['sold', t(TRANSLATION_KEYS.HOTEL_DESK.SOLD_OUT)],
          ] as const).map(([key, label]) => (
            <View key={key} className="flex-row items-center">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette[key], marginRight: 6 }} />
              <Text className="text-xs text-muted dark:text-muted-dark">{label}</Text>
            </View>
          ))}
        </View>

        {!hotelReady || loading ? (
          <ActivityIndicator className="mt-10" size="large" color={primaryColor} />
        ) : !hotelId ? (
          <Text className="mt-8 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.NO_HOTEL_ASSIGNED)}</Text>
        ) : roomTypes.length === 0 ? (
          <Text className="mt-8 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.NO_ROOM_TYPES_WEEK)}</Text>
        ) : (
          <View className="mt-5">
            <Text className="mb-3 text-sm text-muted dark:text-muted-dark">
              {fullyBookedDays > 0
                ? t(TRANSLATION_KEYS.HOTEL_DESK.DAYS_FULLY_BOOKED, { count: fullyBookedDays })
                : t(TRANSLATION_KEYS.HOTEL_DESK.NO_DAY_FULLY_BOOKED)}
            </Text>
            {days.map((day) => {
              const dayKey = toISODate(day);
              const dayCells = cells[dayKey];
              const isToday = sameDay(day, today);
              const freeCount = dayCells
                ? roomTypes.reduce((sum, roomType) => sum + Math.max(0, dayCells[roomType.id]?.available ?? 0), 0)
                : null;
              const daySoldOut = dayCells != null && roomTypes.every((roomType) => {
                const available = dayCells[roomType.id]?.available;
                return typeof available === 'number' && available <= 0;
              });

              return (
                <View
                  key={dayKey}
                  className="p-4 mb-3 border rounded-2xl"
                  style={{ backgroundColor: surfaceColor, borderColor: isToday ? primaryColor : borderColor }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-sm font-bold" style={{ color: isToday ? primaryColor : mutedColor }}>
                        {weekdays[day.getDay()]}
                      </Text>
                      <Text className="ml-2 text-base font-bold text-text dark:text-text-dark">{formatDeskDay(day, locale)}</Text>
                      {isToday ? (
                        <View className="px-2 py-0.5 ml-2 rounded-full" style={{ backgroundColor: tint(primaryColor, 0.14) }}>
                          <Text className="text-xs font-semibold" style={{ color: primaryColor }}>{t(TRANSLATION_KEYS.HOTEL_DESK.TODAY)}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-sm font-semibold" style={{ color: daySoldOut ? palette.sold : textColor }}>
                      {dayCells == null ? t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_LOAD) : daySoldOut ? t(TRANSLATION_KEYS.HOTEL_DESK.FULLY_BOOKED) : t(TRANSLATION_KEYS.HOTEL_DESK.FREE_COUNT, { count: freeCount ?? 0 })}
                    </Text>
                  </View>

                  {dayCells == null ? null : roomTypes.map((roomType, index) => {
                    const cell = dayCells[roomType.id];
                    const available = cell?.available ?? null;
                    const total = cell?.total ?? null;
                    const status = roomStatus(available);
                    const color = palette[status];
                    const showMeter = typeof total === 'number' && total > 0 && available !== null;
                    const remaining = showMeter ? Math.max(0, Math.min(1, available / total)) : 0;

                    return (
                      <View key={roomType.id} className={index === 0 ? 'mt-4' : 'mt-3'}>
                        <View className="flex-row items-center justify-between">
                          <Text className="flex-1 mr-3 text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
                            {roomType.label}
                          </Text>
                          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: tint(color, 0.14) }}>
                            <Text className="text-xs font-bold" style={{ color }}>{statusLabel(status, available, t)}</Text>
                          </View>
                        </View>
                        {showMeter ? (
                          <View className="h-1.5 mt-2 overflow-hidden rounded-full" style={{ backgroundColor: trackColor }}>
                            <View style={{ width: `${Math.round(remaining * 100)}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
                          </View>
                        ) : null}
                        {typeof total === 'number' ? (
                          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                            {available === null ? t(TRANSLATION_KEYS.HOTEL_DESK.NOT_LOADED) : t(TRANSLATION_KEYS.HOTEL_DESK.ROOMS_OF_TOTAL, { available, total })}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
