import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { GradientAppBar, PillButton, Stepper } from '../../../components/hotelSearch/HotelFlowChrome';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { MAX_GUESTS } from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

export default function HotelGuestsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { params, setGuestCount } = useHotelSearch();
    const [count, setCount] = useState(params.guestCount);
    const title = t(TRANSLATION_KEYS.HOTEL_SEARCH.GUEST_COUNT, { count });

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={title} onBack={() => goBack(router)} />
            <View className="flex-1 px-6 pt-6">
                <Text className="text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.GUESTS)}</Text>
                <Text className="mt-1 mb-6 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.GUESTS_HELP)}</Text>
                <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.GUESTS)}</Text>
                    <Stepper value={count} min={1} max={MAX_GUESTS} onChange={setCount} />
                </View>
            </View>
            <View className="px-4 pb-4">
                <PillButton
                    label={t(TRANSLATION_KEYS.HOTEL_SEARCH.CONFIRM)}
                    onPress={() => {
                        setGuestCount(count);
                        goBack(router);
                    }}
                />
            </View>
        </SafeAreaView>
    );
}
