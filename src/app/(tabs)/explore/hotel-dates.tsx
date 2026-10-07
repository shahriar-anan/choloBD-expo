import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GradientAppBar, PillButton } from '../../../components/hotelSearch/HotelFlowChrome';
import { DateRangeCalendar } from '../../../components/hotelSearch/DateRangeCalendar';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { isValidStay, longDayLabel, nightsBetween } from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

export default function HotelDatesPage() {
    const router = useRouter();
    const { params, setDates } = useHotelSearch();
    const [checkIn, setCheckIn] = useState<string | null>(params.checkIn);
    const [checkOut, setCheckOut] = useState<string | null>(params.checkOut);
    const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
    const canConfirm = Boolean(checkIn && checkOut && isValidStay(checkIn, checkOut));
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title="Select Dates" onBack={() => goBack(router)} />
            <DateRangeCalendar
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(start, end) => {
                    setCheckIn(start);
                    setCheckOut(end);
                }}
            />
            <View className="px-4 pt-3" style={{ backgroundColor: 'transparent', paddingBottom: Math.max(insets.bottom, 12) }}>
                <View className="flex-row items-center justify-between mb-3">
                    <View>
                        <Text className="text-xs text-muted dark:text-muted-dark">Check-in</Text>
                        <Text className="font-bold text-text dark:text-text-dark">{checkIn ? longDayLabel(checkIn) : 'Select'}</Text>
                    </View>
                    <Text className="text-muted dark:text-muted-dark">to</Text>
                    <View>
                        <Text className="text-xs text-right text-muted dark:text-muted-dark">Check-out</Text>
                        <Text className="font-bold text-right text-text dark:text-text-dark">{checkOut ? longDayLabel(checkOut) : 'Select'}</Text>
                    </View>
                </View>
                <PillButton
                    label={canConfirm ? `Confirm (${nights} nights)` : 'Confirm'}
                    disabled={!canConfirm}
                    onPress={() => {
                        if (!checkIn || !checkOut) {
                            return;
                        }
                        setDates(checkIn, checkOut);
                        goBack(router);
                    }}
                />
            </View>
        </SafeAreaView>
    );
}
