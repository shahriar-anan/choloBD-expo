import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { GradientAppBar } from '../../../components/hotelSearch/HotelFlowChrome';
import { HotelFilterSheet } from '../../../components/hotelSearch/HotelFilterSheet';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { fetchHotels } from '../../../services/api/hotels';
import { hotelListQueryForDestination } from '../../../services/api/search';
import { HotelListFilter, HotelSearchListItem } from '../../../types/hotelSearch';
import {
    applyHotelListFilter,
    emptyHotelFilter,
    formatMoney,
    locationLine,
    minNightlyPrice,
    shortRangeLabel,
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
    const { isDark } = useTheme();
    const { params } = useHotelSearch();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const [hotels, setHotels] = useState<HotelSearchListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState<HotelListFilter>(emptyHotelFilter);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const visible = useMemo(() => applyHotelListFilter(hotels, filter), [hotels, filter]);
    const subtitle = `${shortRangeLabel(params.checkIn, params.checkOut)}, ${params.roomCount} Room${params.roomCount === 1 ? '' : 's'}`;

    useEffect(() => {
        const destination = params.destination;
        if (!destination?.locationId) {
            setLoading(false);
            setHotels([]);
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
    }, [params.destination, params.checkIn, params.checkOut]);

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar
                title={params.destination?.subtitle || params.destination?.name || 'Hotels'}
                subtitle={subtitle}
                onBack={() => goBack(router)}
            />
            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 96 }}>
                <Pressable onPress={() => router.push('/(tabs)/explore/hotel-search')}>
                    <Text className="mt-4 mb-3 text-lg font-bold text-text dark:text-text-dark">{visible.length} hotels</Text>
                </Pressable>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {([
                        ['popular', 'Most popular'],
                        ['cheapest', 'Cheapest'],
                        ['rating', 'Star rating'],
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
                {error ? <Text className="text-sm text-error">Could not load hotels.</Text> : null}
                {!loading && !error && visible.length === 0 ? (
                    <Text className="text-sm text-muted dark:text-muted-dark">No hotels match this search.</Text>
                ) : null}
                {visible.map((hotel) => {
                    const price = minNightlyPrice(hotel);
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
                                        <Text className="text-xs font-normal text-muted dark:text-muted-dark"> / night, room</Text>
                                    </Text>
                                ) : null}
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
            <Pressable
                accessibilityLabel="Filters"
                onPress={() => setFiltersOpen(true)}
                className="absolute items-center justify-center w-14 h-14 rounded-full right-5 bottom-6"
                style={{ backgroundColor: primary }}
            >
                <Ionicons name="options" size={22} color="#fff" />
            </Pressable>
            <HotelFilterSheet
                visible={filtersOpen}
                hotels={hotels}
                value={filter}
                matchCount={visible.length}
                onChange={setFilter}
                onClose={() => setFiltersOpen(false)}
                onReset={() => setFilter(emptyHotelFilter())}
            />
        </SafeAreaView>
    );
}
