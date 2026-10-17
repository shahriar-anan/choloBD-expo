import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { GradientAppBar, PillButton, Stepper } from '../../../components/hotelSearch/HotelFlowChrome';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { MAX_ROOMS } from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

export default function HotelRoomCountPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { params, setRoomCount } = useHotelSearch();
    const [count, setCount] = useState(params.roomCount);
    const title = t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOM_COUNT, { count });

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={title} onBack={() => goBack(router)} />
            <View className="flex-1 px-6 pt-6">
                <Text className="text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOMS)}</Text>
                <Text className="mt-1 mb-6 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOMS_HELP)}</Text>
                <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOMS)}</Text>
                    <Stepper value={count} min={1} max={MAX_ROOMS} onChange={setCount} />
                </View>
                <Pressable disabled={count >= MAX_ROOMS} onPress={() => setCount((current) => Math.min(MAX_ROOMS, current + 1))} className="mt-6">
                    <Text className="font-semibold text-primary dark:text-primary-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.ADD_ROOM)}</Text>
                </Pressable>
            </View>
            <View className="px-4 pb-4">
                <PillButton
                    label={t(TRANSLATION_KEYS.HOTEL_SEARCH.CONFIRM)}
                    onPress={() => {
                        setRoomCount(count);
                        goBack(router);
                    }}
                />
            </View>
        </SafeAreaView>
    );
}
