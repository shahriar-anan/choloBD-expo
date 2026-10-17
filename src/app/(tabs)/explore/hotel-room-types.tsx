import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { GradientAppBar, PillButton } from '../../../components/hotelSearch/HotelFlowChrome';
import { fetchHotelById } from '../../../services/api/hotelDetail';
import { fetchHotelRoomAvailability } from '../../../services/api/hotels';
import { AvailableRoomType } from '../../../types/hotelSearch';
import { HotelDetail } from '../../../types/hotels';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { useExplore } from './_provider';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { appDateLocale } from '../../../utilities/hotelDesk';
import {
    bookingTotal,
    displayRoomName,
    formatMoney,
    canSelectRoomForShift,
    isShiftStay,
    isValidStay,
    priceForShift,
    shortRangeLabel,
    roomsTooSmallForGuests,
    selectedGuestCapacity,
    stayUnits,
} from '../../../utilities/hotelSearch';
import { goBack } from '../../../utilities/navigation';

export default function HotelRoomTypesPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
    const { isDark } = useTheme();
    const { params } = useHotelSearch();
    const { openGuestDetails, selectedRoomsMap: savedMap, hotelDetail } = useExplore();
    const { t, i18n } = useTranslation();
    const locale = appDateLocale(i18n.resolvedLanguage || i18n.language);
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    const [rooms, setRooms] = useState<AvailableRoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selected, setSelected] = useState<Record<string, number>>(() => (
        hotelDetail?.id === hotelId ? savedMap : {}
    ));
    const [hotelAllowsShift, setHotelAllowsShift] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const confirmingRef = useRef(false);
    const stayKey = `${hotelId ?? ''}|${params.shift}|${params.checkIn}|${params.checkOut}`;
    const stayKeyRef = useRef(stayKey);
    const datesReady = isValidStay(params.checkIn, params.checkOut, params.shift);
    const units = stayUnits(params.checkIn, params.checkOut, params.shift);
    const priceSuffix = isShiftStay(params.shift)
        ? t(TRANSLATION_KEYS.HOTEL_SEARCH.PER_SHIFT)
        : t(TRANSLATION_KEYS.HOTEL_SEARCH.PER_NIGHT);
    const subtitle = datesReady
        ? t(TRANSLATION_KEYS.HOTEL_SEARCH.STAY_SUMMARY, {
            range: shortRangeLabel(params.checkIn, params.checkOut, locale),
            rooms: t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOM_COUNT, { count: params.roomCount }),
        })
        : t(TRANSLATION_KEYS.HOTEL_SEARCH.PICK_DATES);
    const payableSelected = useMemo(() => Object.fromEntries(
        Object.entries(selected).filter(([roomTypeId, quantity]) => {
            const room = rooms.find((item) => item.roomTypeId === roomTypeId);
            return quantity > 0 && room !== undefined && canSelectRoomForShift(room, params.shift, hotelAllowsShift);
        }),
    ), [selected, rooms, params.shift, hotelAllowsShift]);
    const total = useMemo(
        () => bookingTotal(payableSelected, rooms, params.shift, params.checkIn, params.checkOut),
        [payableSelected, rooms, params.shift, params.checkIn, params.checkOut],
    );
    const hasSelection = Object.keys(payableSelected).length > 0;

    useEffect(() => {
        if (stayKeyRef.current === stayKey) {
            return;
        }
        stayKeyRef.current = stayKey;
        setSelected({});
    }, [stayKey]);

    useEffect(() => {
        if (!hotelId || !datesReady) {
            setLoading(false);
            setError(false);
            return;
        }
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(false);
            try {
                const [availability, hotel] = await Promise.all([
                    fetchHotelRoomAvailability(hotelId, {
                        numberOfRooms: params.roomCount,
                        checkInDate: params.checkIn,
                        checkOutDate: params.checkOut,
                        shift: params.shift,
                    }),
                    fetchHotelById(hotelId).catch(() => null),
                ]);
                if (cancelled) {
                    return;
                }
                const images = imageMap(hotel);
                const allowsShift = !isShiftStay(params.shift) || hotel?.allowShiftBooking === true;
                setHotelAllowsShift(allowsShift);
                const openRooms = (availability?.availableRoomsByType || [])
                    .filter((room) => room.availableRooms > 0)
                    .map((room) => ({ ...room, images: images[room.roomTypeId] }));
                setRooms(openRooms);
                setSelected((current) => {
                    const next: Record<string, number> = {};
                    Object.entries(current).forEach(([roomTypeId, quantity]) => {
                        const room = openRooms.find((item) => item.roomTypeId === roomTypeId);
                        if (!room || !canSelectRoomForShift(room, params.shift, allowsShift)) {
                            return;
                        }
                        const clamped = Math.min(quantity, room.availableRooms);
                        if (clamped > 0) {
                            next[roomTypeId] = clamped;
                        }
                    });
                    return next;
                });
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
    }, [hotelId, datesReady, params.checkIn, params.checkOut, params.shift, params.roomCount]);

    const setQuantity = (roomTypeId: string, quantity: number) => {
        setSelected((current) => {
            if (quantity <= 0) {
                const rest = { ...current };
                delete rest[roomTypeId];
                return rest;
            }
            return { ...current, [roomTypeId]: quantity };
        });
    };

    const confirm = async () => {
        if (confirmingRef.current || !hotelId || Object.keys(payableSelected).length === 0 || total <= 0) {
            return;
        }
        if (roomsTooSmallForGuests(payableSelected, rooms, params.guestCount)) {
            Alert.alert(
                t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOM_CAPACITY_TITLE),
                t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOM_CAPACITY_BODY, {
                    count: params.guestCount,
                    capacity: selectedGuestCapacity(payableSelected, rooms),
                }),
            );
            return;
        }
        confirmingRef.current = true;
        setSubmitting(true);
        try {
            await openGuestDetails({
                hotelId,
                selectedRoomsMap: payableSelected,
                availableRooms: rooms,
                shift: params.shift,
                guestCount: params.guestCount,
                checkIn: params.checkIn,
                checkOut: params.checkOut,
            });
        } finally {
            confirmingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar
                title={t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOMS)}
                subtitle={subtitle}
                onBack={() => goBack(router)}
                rightIcon="pencil"
                rightLabel={t(TRANSLATION_KEYS.HOTEL_SEARCH.EDIT_DATES)}
                onRightPress={() => router.push('/(tabs)/explore/hotel-dates')}
            />
            {loading ? <ActivityIndicator className="mt-8" color={primary} /> : null}
            {!datesReady ? <Text className="px-4 mt-6 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.PICK_DATES)}</Text> : null}
            {error ? <Text className="px-4 mt-6 text-error">{t(TRANSLATION_KEYS.HOTEL_SEARCH.LOAD_ROOMS_FAILED)}</Text> : null}
            {!loading && !error ? (
                <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
                    <View className="p-3 mt-4 rounded-xl" style={{ backgroundColor: `${warning}22` }}>
                        <Text className="text-sm text-text dark:text-text-dark">
                            {t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOM_WARNING)}
                        </Text>
                    </View>
                    {rooms.length === 0 ? (
                        <Text className="mt-6 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.NO_ROOMS_FOR_STAY)}</Text>
                    ) : null}
                    {rooms.map((room) => {
                        const quantity = selected[room.roomTypeId] || 0;
                        const unitPrice = priceForShift(room, params.shift);
                        const photo = room.images?.[0]?.url;
                        const priced = canSelectRoomForShift(room, params.shift, hotelAllowsShift);
                        return (
                            <View key={room.roomTypeId} className="p-3 mt-3 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
                                <View className="flex-row">
                                    {photo ? <Image source={{ uri: photo }} className="w-24 h-24 rounded-xl" /> : <View className="w-24 h-24 rounded-xl bg-background dark:bg-background-dark" />}
                                    <View className="flex-1 ml-3">
                                        <Text className="font-bold text-text dark:text-text-dark">{displayRoomName(room.roomType)}</Text>
                                        <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                                            {t(TRANSLATION_KEYS.HOTEL_SEARCH.SLEEPS, { count: room.maxGuests && room.maxGuests >= 1 ? room.maxGuests : 1 })}
                                        </Text>
                                        <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                                            {t(TRANSLATION_KEYS.HOTEL_SEARCH.AVAILABLE_COUNT, { count: room.availableRooms })}
                                        </Text>
                                        <Text className="mt-2 font-bold text-text dark:text-text-dark">
                                            {priced ? `${formatMoney(unitPrice)} ${priceSuffix}` : t(TRANSLATION_KEYS.HOTEL_SEARCH.NOT_AVAILABLE)}
                                        </Text>
                                        {quantity > 0 && priced ? (
                                            <Text className="text-xs text-muted dark:text-muted-dark">
                                                {formatMoney(unitPrice * units * quantity)}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                                {quantity > 0 ? (
                                    <View className="flex-row items-center justify-between mt-3">
                                        <Pressable onPress={() => setQuantity(room.roomTypeId, quantity - 1)} className="items-center justify-center w-11 h-11">
                                            <Text className="text-xl font-bold text-text dark:text-text-dark">−</Text>
                                        </Pressable>
                                        <Text className="text-base font-bold text-text dark:text-text-dark">{quantity}</Text>
                                        <Pressable
                                            disabled={quantity >= room.availableRooms}
                                            onPress={() => setQuantity(room.roomTypeId, Math.min(room.availableRooms, quantity + 1))}
                                            className="items-center justify-center w-11 h-11"
                                        >
                                            <Text className="text-xl font-bold" style={{ color: quantity >= room.availableRooms ? '#999' : primary }}>+</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setQuantity(room.roomTypeId, 0)}>
                                            <Text className="text-sm font-semibold text-error">{t(TRANSLATION_KEYS.COMMON.CANCEL)}</Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    <Pressable
                                        disabled={!priced}
                                        onPress={() => setQuantity(room.roomTypeId, 1)}
                                        className="items-center justify-center py-3 mt-3 rounded-full"
                                        style={{ backgroundColor: priced ? primary : '#94a3b8' }}
                                    >
                                        <Text className="font-bold text-white">
                                            {priced ? t(TRANSLATION_KEYS.HOTEL_SEARCH.SELECT_ROOM) : t(TRANSLATION_KEYS.HOTEL_SEARCH.NOT_AVAILABLE)}
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            ) : null}
            <View className="px-4 pt-3 border-t border-border dark:border-border-dark" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
                <Text className="mb-2 text-lg font-bold text-text dark:text-text-dark">{formatMoney(total)}</Text>
                <PillButton
                    label={submitting ? t(TRANSLATION_KEYS.COMMON.LOADING) : t(TRANSLATION_KEYS.HOTEL_SEARCH.CONFIRM)}
                    disabled={!hasSelection || total <= 0 || submitting}
                    onPress={confirm}
                />
            </View>
        </SafeAreaView>
    );
}

function imageMap(hotel: HotelDetail | null): Record<string, Array<{ url: string }>> {
    const map: Record<string, Array<{ url: string }>> = {};
    (hotel?.roomTypes || []).forEach((room) => {
        if (room.images && room.images.length > 0) {
            map[room.id] = room.images;
        }
    });
    return map;
}
