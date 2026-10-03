import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyHotel } from '../../../../services/api/users';
import { fetchHotelStayAvailability } from '../../../../services/api/hotels';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { formatDeskDay } from '../../../../utilities/hotelDesk';

const SHIFTS = [
  { id: 'ALL_DAY', label: 'All day' },
  { id: 'MORNING', label: 'Morning' },
  { id: 'AFTERNOON', label: 'Afternoon' },
  { id: 'NIGHT', label: 'Night' },
] as const;

type ShiftId = (typeof SHIFTS)[number]['id'];

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function toISODate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

interface CellValue {
  [roomTypeId: string]: number | null;
}

export default function HotelAvailabilityScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const [weekStart, setWeekStart] = useState(startOfToday);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<{ id: string; label: string }[]>([]);
  const [cells, setCells] = useState<Record<string, CellValue>>({});

  const load = useCallback(async (start: Date, id: string) => {
    setLoading(true);
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
    const names = new Map<string, string>();
    const nextCells: Record<string, CellValue> = {};

    await Promise.all(days.flatMap((day) => SHIFTS.map(async (shift) => {
      const dayKey = toISODate(day);
      const cellKey = `${dayKey}:${shift.id}`;
      try {
        const data = await fetchHotelStayAvailability(id, dayKey, shift.id as ShiftId);
        const rows = data?.availableRoomsByType || [];
        const values: CellValue = {};
        rows.forEach((row) => {
          if (!row.roomTypeId) return;
          names.set(row.roomTypeId, row.roomType || row.roomTypeId);
          values[row.roomTypeId] = typeof row.availableRooms === 'number' ? row.availableRooms : null;
        });
        nextCells[cellKey] = values;
      } catch {
        nextCells[cellKey] = {};
      }
    })));

    setRoomTypes([...names.entries()].map(([idKey, label]) => ({ id: idKey, label })));
    setCells(nextCells);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const hotels = await getMyHotel();
        const id = Array.isArray(hotels) ? hotels[0]?.id : null;
        if (!mounted) return;
        setHotelId(id || null);
        if (id) await load(weekStart, id);
        else setLoading(false);
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load, weekStart]);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">Week availability</Text>
        <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
          These counts come from bookings for that stay. They are not the catalog open for sale numbers on the hotel page.
        </Text>
        <View className="flex-row gap-2 mt-4">
          <Pressable onPress={() => setWeekStart((current) => addDays(current, -7))} className="px-3 py-2 border rounded-full border-border dark:border-border-dark">
            <Text className="text-sm font-semibold text-text dark:text-text-dark">Previous</Text>
          </Pressable>
          <Pressable onPress={() => setWeekStart((current) => addDays(current, 7))} className="px-3 py-2 border rounded-full border-border dark:border-border-dark">
            <Text className="text-sm font-semibold text-text dark:text-text-dark">Next</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator className="mt-8" size="large" color={theme.colors.primary} />
        ) : !hotelId ? (
          <Text className="mt-6 text-sm text-muted dark:text-muted-dark">No hotel is assigned to this account.</Text>
        ) : roomTypes.length === 0 ? (
          <Text className="mt-6 text-sm text-muted dark:text-muted-dark">No room types returned for this week.</Text>
        ) : (
          <ScrollView horizontal className="mt-6">
            <View>
              <View className="flex-row">
                <Text className="w-24 text-xs font-semibold text-muted dark:text-muted-dark">Room type</Text>
                {days.map((day) => (
                  <Text key={toISODate(day)} className="w-28 text-xs font-semibold text-text dark:text-text-dark">{formatDeskDay(day)}</Text>
                ))}
              </View>
              {roomTypes.map((roomType) => (
                <View key={roomType.id} className="flex-row py-3 border-t border-border dark:border-border-dark">
                  <Text className="w-24 text-xs font-semibold text-text dark:text-text-dark">{roomType.label}</Text>
                  {days.map((day) => (
                    <View key={toISODate(day)} className="w-28">
                      {SHIFTS.map((shift) => {
                        const values = cells[`${toISODate(day)}:${shift.id}`];
                        const count = values && roomType.id in values ? values[roomType.id] : null;
                        const failed = values && Object.keys(values).length === 0;
                        return (
                          <Text key={shift.id} className="text-xs text-text dark:text-text-dark">
                            {shift.label} {failed || count === null || count === undefined ? '—' : count}
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
