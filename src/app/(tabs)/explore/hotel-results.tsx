import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { appDateLocale } from '../../../utilities/hotelDesk';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { GradientAppBar } from '../../../components/hotelSearch/HotelFlowChrome';
import { HotelFilterSheet } from '../../../components/hotelSearch/HotelFilterSheet';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { fetchHotels } from '../../../services/api/hotels';
import { hotelListQueryForDestination } from '../../../services/api/search';
import { HotelListFilter, HotelSearchListItem } from '../../../types/hotelSearch';
import {
    addCalendarDays,
    dhakaMinutes,
    dhakaYmd,
    emptyHotelFilter,
    formatMoney,
    isShiftStay,
    isValidStay,
    locationLine,
    minNightlyPrice,
    minShiftPrice,
    shiftClosedForStay,
    shiftSpoken,
    shortRangeLabel,
    sortHotels,
} from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

function Stars({ rating }: { rating: number }) {
    const { isDark } = useTheme();
    const color = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    return (
        <View className="flex-row">
            {Array.from({ length: 5 }, (_, index) => (
                <Ionicons key={index} name={index < rating ? 'star' : 'star-outline'} size={14} color={color} />
            ))}
        </View>
    );
}

export default function HotelResultsPage() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const locale = appDateLocale(i18n.resolvedLanguage || i18n.language);
    const { isDark } = useTheme();
    const { params, setDates, setShift } = useHotelSearch();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const [hotels, setHotels] = useState<HotelSearchListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState<HotelListFilter>(emptyHotelFilter);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const visible = useMemo(() => sortHotels(hotels, filter.sort), [hotels, filter.sort]);
    const listed = useMemo(
        () => (isShiftStay(params.shift) ? visible.filter((hotel) => minShiftPrice(hotel, params.shift) !== null) : visible),
        [visible, params.shift],
    );
    const shiftLabel = params.shift === 'MORNING'
        ? t(TRANSLATION_KEYS.HOTEL_SEARCH.MORNING)
        : params.shift === 'AFTERNOON'
            ? t(TRANSLATION_KEYS.HOTEL_SEARCH.AFTERNOON)
            : params.shift === 'NIGHT'
                ? t(TRANSLATION_KEYS.HOTEL_SEARCH.NIGHT)
                : t(TRANSLATION_KEYS.HOTEL_SEARCH.WHOLE_DAY);
    const datesReady = isValidStay(params.checkIn, params.checkOut, params.shift);
    const shiftClosed = datesReady && shiftClosedForStay(params.checkIn, params.shift);
    const checkInPassed = datesReady
        && !isShiftStay(params.shift)
        && params.checkIn === dhakaYmd()
        && dhakaMinutes() >= 14 * 60;
    const subtitle = datesReady
        ? `${shiftLabel} · ${t(TRANSLATION_KEYS.HOTEL_SEARCH.STAY_SUMMARY, {
            range: shortRangeLabel(params.checkIn, params.checkOut, locale),
            rooms: t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOM_COUNT, { count: params.roomCount }),
        })}`
        : t(TRANSLATION_KEYS.HOTEL_SEARCH.PICK_DATES);

    useEffect(() => {
        const destination = params.destination;
        if (!destination?.locationId || !datesReady || shiftClosed) {
            setLoading(false);
            setHotels([]);
            setError(false);
            return;
        }
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(false);
            try {
                const rows = await fetchHotels({
                    ...hotelListQueryForDestination(destination),
                    checkInDate: params.checkIn,
                    checkOutDate: params.checkOut,
                    guestCount: params.guestCount,
                    ...(isShiftStay(params.shift) ? { shift: params.shift, allowShiftBooking: true } : {}),
                    ...(filter.minRating !== '0' ? { minRating: Number(filter.minRating) } : {}),
                    page: 1,
                    limit: 50,
                    isActive: true,
                });
                if (!cancelled) {
                    setHotels(rows as HotelSearchListItem[]);
                }
            } catch {
                if (!cancelled) {
                    setError(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [datesReady, shiftClosed, params.destination, params.checkIn, params.checkOut, params.shift, params.guestCount, filter.minRating]);

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar
                title={params.destination?.subtitle || params.destination?.name || t(TRANSLATION_KEYS.HOTEL_SEARCH.TITLE)}
                subtitle={subtitle}
                onBack={() => goBack(router)}
            />
            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 96 }}>
                <Pressable onPress={() => router.push('/(tabs)/explore/hotel-search')}>
                    <Text className="mt-4 mb-3 text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.HOTEL_COUNT, { count: listed.length })}</Text>
                </Pressable>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {([
                        ['rating', t(TRANSLATION_KEYS.HOTEL_SEARCH.HIGHEST_RATING)],
                        ['name', t(TRANSLATION_KEYS.HOTEL_SEARCH.HOTEL_NAME)],
                    ] as const).map(([key, label]) => {
                        const active = filter.sort === key;
                        return (
                            <Pressable
                                key={key}
                                onPress={() => setFilter((current) => ({ ...current, sort: key }))}
                                className="px-4 py-2 mr-2 rounded-full"
                                style={{ backgroundColor: active ? primary : 'transparent', borderWidth: 1, borderColor: primary }}
                            >
                                <Text style={{ color: active ? '#fff' : primary }}>{label}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
                {loading ? <ActivityIndicator color={primary} /> : null}
                {error ? <Text className="text-sm text-error">{t(TRANSLATION_KEYS.HOTEL_SEARCH.LOAD_FAILED)}</Text> : null}
                {!loading && !error && shiftClosed ? (
                    <View className="mt-2">
                        <Text className="text-sm text-text dark:text-text-dark">
                            {t(TRANSLATION_KEYS.HOTEL_SEARCH.SHIFT_CLOSED_RESULTS, {
                                shift: params.shift === 'ALL_DAY' ? shiftLabel : t(shiftSpoken(params.shift).name),
                            })}
                        </Text>
                        <Pressable
                            onPress={() => {
                                setDates(params.checkIn, addCalendarDays(params.checkIn, 1));
                                setShift('ALL_DAY');
                            }}
                            className="px-4 py-3 mt-3 rounded-full"
                            style={{ backgroundColor: primary }}
                        >
                            <Text className="font-semibold text-center text-white">{t(TRANSLATION_KEYS.HOTEL_SEARCH.WHOLE_DAY)}</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                const tomorrow = addCalendarDays(dhakaYmd(), 1);
                                setDates(tomorrow, tomorrow);
                            }}
                            className="px-4 py-3 mt-2 rounded-full border border-border dark:border-border-dark"
                        >
                            <Text className="font-semibold text-center text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.SEARCH_TOMORROW)}</Text>
                        </Pressable>
                    </View>
                ) : null}
                {!loading && !error && !shiftClosed && listed.length === 0 && checkInPassed ? (
                    <View className="mt-2">
                        <Text className="text-sm text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_IN_PASSED)}</Text>
                        <Pressable
                            onPress={() => {
                                const tomorrow = addCalendarDays(dhakaYmd(), 1);
                                setDates(tomorrow, addCalendarDays(tomorrow, 1));
                            }}
                            className="px-4 py-3 mt-3 rounded-full"
                            style={{ backgroundColor: primary }}
                        >
                            <Text className="font-semibold text-center text-white">{t(TRANSLATION_KEYS.HOTEL_SEARCH.SEARCH_TOMORROW)}</Text>
                        </Pressable>
                    </View>
                ) : null}
                {!loading && !error && !shiftClosed && listed.length === 0 && !checkInPassed ? (
                    <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.NO_HOTELS)}</Text>
                ) : null}
                {listed.map((hotel) => {
                    const price = isShiftStay(params.shift) ? minShiftPrice(hotel, params.shift) : minNightlyPrice(hotel);
                    const photo = hotel.images?.[0]?.url;
                    return (
                        <Pressable
                            key={hotel.id}
                            onPress={() => router.push({ pathname: '/(tabs)/explore/hotel-stay', params: { hotelId: hotel.id } })}
                            className="flex-row p-3 mb-3 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark"
                        >
                            {photo ? (
                                <Image source={{ uri: photo }} className="w-24 h-24 rounded-xl" />
                            ) : (
                                <View className="w-24 h-24 rounded-xl bg-background dark:bg-background-dark" />
                            )}
                            <View className="flex-1 ml-3">
                                <Stars rating={hotel.rating || 0} />
                                <Text className="mt-1 font-bold text-text dark:text-text-dark">{hotel.name}</Text>
                                {locationLine(hotel.location) ? (
                                    <Text className="text-xs text-muted dark:text-muted-dark">{locationLine(hotel.location)}</Text>
                                ) : null}
                                {price !== null ? (
                                    <Text className="mt-2 text-base font-bold text-text dark:text-text-dark">
                                        {formatMoney(price)}
                                        <Text className="text-xs font-normal text-muted dark:text-muted-dark"> {isShiftStay(params.shift) ? t(TRANSLATION_KEYS.HOTEL_SEARCH.PER_SHIFT) : t(TRANSLATION_KEYS.HOTEL_SEARCH.PER_NIGHT)}</Text>
                                    </Text>
                                ) : null}
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
            <Pressable
                accessibilityLabel={t(TRANSLATION_KEYS.HOTEL_SEARCH.FILTERS)}
                onPress={() => setFiltersOpen(true)}
                className="absolute items-center justify-center w-14 h-14 rounded-full right-5 bottom-6"
                style={{ backgroundColor: primary }}
            >
                <Ionicons name="options" size={22} color="#fff" />
            </Pressable>
            <HotelFilterSheet
                visible={filtersOpen}
                value={filter}
                matchCount={listed.length}
                onChange={setFilter}
                onClose={() => setFiltersOpen(false)}
                onReset={() => setFilter(emptyHotelFilter())}
            />
        </SafeAreaView>
    );
}
