import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { GradientAppBar } from '../../../components/hotelSearch/HotelFlowChrome';
import { fetchHotelById } from '../../../services/api/hotelDetail';
import { HotelDetail } from '../../../types/hotels';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { formatMoney, locationLine, minNightlyPrice, shortRangeLabel } from '../../../utilities/hotelSearch';

export default function HotelStayPage() {
    const router = useRouter();
    const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
    const { isDark } = useTheme();
    const { params } = useHotelSearch();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    const [hotel, setHotel] = useState<HotelDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const subtitle = `${shortRangeLabel(params.checkIn, params.checkOut)}, ${params.roomCount} Room${params.roomCount === 1 ? '' : 's'}`;

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

    const price = hotel ? minNightlyPrice(hotel) : null;
    const images = hotel?.images || [];
    const photo = images[photoIndex]?.url;
    const place = locationLine(hotel?.location as { name?: string; city?: string | null; country?: string | null });
    const amenities = hotel?.amenities || [];

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={hotel?.name || 'Hotel'} subtitle={subtitle} onBack={() => router.back()} />
            {loading ? <ActivityIndicator className="mt-10" color={primary} /> : null}
            {error ? <Text className="px-4 mt-6 text-sm text-error">Could not load this hotel.</Text> : null}
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
                                        <Text style={{ color: primary }}>{expanded ? 'Show less' : 'Read more'}</Text>
                                    </Pressable>
                                </View>
                            ) : null}
                            {(hotel.checkInTime || hotel.checkOutTime) ? (
                                <View className="mt-6">
                                    <Text className="mb-2 text-lg font-bold text-text dark:text-text-dark">Hotel policy</Text>
                                    <View className="flex-row gap-3">
                                        {hotel.checkInTime ? (
                                            <View className="flex-1 p-3 rounded-xl bg-white dark:bg-surface-dark">
                                                <Text className="text-xs text-muted dark:text-muted-dark">Check-in</Text>
                                                <Text className="font-bold text-text dark:text-text-dark">{hotel.checkInTime}</Text>
                                            </View>
                                        ) : null}
                                        {hotel.checkOutTime ? (
                                            <View className="flex-1 p-3 rounded-xl bg-white dark:bg-surface-dark">
                                                <Text className="text-xs text-muted dark:text-muted-dark">Check-out</Text>
                                                <Text className="font-bold text-text dark:text-text-dark">{hotel.checkOutTime}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            ) : null}
                            {amenities.length > 0 ? (
                                <View className="mt-6">
                                    <Text className="mb-3 text-lg font-bold text-text dark:text-text-dark">Facilities</Text>
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
                                    <Text className="mb-2 text-lg font-bold text-text dark:text-text-dark">Please note</Text>
                                    {hotel.policies.map((policy) => (
                                        <Text key={policy} className="mb-1 text-sm text-text dark:text-text-dark">• {policy}</Text>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    </ScrollView>
                    <View className="flex-row items-center px-4 pt-3 pb-3 border-t border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
                        <View className="flex-1 mr-3">
                            <Text className="text-xs text-muted dark:text-muted-dark">Starts from</Text>
                            <Text className="text-xl font-bold text-text dark:text-text-dark" numberOfLines={1}>
                                {price !== null ? formatMoney(price) : '—'}
                                {price !== null ? <Text className="text-sm font-normal text-muted dark:text-muted-dark"> / night</Text> : null}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => router.push({ pathname: '/(tabs)/explore/hotel-room-types', params: { hotelId: hotel.id } })}
                            className="items-center justify-center px-5 rounded-full"
                            style={{ backgroundColor: primary, minHeight: 48 }}
                        >
                            <Text className="text-base font-bold text-white">See all rooms</Text>
                        </Pressable>
                    </View>
                </>
            ) : null}
        </SafeAreaView>
    );
}
