import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { addMonths, format, isSameDay, isWithinInterval, startOfDay, startOfMonth } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { isPastDay, monthGrid } from '../../utilities/hotelSearch';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DateRangeCalendar({
    checkIn,
    checkOut,
    onChange,
}: {
    checkIn: string | null;
    checkOut: string | null;
    onChange: (checkIn: string, checkOut: string | null) => void;
}) {
    const { isDark } = useTheme();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const [anchor] = useState(() => startOfMonth(new Date()));
    const months = useMemo(() => Array.from({ length: 12 }, (_, index) => addMonths(anchor, index)), [anchor]);
    const start = checkIn ? startOfDay(new Date(checkIn)) : null;
    const end = checkOut ? startOfDay(new Date(checkOut)) : null;

    const selectDay = (day: Date) => {
        if (isPastDay(day)) {
            return;
        }
        const iso = format(day, 'yyyy-MM-dd');
        if (!start || (start && end)) {
            onChange(iso, null);
            return;
        }
        if (day <= start) {
            onChange(iso, null);
            return;
        }
        onChange(format(start, 'yyyy-MM-dd'), iso);
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}>
            {months.map((month) => (
                <View key={month.toISOString()} className="px-4 mb-6">
                    <Text className="mb-3 text-base font-bold text-center text-text dark:text-text-dark">
                        {format(month, 'MMMM yyyy')}
                    </Text>
                    <View className="flex-row mb-2">
                        {WEEKDAYS.map((day) => (
                            <Text key={day} className="flex-1 text-xs text-center text-muted dark:text-muted-dark">{day}</Text>
                        ))}
                    </View>
                    <View className="flex-row flex-wrap">
                        {monthGrid(month).map((day, index) => {
                            if (!day) {
                                return <View key={`empty-${index}`} style={{ width: '14.28%', height: 44 }} />;
                            }
                            const disabled = isPastDay(day);
                            const selectedStart = start ? isSameDay(day, start) : false;
                            const selectedEnd = end ? isSameDay(day, end) : false;
                            const inRange = start && end
                                ? isWithinInterval(day, { start, end }) && !selectedStart && !selectedEnd
                                : false;
                            const isToday = isSameDay(day, new Date());
                            return (
                                <Pressable
                                    key={day.toISOString()}
                                    disabled={disabled}
                                    onPress={() => selectDay(day)}
                                    style={{ width: '14.28%', height: 44 }}
                                    className="items-center justify-center"
                                >
                                    <View
                                        className="items-center justify-center w-9 h-9 rounded-full"
                                        style={{
                                            backgroundColor: selectedStart || selectedEnd ? primary : inRange ? `${primary}22` : 'transparent',
                                            borderWidth: isToday && !selectedStart && !selectedEnd ? 1 : 0,
                                            borderColor: primary,
                                        }}
                                    >
                                        <Text style={{ color: disabled ? muted : selectedStart || selectedEnd ? '#fff' : text }}>
                                            {format(day, 'd')}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}
