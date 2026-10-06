// Use 4 spaces for indentation

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { getTourSpots, getTourSpotDetail } from '../../services/api/tourSpots';
import { getActivitySpots, getActivitySpotById } from '../../services/api/activitySpots';
import { fetchHotels } from '../../services/api/hotels';
import { fetchHotelById } from '../../services/api/hotelDetail';
import { HOTEL_VALUES, formatEnumLabel, formatTaka } from '../../utils/tripPlanItinerary';
import { CatalogPickCard } from './CatalogPickCard';
import {
    CatalogDetailModel,
    CatalogDetailView,
    hotelStartingPrice,
    priceLabelFromCost,
    tourTypeLabel,
} from './CatalogDetailView';
import { CatalogListItem, CatalogPickKind, CatalogPickResult } from './catalogPickerTypes';

const PAGE_SIZE = 20;

const ACTIVITY_FILTER_TYPES = [
    'SIGHTSEEING',
    'ADVENTURE_SPORTS',
    'WATER_ACTIVITIES',
    'CULTURAL_EXPERIENCE',
    'FOOD_TASTING',
    'SHOPPING',
    'WILDLIFE',
] as const;

interface CatalogPickerModalProps {
    visible: boolean;
    kind: CatalogPickKind;
    divisionId: string;
    selectedId?: string;
    onClose: () => void;
    onSelect: (result: CatalogPickResult) => void;
}

function listItemFromTourSpot(spot: { id: string; name: string; imageUrl?: string; locationName?: string; rating?: number; tourType?: string }, badge: string): CatalogListItem {
    return {
        id: spot.id,
        name: spot.name,
        imageUrl: spot.imageUrl,
        locationName: spot.locationName,
        rating: spot.rating,
        badgeLabel: badge,
    };
}

function listItemFromActivity(
    spot: { id: string; name: string; imageUrl?: string; locationName?: string; rating?: number; entryCost?: number; activityType?: string },
    typeLabel: string,
    freeLabel: string,
): CatalogListItem {
    const cost = spot.entryCost;
    return {
        id: spot.id,
        name: spot.name,
        imageUrl: spot.imageUrl,
        locationName: spot.locationName,
        rating: spot.rating,
        badgeLabel: typeLabel || undefined,
        priceLabel: priceLabelFromCost(cost, freeLabel),
        rawCost: typeof cost === 'number' ? cost : undefined,
    };
}

function listItemFromHotel(
    hotel: { id: string; name: string; images?: Array<{ url: string }>; location?: { name?: string }; rating?: number; hotelType?: string; roomTypes?: Array<{ pricePerNight?: number }> },
): CatalogListItem {
    const minPrice = hotelStartingPrice(hotel.roomTypes);
    return {
        id: hotel.id,
        name: hotel.name,
        imageUrl: hotel.images?.[0]?.url,
        locationName: hotel.location?.name,
        rating: hotel.rating,
        badgeLabel: hotel.hotelType ? formatEnumLabel(hotel.hotelType) : undefined,
        priceLabel: minPrice !== undefined ? `${formatTaka(minPrice)} / night` : undefined,
        hotelType: hotel.hotelType,
        rawCost: minPrice,
    };
}

export function CatalogPickerModal({
    visible,
    kind,
    divisionId,
    selectedId,
    onClose,
    onSelect,
}: CatalogPickerModalProps) {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
    const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
    const border = isDark ? theme.colors['border-dark'] : theme.colors.border;

    const [screen, setScreen] = useState<'list' | 'detail'>('list');
    const [detailId, setDetailId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [items, setItems] = useState<CatalogListItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hotelHasMore, setHotelHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [detail, setDetail] = useState<CatalogDetailModel | null>(null);
    const [detailPick, setDetailPick] = useState<CatalogPickResult | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const titleKey = useMemo(() => {
        if (kind === 'tourSpot') return TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_TITLE_TOUR;
        if (kind === 'activity') return TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_TITLE_ACTIVITY;
        return TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_TITLE_HOTEL;
    }, [kind]);

    const freeLabel = t(TRANSLATION_KEYS.ATTRACTIONS.FREE);

    useEffect(() => {
        const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(handle);
    }, [search]);

    const resetList = useCallback(() => {
        setScreen('list');
        setDetailId(null);
        setDetail(null);
        setDetailPick(null);
        setSearch('');
        setDebouncedSearch('');
        setTypeFilter(null);
        setItems([]);
        setPage(1);
        setTotal(0);
        setHotelHasMore(false);
    }, []);

    useEffect(() => {
        if (!visible) return;
        resetList();
    }, [visible, kind, divisionId, resetList]);

    const loadPage = useCallback(
        async (pageNum: number, replace: boolean) => {
            if (!divisionId) {
                setItems([]);
                return;
            }
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);
            try {
                if (kind === 'tourSpot') {
                    const res = await getTourSpots({
                        divisionId,
                        name: debouncedSearch || undefined,
                        page: pageNum,
                        limit: PAGE_SIZE,
                    });
                    const mapped = res.results.map((spot) =>
                        listItemFromTourSpot(spot, tourTypeLabel(spot.tourType, t)),
                    );
                    setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
                    setTotal(res.total);
                    setPage(res.page);
                } else if (kind === 'activity') {
                    const res = await getActivitySpots({
                        divisionId,
                        name: debouncedSearch || undefined,
                        activityType: typeFilter || undefined,
                        page: pageNum,
                        limit: PAGE_SIZE,
                    });
                    const mapped = res.results.map((spot) => {
                        const typeKey = spot.activityType
                            ? TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES[
                                  spot.activityType as keyof typeof TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES
                              ]
                            : undefined;
                        const typeLabel = typeKey ? t(typeKey) : formatEnumLabel(spot.activityType);
                        return listItemFromActivity(spot, typeLabel, freeLabel);
                    });
                    setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
                    setTotal(res.total);
                    setPage(res.page);
                } else {
                    const rows = await fetchHotels({
                        divisionId,
                        name: debouncedSearch || undefined,
                        hotelType: typeFilter || undefined,
                        page: pageNum,
                        limit: PAGE_SIZE,
                    });
                    const mapped = rows.map((hotel) =>
                        listItemFromHotel(hotel as {
                            id: string;
                            name: string;
                            images?: Array<{ url: string }>;
                            location?: { name?: string };
                            rating?: number;
                            hotelType?: string;
                            roomTypes?: Array<{ pricePerNight?: number }>;
                        }),
                    );
                    setItems((prev) => (replace ? mapped : [...prev, ...mapped]));
                    setHotelHasMore(mapped.length >= PAGE_SIZE);
                    setPage(pageNum);
                }
            } catch {
                if (replace) setItems([]);
            } finally {
                setLoading(false);
                setLoadingMore(false);
                setRefreshing(false);
            }
        },
        [divisionId, kind, debouncedSearch, typeFilter, t, freeLabel],
    );

    useEffect(() => {
        if (!visible || screen !== 'list') return;
        loadPage(1, true);
    }, [visible, screen, debouncedSearch, typeFilter, divisionId, kind, loadPage]);

    const hasMore = kind === 'hotel' ? hotelHasMore : items.length < total;

    const openDetail = async (id: string, prefetch?: CatalogListItem) => {
        setScreen('detail');
        setDetailId(id);
        setDetailLoading(true);
        setDetail(null);
        setDetailPick(null);
        try {
            if (kind === 'tourSpot') {
                const spot = await getTourSpotDetail(id);
                const imageUrls = spot.images?.map((img) => img.url) ?? [];
                setDetail({
                    name: spot.name,
                    description: spot.description,
                    imageUrl: imageUrls[0],
                    imageUrls,
                    locationName: spot.location?.name,
                    rating: spot.rating,
                    facts: [
                        ...(spot.tourType
                            ? [{ icon: 'map-outline' as const, label: tourTypeLabel(spot.tourType, t) }]
                            : []),
                        ...(spot.bestTimeToVisit
                            ? [{ icon: 'sunny-outline' as const, label: spot.bestTimeToVisit }]
                            : []),
                    ],
                });
                setDetailPick({
                    id: spot.id,
                    name: spot.name,
                    imageUrl: imageUrls[0],
                    locationName: spot.location?.name,
                });
            } else if (kind === 'activity') {
                const spot = await getActivitySpotById(id);
                if (!spot) throw new Error('not found');
                const imageUrls = spot.images?.map((img) => img.url) ?? (spot.imageUrl ? [spot.imageUrl] : []);
                const cost = spot.entryCost;
                setDetail({
                    name: spot.name,
                    description: spot.description,
                    imageUrl: imageUrls[0],
                    imageUrls,
                    locationName: spot.locationName,
                    rating: spot.rating,
                    priceLabel: priceLabelFromCost(cost, freeLabel),
                    facts: [
                        ...(spot.duration ? [{ icon: 'time-outline' as const, label: spot.duration }] : []),
                        ...(spot.openingHours
                            ? [{ icon: 'time-outline' as const, label: `${spot.openingHours}${spot.closingHours ? ` – ${spot.closingHours}` : ''}` }]
                            : []),
                    ],
                });
                setDetailPick({
                    id: spot.id,
                    name: spot.name,
                    imageUrl: imageUrls[0],
                    locationName: spot.locationName,
                    cost,
                });
            } else {
                const hotel = await fetchHotelById(id);
                if (!hotel) throw new Error('not found');
                const imageUrls = hotel.images?.map((img) => img.url) ?? [];
                const minPrice = hotelStartingPrice(hotel.roomTypes);
                setDetail({
                    name: hotel.name,
                    description: hotel.description,
                    imageUrl: imageUrls[0],
                    imageUrls,
                    locationName: hotel.location?.name,
                    rating: hotel.rating,
                    priceLabel: minPrice !== undefined ? `${formatTaka(minPrice)} / night` : undefined,
                    facts: [
                        ...(hotel.checkInTime && hotel.checkOutTime
                            ? [{ icon: 'log-in-outline' as const, label: `Check-in ${hotel.checkInTime} · Check-out ${hotel.checkOutTime}` }]
                            : []),
                        ...(hotel.amenities?.length
                            ? [{ icon: 'checkmark-circle-outline' as const, label: hotel.amenities.slice(0, 4).join(', ') }]
                            : []),
                    ],
                });
                setDetailPick({
                    id: hotel.id,
                    name: hotel.name,
                    imageUrl: imageUrls[0],
                    locationName: hotel.location?.name,
                    cost: minPrice,
                    hotelType: (hotel as { hotelType?: string }).hotelType,
                });
            }
        } catch {
            if (prefetch) {
                setDetail({
                    name: prefetch.name,
                    imageUrl: prefetch.imageUrl,
                    locationName: prefetch.locationName,
                    rating: prefetch.rating,
                    priceLabel: prefetch.priceLabel,
                    facts: [],
                });
                setDetailPick({
                    id: prefetch.id,
                    name: prefetch.name,
                    imageUrl: prefetch.imageUrl,
                    locationName: prefetch.locationName,
                    cost: prefetch.rawCost,
                    hotelType: prefetch.hotelType,
                });
            }
        } finally {
            setDetailLoading(false);
        }
    };

    const confirmPick = (pick: CatalogPickResult) => {
        onSelect(pick);
        onClose();
    };

    const pickFromListItem = (item: CatalogListItem) => {
        confirmPick({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            locationName: item.locationName,
            cost: item.rawCost,
            hotelType: item.hotelType,
        });
    };

    const handleBack = () => {
        if (screen === 'detail') {
            setScreen('list');
            setDetailId(null);
            return;
        }
        onClose();
    };

    const filterChips =
        kind === 'hotel'
            ? HOTEL_VALUES
            : kind === 'activity'
              ? ACTIVITY_FILTER_TYPES
              : [];

    const searchPlaceholder =
        kind === 'tourSpot'
            ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_SPOTS)
            : kind === 'activity'
              ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_ACTIVITIES)
              : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_HOTELS);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleBack}>
            <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
                <View className="px-4 py-3 flex-row items-center border-b border-border dark:border-border-dark">
                    <TouchableOpacity onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} className="pr-3">
                        <Ionicons name="arrow-back" size={24} color={text} />
                    </TouchableOpacity>
                    <Text className="flex-1 text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>
                        {t(titleKey)}
                    </Text>
                </View>

                {screen === 'list' ? (
                    <>
                        {!divisionId ? (
                            <View className="flex-1 px-4 justify-center">
                                <Text className="text-sm text-center text-muted dark:text-muted-dark">
                                    {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_NEED_DIVISION)}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View className="px-4 pt-3 pb-2">
                                    <View
                                        className="flex-row items-center px-3 rounded-xl border"
                                        style={{ borderColor: border, backgroundColor: surface }}
                                    >
                                        <Ionicons name="search" size={18} color={primary} />
                                        <TextInput
                                            value={search}
                                            onChangeText={setSearch}
                                            placeholder={searchPlaceholder}
                                            placeholderTextColor={muted}
                                            autoCorrect={false}
                                            className="flex-1 py-2.5 px-2 text-text dark:text-text-dark"
                                            style={{ fontSize: 15 }}
                                        />
                                        {search ? (
                                            <TouchableOpacity onPress={() => setSearch('')}>
                                                <Ionicons name="close-circle" size={20} color={muted} />
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                    {filterChips.length > 0 ? (
                                        <FlatList
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            data={[{ id: 'all', value: null as string | null }, ...filterChips.map((v) => ({ id: v, value: v }))]}
                                            keyExtractor={(item) => item.id}
                                            className="mt-3"
                                            renderItem={({ item }) => {
                                                const active = typeFilter === item.value;
                                                let label =
                                                    item.value === null
                                                        ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_FILTER_ALL)
                                                        : formatEnumLabel(item.value);
                                                if (kind === 'activity' && item.value) {
                                                    const typeKey =
                                                        TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES[
                                                            item.value as keyof typeof TRANSLATION_KEYS.ATTRACTIONS.ACTIVITY_TYPES
                                                        ];
                                                    if (typeKey) label = t(typeKey);
                                                }
                                                return (
                                                    <TouchableOpacity
                                                        onPress={() => setTypeFilter(item.value)}
                                                        className={`mr-2 px-3 py-2 rounded-full border ${active ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'}`}
                                                    >
                                                        <Text
                                                            className={`text-xs font-semibold ${active ? 'text-white' : 'text-text dark:text-text-dark'}`}
                                                        >
                                                            {label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            }}
                                        />
                                    ) : null}
                                </View>
                                {loading && items.length === 0 ? (
                                    <View className="flex-1 items-center justify-center">
                                        <ActivityIndicator size="large" color={primary} />
                                    </View>
                                ) : (
                                    <FlatList
                                        data={items}
                                        keyExtractor={(item) => item.id}
                                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                                        keyboardShouldPersistTaps="handled"
                                        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                                        refreshControl={
                                            <RefreshControl
                                                refreshing={refreshing}
                                                onRefresh={() => {
                                                    setRefreshing(true);
                                                    loadPage(1, true);
                                                }}
                                                tintColor={primary}
                                            />
                                        }
                                        onEndReached={() => {
                                            if (!loadingMore && !loading && hasMore) {
                                                loadPage(page + 1, false);
                                            }
                                        }}
                                        onEndReachedThreshold={0.3}
                                        ListEmptyComponent={
                                            !loading ? (
                                                <Text className="text-sm text-center text-muted dark:text-muted-dark mt-8">
                                                    {debouncedSearch || typeFilter
                                                        ? t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_NO_MATCH)
                                                        : t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_EMPTY)}
                                                </Text>
                                            ) : null
                                        }
                                        ListFooterComponent={
                                            loadingMore ? <ActivityIndicator className="my-4" color={primary} /> : null
                                        }
                                        renderItem={({ item }) => (
                                            <CatalogPickCard
                                                item={item}
                                                selected={item.id === selectedId}
                                                onPressDetails={() => openDetail(item.id, item)}
                                                onPressUse={() => pickFromListItem(item)}
                                            />
                                        )}
                                    />
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <CatalogDetailView kind={kind} loading={detailLoading} detail={detail} />
                        <View className="px-4 py-3 border-t border-border dark:border-border-dark">
                            <TouchableOpacity
                                disabled={!detailPick}
                                onPress={() => detailPick && confirmPick(detailPick)}
                                className={`rounded-xl py-3.5 items-center ${detailPick ? 'bg-primary' : 'bg-muted/40'}`}
                            >
                                <Text className="font-semibold text-onPrimary">
                                    {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_USE)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </SafeAreaView>
        </Modal>
    );
}
