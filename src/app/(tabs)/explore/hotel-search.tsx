import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { cheapestByNightlyPrice, minNightlyPrice, nightsBetween, shortRangeLabel } from '../../../utilities/hotelSearch';
import { PillButton } from '../../../components/hotelSearch/HotelFlowChrome';
import { RecommendedHotelCard } from '../../../components/hotelSearch/RecommendedHotelCard';
import { fetchDivisionIdByName } from '../../../services/api/locations';
import { fetchHotels } from '../../../services/api/hotels';
import { HotelSearchListItem } from '../../../types/hotelSearch';

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

export default function HotelSearchPage() {
    const router = useRouter();
    const { fromHome } = useLocalSearchParams<{ fromHome?: string }>();
    const { isDark } = useTheme();
    const { params } = useHotelSearch();
    const { t } = useTranslation();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const [recommended, setRecommended] = useState<HotelSearchListItem[]>([]);
    const [recommendedLoading, setRecommendedLoading] = useState(true);
    const nights = nightsBetween(params.checkIn, params.checkOut);
    const roomLabel = params.roomCount === 1 ? '1 Room' : `${params.roomCount} Rooms`;

    const goBack = () => {
        if (fromHome === 'true') {
            router.replace('/(tabs)');
            return;
        }
        router.back();
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setRecommendedLoading(true);
            try {
                const divisionId = await fetchDivisionIdByName('Dhaka');
                if (!divisionId) {
                    if (!cancelled) {
                        setRecommended([]);
                    }
                    return;
                }
                const rows = await fetchHotels({
                    divisionId,
                    isActive: true,
                    page: 1,
                    limit: 100,
                });
                if (!cancelled) {
                    setRecommended(cheapestByNightlyPrice(rows as HotelSearchListItem[], 4));
                }
            } catch {
                if (!cancelled) {
                    setRecommended([]);
                }
            } finally {
                if (!cancelled) {
                    setRecommendedLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const search = () => {
        if (!params.destination?.locationId) {
            Alert.alert(t(TRANSLATION_KEYS.HOTEL_SEARCH.DESTINATION), t(TRANSLATION_KEYS.HOTEL_SEARCH.CHOOSE_DESTINATION));
            return;
        }
        router.push('/(tabs)/explore/hotel-results');
    };

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <ScrollView>
                <LinearGradient colors={[primary, isDark ? theme.colors['background-dark'] : theme.colors.background]} className="px-4 pt-2 pb-16">
                    <Pressable accessibilityLabel="Back" onPress={goBack} className="items-center justify-center w-11 h-11">
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </Pressable>
                    <Text className="text-3xl font-bold text-center text-white">{t(TRANSLATION_KEYS.HOTEL_SEARCH.TITLE)}</Text>
                    <Text className="mt-1 text-sm text-center text-white/90">{t(TRANSLATION_KEYS.HOTEL_SEARCH.SUBTITLE)}</Text>
                </LinearGradient>

                <View className="px-4 -mt-10">
                    <View className="p-4 bg-white shadow rounded-3xl dark:bg-surface-dark">
                        <Pressable onPress={() => router.push('/(tabs)/explore/hotel-destination')} className="p-3 mb-3 rounded-2xl bg-background dark:bg-background-dark">
                            <View className="flex-row items-center">
                                <Ionicons name="location" size={20} color={primary} />
                                <View className="ml-3">
                                    <Text className="font-bold text-text dark:text-text-dark">{params.destination?.name || t(TRANSLATION_KEYS.HOTEL_SEARCH.DESTINATION)}</Text>
                                    <Text className="text-xs text-muted dark:text-muted-dark">{params.destination?.subtitle || t(TRANSLATION_KEYS.HOTEL_SEARCH.DESTINATION_HINT)}</Text>
                                </View>
                            </View>
                        </Pressable>

                        <Pressable onPress={() => router.push('/(tabs)/explore/hotel-dates')} className="p-3 mb-3 rounded-2xl bg-background dark:bg-background-dark">
                            <View className="flex-row items-center">
                                <Text className="text-lg font-bold text-text dark:text-text-dark">{pad(Math.max(nights, 0))}</Text>
                                <View className="ml-3">
                                    <Text className="font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.NIGHTS)} ({shortRangeLabel(params.checkIn, params.checkOut)})</Text>
                                    <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.DATES_HINT)}</Text>
                                </View>
                            </View>
                        </Pressable>

                        <Pressable onPress={() => router.push('/(tabs)/explore/hotel-room-count')} className="p-3 mb-4 rounded-2xl bg-background dark:bg-background-dark">
                            <View className="flex-row items-center">
                                <Text className="text-lg font-bold text-text dark:text-text-dark">{pad(params.roomCount)}</Text>
                                <View className="ml-3">
                                    <Text className="font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOMS)}</Text>
                                    <Text className="text-xs text-muted dark:text-muted-dark">{roomLabel}</Text>
                                </View>
                            </View>
                        </Pressable>

                        <PillButton label={t(TRANSLATION_KEYS.HOTEL_SEARCH.SEARCH)} onPress={search} />
                    </View>

                    <View className="mt-8 mb-6">
                        <Text className="text-xl font-bold text-text dark:text-text-dark">
                            {t(TRANSLATION_KEYS.HOTEL_SEARCH.RECOMMENDED)}
                        </Text>
                        <Text className="mt-1 mb-4 text-sm text-muted dark:text-muted-dark">
                            {t(TRANSLATION_KEYS.HOTEL_SEARCH.DHAKA_DIVISION)}
                        </Text>
                        {recommendedLoading ? <ActivityIndicator color={primary} /> : null}
                        {!recommendedLoading && recommended.length > 0 ? (
                            <View className="flex-row flex-wrap justify-between">
                                {recommended.map((hotel) => {
                                    const price = minNightlyPrice(hotel);
                                    if (price === null) {
                                        return null;
                                    }
                                    return (
                                        <View key={hotel.id} style={{ width: '48%', marginBottom: 12 }}>
                                            <RecommendedHotelCard
                                                name={hotel.name}
                                                imageUrl={hotel.images?.[0]?.url}
                                                price={price}
                                                rating={hotel.rating}
                                                priceSuffix={t(TRANSLATION_KEYS.HOTEL_SEARCH.PER_NIGHT)}
                                                onPress={() => router.push({ pathname: '/(tabs)/explore/hotel-stay', params: { hotelId: hotel.id } })}
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
