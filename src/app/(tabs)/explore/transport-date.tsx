import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientAppBar, PillButton } from '../../../components/hotelSearch/HotelFlowChrome';
import { DateRangeCalendar } from '../../../components/hotelSearch/DateRangeCalendar';
import { useTransportSearch } from '../../../context/TransportSearchContext';
import { longDayLabel } from '../../../utilities/hotelSearch';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

export default function TransportDatePage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { which } = useLocalSearchParams<{ which?: string }>();
    const isReturn = which === 'return';
    const { params, setDate, setReturnDate } = useTransportSearch();
    const [selected, setSelected] = useState<string | null>(
        isReturn ? params.returnDate : params.date
    );
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar
                title={isReturn ? t(TRANSLATION_KEYS.TRANSPORT.RETURN_DATE) : t(TRANSLATION_KEYS.TRANSPORT.SELECT_DATE)}
                onBack={() => router.back()}
            />
            <DateRangeCalendar
                checkIn={selected}
                checkOut={null}
                singleDate
                onChange={(start) => {
                    setSelected(start);
                }}
            />
            <View className="px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
                <View className="mb-3">
                    <Text className="text-xs text-muted dark:text-muted-dark">
                        {t(TRANSLATION_KEYS.TRANSPORT.DATE)}
                    </Text>
                    <Text className="font-bold text-text dark:text-text-dark">
                        {selected ? longDayLabel(selected) : t(TRANSLATION_KEYS.TRANSPORT.SELECT_DATE)}
                    </Text>
                </View>
                <PillButton
                    label={t(TRANSLATION_KEYS.TRANSPORT.CONFIRM)}
                    disabled={!selected}
                    onPress={() => {
                        if (!selected) {
                            return;
                        }
                        if (isReturn) {
                            setReturnDate(selected);
                        } else {
                            setDate(selected);
                        }
                        router.back();
                    }}
                />
            </View>
        </SafeAreaView>
    );
}
