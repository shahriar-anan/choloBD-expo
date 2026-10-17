import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { appAlert } from '../../../components/ui/appAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { GradientAppBar } from '../../../components/hotelSearch/HotelFlowChrome';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { RoomShift } from '../../../types/hotelSearch';
import { dhakaYmd, runningNightCheckIn, runningNightOpen, shiftClosedForStay, shiftSpoken } from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

const SHIFTS: Array<{ value: RoomShift; labelKey: string }> = [
    { value: 'ALL_DAY', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.WHOLE_DAY },
    { value: 'MORNING', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.MORNING },
    { value: 'AFTERNOON', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.AFTERNOON },
    { value: 'NIGHT', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.NIGHT },
];

export default function HotelShiftPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const { params, setShift, setDates } = useHotelSearch();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const stayDay = params.checkIn || dhakaYmd();

    const chooseNight = () => {
        const today = dhakaYmd();
        if (stayDay === today && runningNightOpen()) {
            appAlert(
                t(TRANSLATION_KEYS.HOTEL_SEARCH.WHICH_NIGHT_TITLE),
                t(TRANSLATION_KEYS.HOTEL_SEARCH.WHICH_NIGHT_BODY),
                [
                    {
                        text: t(TRANSLATION_KEYS.HOTEL_SEARCH.NIGHT_IN_PROGRESS),
                        onPress: () => {
                            const yesterday = runningNightCheckIn();
                            setDates(yesterday, yesterday);
                            setShift('NIGHT');
                            goBack(router);
                        },
                    },
                    {
                        text: t(TRANSLATION_KEYS.HOTEL_SEARCH.TONIGHT),
                        onPress: () => {
                            setDates(today, today);
                            setShift('NIGHT');
                            goBack(router);
                        },
                    },
                ],
            );
            return;
        }
        setShift('NIGHT');
        goBack(router);
    };

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT)} onBack={() => goBack(router)} />
            <View className="px-4 pt-4">
                {SHIFTS.map((shift) => {
                    const selected = params.shift === shift.value;
                    const closed = shift.value !== 'ALL_DAY' && shiftClosedForStay(stayDay, shift.value);
                    return (
                        <Pressable
                            key={shift.value}
                            disabled={closed}
                            onPress={() => {
                                if (shift.value === 'NIGHT') {
                                    chooseNight();
                                    return;
                                }
                                setShift(shift.value);
                                goBack(router);
                            }}
                            className="px-4 py-4 mb-3 bg-white rounded-2xl dark:bg-surface-dark"
                            style={{ opacity: closed ? 0.45 : 1 }}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={primary} />
                                <Text className="flex-1 ml-3 font-semibold text-text dark:text-text-dark">{t(shift.labelKey)}</Text>
                            </View>
                            {closed && shift.value !== 'ALL_DAY' ? (
                                <Text className="mt-1 ml-8 text-xs text-muted dark:text-muted-dark">
                                    {t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT_CLOSED_REASON, { time: t(shiftSpoken(shift.value).until) })}
                                </Text>
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}
