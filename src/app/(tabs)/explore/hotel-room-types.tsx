import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { GradientAppBar, PillButton } from '../../../components/hotelSearch/HotelFlowChrome';
import { fetchHotelById } from '../../../services/api/hotelDetail';
import { HotelDetail, RoomType } from '../../../types/hotels';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { useExplore } from './_provider';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { bedLine, formatMoney, nightsBetween, shortRangeLabel } from '../../../utilities/hotelSearch';

export default function HotelRoomTypesPage() {
    const router = useRouter();
    const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
    const { isDark } = useTheme();
    const { params } = useHotelSearch();
    const { openGuestDetails } = useExplore();
    const { t } = useTranslation();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
    const [hotel, setHotel] = useState<HotelDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selected, setSelected] = useState<RoomType | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const nights = nightsBetween(params.checkIn, params.checkOut);
    const subtitle = `${shortRangeLabel(params.checkIn, params.checkOut)}, ${params.roomCount} Room${params.roomCount === 1 ? '' : 's'}`;

    useEffect(() => {
        if (!hotelId) {
            setLoading(false);
            setError(true);
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const data = await fetchHotelById(hotelId);
                if (!cancelled) {
                    setHotel(data);
                    setError(!data);
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

    const confirm = async () => {
        if (!hotel || !selected) {
            return;
        }
        setSubmitting(true);
        try {
            await openGuestDetails({
                hotelId: hotel.id,
                roomTypeId: selected.id,
                quantity: params.roomCount,
                checkIn: params.checkIn,
                checkOut: params.checkOut,
            });
            setSelected(null);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar
                title={hotel?.name || 'Rooms'}
                subtitle={subtitle}
                onBack={() => router.back()}
                rightIcon="pencil"
                rightLabel="Edit dates and rooms"
                onRightPress={() => router.push('/(tabs)/explore/hotel-dates')}
            />
            {loading ? <ActivityIndicator className="mt-8" color={primary} /> : null}
            {error ? <Text className="px-4 mt-6 text-error">Could not load rooms.</Text> : null}
            {hotel ? (
                <ScrollView className="px-4">
                    <View className="p-3 mt-4 rounded-xl" style={{ backgroundColor: `${warning}22` }}>
                        <Text className="text-sm text-text dark:text-text-dark">
                            {t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOM_WARNING)}
                        </Text>
                    </View>
                    {(hotel.roomTypes || []).length === 0 ? (
                        <Text className="mt-6 text-sm text-muted dark:text-muted-dark">No room types are listed for this hotel.</Text>
                    ) : null}
                    {(hotel.roomTypes || []).map((room) => {
                        const photo = room.images?.[0]?.url;
                        const total = (room.pricePerNight || 0) * Math.max(nights, 1) * params.roomCount;
                        const beds = bedLine(room.singleBedCount, room.doubleBedCount);
                        return (
                            <Pressable
                                key={room.id}
                                onPress={() => setSelected(room)}
                                className="flex-row p-3 mt-3 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark"
                            >
                                {photo ? <Image source={{ uri: photo }} className="w-24 h-24 rounded-xl" /> : <View className="w-24 h-24 rounded-xl bg-background dark:bg-background-dark" />}
                                <View className="flex-1 ml-3">
                                    <Text className="font-bold text-text dark:text-text-dark">{room.roomType} ›</Text>
                                    {beds ? <Text className="text-xs text-muted dark:text-muted-dark">{beds}</Text> : null}
                                    <Text className="mt-2 font-bold text-text dark:text-text-dark">{formatMoney(total)}</Text>
                                    <Text className="text-xs text-muted dark:text-muted-dark">for {nights} nights, {params.roomCount} room</Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            ) : null}

            <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
                <View className="justify-end flex-1 bg-black/40">
                    <View className="p-5 rounded-t-3xl" style={{ backgroundColor: surface, maxHeight: '85%' }}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="flex-1 text-lg font-bold text-text dark:text-text-dark">{selected?.roomType}</Text>
                            <Pressable accessibilityLabel="Close" onPress={() => setSelected(null)} className="items-center justify-center w-11 h-11">
                                <Ionicons name="close" size={22} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
                            </Pressable>
                        </View>
                        <ScrollView>
                            {selected?.images && selected.images.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {selected.images.map((image) => (
                                        <Image key={image.url} source={{ uri: image.url }} className="w-56 h-36 mr-3 rounded-xl" />
                                    ))}
                                </ScrollView>
                            ) : null}
                            {selected && bedLine(selected.singleBedCount, selected.doubleBedCount) ? (
                                <Text className="mt-4 text-sm text-text dark:text-text-dark">
                                    Bed type: {bedLine(selected.singleBedCount, selected.doubleBedCount)}
                                </Text>
                            ) : null}
                            {selected ? (
                                <View className="p-3 mt-4 border rounded-xl border-border dark:border-border-dark">
                                    <Text className="font-bold text-text dark:text-text-dark">{selected.roomType}</Text>
                                    <Text style={{ color: primary }}>{formatMoney(selected.pricePerNight)} per night, room</Text>
                                    <Text className="mt-1 font-bold text-text dark:text-text-dark">
                                        {formatMoney(selected.pricePerNight * Math.max(nights, 1) * params.roomCount)} for {nights} nights, {params.roomCount} room
                                    </Text>
                                </View>
                            ) : null}
                        </ScrollView>
                        <View className="mt-4">
                            <PillButton label={submitting ? t(TRANSLATION_KEYS.COMMON.LOADING) : t(TRANSLATION_KEYS.HOTEL_SEARCH.CONFIRM)} disabled={!selected || submitting} onPress={confirm} />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
