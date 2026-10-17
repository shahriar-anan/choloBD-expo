import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { appDateLocale } from '../../../utilities/hotelDesk';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { GradientAppBar } from '../../../components/hotelSearch/HotelFlowChrome';
import { fetchHotelById } from '../../../services/api/hotelDetail';
import { HotelDetail } from '../../../types/hotels';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { formatMoney, isShiftStay, isValidStay, locationLine, minNightlyPrice, minShiftPrice, shortRangeLabel } from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

export default function HotelStayPage() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const locale = appDateLocale(i18n.resolvedLanguage || i18n.language);
    const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
    const { isDark } = useTheme();
    const { params, setShift } = useHotelSearch();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    const [hotel, setHotel] = useState<HotelDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const datesReady = isValidStay(params.checkIn, params.checkOut, params.shift);
    const subtitle = datesReady
        ? t(TRANSLATION_KEYS.HOTEL_SEARCH.STAY_SUMMARY, {
            range: shortRangeLabel(params.checkIn, params.checkOut, locale),
            rooms: t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOM_COUNT, { count: params.roomCount }),
        })
        : t(TRANSLATION_KEYS.HOTEL_SEARCH.PICK_DATES);

    useEffect(() => {
        if (!hotelId) {
            setLoading(false);
            setError(true);
            return;
        }
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(false);
            try {
                const data = await fetchHotelById(hotelId);
                if (!cancelled) {
                    setHotel(data);
                    if (!data) {
                        setError(true);
                    }
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
    }, [hotelId]);

    const price = hotel
        ? (isShiftStay(params.shift) ? minShiftPrice(hotel, params.shift) : minNightlyPrice(hotel))
        : null;
    const shiftBlocked = Boolean(
        hotel
        && isShiftStay(params.shift)
        && (hotel.allowShiftBooking !== true || price === null),
    );
    const priceSuffix = isShiftStay(params.shift)
        ? t(TRANSLATION_KEYS.HOTEL_SEARCH.PER_SHIFT)
        : t(TRANSLATION_KEYS.HOTEL_SEARCH.PER_NIGHT_SHORT);
    const images = hotel?.images || [];
    const photo = images[photoIndex]?.url;
    const place = locationLine(hotel?.location as { name?: string; city?: string | null; country?: string | null });
    const amenities = hotel?.amenities || [];

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={hotel?.name || t(TRANSLATION_KEYS.HOTEL_SEARCH.TITLE)} subtitle={subtitle} onBack={() => goBack(router)} />
            {loading ? <ActivityIndicator className="mt-10" color={primary} /> : null}
            {error ? <Text className="px-4 mt-6 text-sm text-error">{t(TRANSLATION_KEYS.HOTEL_SEARCH.LOAD_HOTEL_FAILED)}</Text> : null}
            {hotel ? (
                <>
                    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
                        {photo ? (
                            <View>
                                <Image source={{ uri: photo }} className="w-full h-56" />
                                {images.length > 1 ? (
                                    <View className="flex-row justify-center py-2">
                                        {images.map((image, index) => (
                                            <Pressable key={image.url + index} onPress={() => setPhotoIndex(index)} className="mx-1">
                                                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: index === photoIndex ? primary : '#cbd5e1' }} />
                                            </Pressable>
                                        ))}
                                    </View>
                                ) : null}
                            </View>
                        ) : null}
                        <View className="px-4 pt-4">
                            <View className="flex-row">
                                {Array.from({ length: 5 }, (_, index) => (
                                    <Ionicons key={index} name={index < (hotel.rating || 0) ? 'star' : 'star-outline'} size={16} color={warning} />
                                ))}
                            </View>
                            <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">{hotel.name}</Text>
                            {place ? <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{place}</Text> : null}
                            {hotel.description ? (
                                <View className="mt-3">
                                    <Text className="text-sm text-text dark:text-text-dark" numberOfLines={expanded ? undefined : 5}>
                                        {hotel.description}
                                    </Text>
                                    <Pressable onPress={() => setExpanded((current) => !current)}>
                                        <Text style={{ color: primary }}>{expanded ? t(TRANSLATION_KEYS.HOTEL_SEARCH.SHOW_LESS) : t(TRANSLATION_KEYS.HOTEL_SEARCH.READ_MORE)}</Text>
                                    </Pressable>
                                </View>
                            ) : null}
                            {(hotel.checkInTime || hotel.checkOutTime) ? (
                                <View className="mt-6">
                                    <Text className="mb-2 text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.POLICY)}</Text>
                                    <View className="flex-row gap-3">
                                        {hotel.checkInTime ? (
                                            <View className="flex-1 p-3 rounded-xl bg-white dark:bg-surface-dark">
                                                <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_IN)}</Text>
                                                <Text className="font-bold text-text dark:text-text-dark">{hotel.checkInTime}</Text>
                                            </View>
                                        ) : null}
                                        {hotel.checkOutTime ? (
                                            <View className="flex-1 p-3 rounded-xl bg-white dark:bg-surface-dark">
                                                <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_OUT)}</Text>
                                                <Text className="font-bold text-text dark:text-text-dark">{hotel.checkOutTime}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            ) : null}
                            {amenities.length > 0 ? (
                                <View className="mt-6">
                                    <Text className="mb-3 text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.FACILITIES)}</Text>
                                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                                        {amenities.map((amenity) => (
                                            <View
                                                key={amenity}
                                                className="flex-row items-center px-3 py-2 border rounded-full bg-white dark:bg-surface-dark border-border dark:border-border-dark"
                                            >
                                                <Ionicons name="checkmark-circle" size={14} color={primary} />
                                                <Text className="ml-1.5 text-sm text-text dark:text-text-dark">{amenity}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ) : null}
                            {hotel.policies && hotel.policies.length > 0 ? (
                                <View className="mt-6">
                                    <Text className="mb-2 text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.PLEASE_NOTE)}</Text>
                                    {hotel.policies.map((policy) => (
                                        <Text key={policy} className="mb-1 text-sm text-text dark:text-text-dark">• {policy}</Text>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    </ScrollView>
                    <View className="flex-row items-center px-4 pt-3 pb-3 border-t border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
                        <View className="flex-1 mr-3">
                            {shiftBlocked ? (
                                <Text className="text-sm text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.WHOLE_DAY_ONLY)}</Text>
                            ) : (
                                <>
                                    <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.STARTS_FROM_LABEL)}</Text>
                                    <Text className="text-xl font-bold text-text dark:text-text-dark" numberOfLines={1}>
                                        {price !== null ? formatMoney(price) : '—'}
                                        {price !== null ? <Text className="text-sm font-normal text-muted dark:text-muted-dark"> {priceSuffix}</Text> : null}
                                    </Text>
                                </>
                            )}
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                                if (shiftBlocked) {
                                    setShift('ALL_DAY');
                                    router.push('/(tabs)/explore/hotel-dates');
                                    return;
                                }
                                if (!datesReady) {
                                    router.push('/(tabs)/explore/hotel-dates');
                                    return;
                                }
                                router.push({ pathname: '/(tabs)/explore/hotel-room-types', params: { hotelId: hotel.id } });
                            }}
                            className="items-center justify-center px-5 rounded-full"
                            style={{ backgroundColor: primary, minHeight: 48 }}
                        >
                            <Text className="text-base font-bold text-white">
                                {shiftBlocked
                                    ? t(TRANSLATION_KEYS.HOTEL_SEARCH.SWITCH_TO_WHOLE_DAY)
                                    : datesReady
                                        ? t(TRANSLATION_KEYS.HOTEL_SEARCH.SEE_ROOMS)
                                        : t(TRANSLATION_KEYS.HOTEL_SEARCH.SELECT_DATES)}
                            </Text>
                        </Pressable>
                    </View>
                </>
            ) : null}
        </SafeAreaView>
    );
}
