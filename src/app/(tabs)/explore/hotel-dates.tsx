import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { appAlert } from '../../../components/ui/appAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { appDateLocale } from '../../../utilities/hotelDesk';
import { GradientAppBar, PillButton } from '../../../components/hotelSearch/HotelFlowChrome';
import { DateRangeCalendar } from '../../../components/hotelSearch/DateRangeCalendar';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { addCalendarDays, dhakaYmd, isShiftStay, isValidStay, longDayLabel, nightsBetween, runningNightCheckIn, runningNightOpen, shiftClosedForStay, shiftSpoken } from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

export default function HotelDatesPage() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const locale = appDateLocale(i18n.resolvedLanguage || i18n.language);
    const { params, setDates } = useHotelSearch();
    const shiftStay = isShiftStay(params.shift);
    const [checkIn, setCheckIn] = useState<string | null>(params.checkIn || null);
    const [checkOut, setCheckOut] = useState<string | null>(shiftStay ? params.checkIn : (params.checkOut || null));
    const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
    const canConfirm = shiftStay
        ? Boolean(checkIn && isValidStay(checkIn, checkIn, params.shift))
        : Boolean(checkIn && checkOut && isValidStay(checkIn, checkOut, params.shift));
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={t(TRANSLATION_KEYS.HOTEL_SEARCH.SELECT_DATES)} onBack={() => goBack(router)} />
            <DateRangeCalendar
                checkIn={checkIn}
                checkOut={shiftStay ? checkIn : checkOut}
                singleDate={shiftStay}
                onRangeAttempt={(iso) => {
                    appAlert(
                        t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT_ONE_DAY_TITLE),
                        t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT_ONE_DAY_BODY),
                        [
                            { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
                            {
                                text: t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT_USE_THIS_DAY),
                                onPress: () => {
                                    setCheckIn(iso);
                                    setCheckOut(iso);
                                },
                            },
                        ],
                    );
                }}
                onChange={(start, end) => {
                    setCheckIn(start);
                    setCheckOut(shiftStay ? start : end);
                }}
            />
            <View className="px-4 pt-3" style={{ backgroundColor: 'transparent', paddingBottom: Math.max(insets.bottom, 12) }}>
                <View className="flex-row items-center justify-between mb-3">
                    <View>
                        <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_IN)}</Text>
                        <Text className="font-bold text-text dark:text-text-dark">{checkIn ? longDayLabel(checkIn, locale) : t(TRANSLATION_KEYS.HOTEL_SEARCH.SELECT)}</Text>
                    </View>
                    <Text className="text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.TO)}</Text>
                    <View>
                        <Text className="text-xs text-right text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_OUT)}</Text>
                        <Text className="font-bold text-right text-text dark:text-text-dark">{checkOut ? longDayLabel(checkOut, locale) : t(TRANSLATION_KEYS.HOTEL_SEARCH.SELECT)}</Text>
                    </View>
                </View>
                {shiftStay ? (
                    <Text className="mb-3 text-sm text-muted dark:text-muted-dark">
                        {t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT_ONE_DAY_HINT)}
                    </Text>
                ) : null}
                    <PillButton
                    label={canConfirm && !shiftStay ? t(TRANSLATION_KEYS.HOTEL_SEARCH.CONFIRM_NIGHTS, { count: nights }) : t(TRANSLATION_KEYS.HOTEL_SEARCH.CONFIRM)}
                    disabled={!canConfirm}
                    onPress={() => {
                        if (!checkIn) {
                            return;
                        }
                        const end = shiftStay ? checkIn : checkOut;
                        if (!end) {
                            return;
                        }
                        if (shiftStay && params.shift !== 'ALL_DAY' && shiftClosedForStay(checkIn, params.shift)) {
                            const spoken = shiftSpoken(params.shift);
                            appAlert(
                                t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT_CLOSED_TITLE),
                                t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT_CLOSED_BODY, {
                                    shift: t(spoken.name),
                                    time: t(spoken.until),
                                }),
                            );
                            return;
                        }
                        if (params.shift === 'NIGHT' && checkIn === dhakaYmd() && runningNightOpen()) {
                            appAlert(
                                t(TRANSLATION_KEYS.HOTEL_SEARCH.WHICH_NIGHT_TITLE),
                                t(TRANSLATION_KEYS.HOTEL_SEARCH.WHICH_NIGHT_BODY),
                                [
                                    {
                                        text: t(TRANSLATION_KEYS.HOTEL_SEARCH.NIGHT_IN_PROGRESS),
                                        onPress: () => {
                                            const yesterday = runningNightCheckIn();
                                            setDates(yesterday, yesterday);
                                            goBack(router);
                                        },
                                    },
                                    {
                                        text: t(TRANSLATION_KEYS.HOTEL_SEARCH.TONIGHT),
                                        onPress: () => {
                                            setDates(checkIn, checkIn);
                                            goBack(router);
                                        },
                                    },
                                ],
                            );
                            return;
                        }
                        setDates(checkIn, end);
                        goBack(router);
                    }}
                />
            </View>
        </SafeAreaView>
    );
}
