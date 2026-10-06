// Use 4 spaces for indentation

import React from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { formatTaka, formatEnumLabel } from '../../utils/tripPlanItinerary';
import { CatalogPickKind } from './catalogPickerTypes';

export interface CatalogDetailModel {
    name: string;
    description?: string;
    imageUrl?: string;
    imageUrls?: string[];
    locationName?: string;
    rating?: number;
    priceLabel?: string;
    facts: Array<{ icon: React.ComponentProps<typeof Ionicons>['name']; label: string }>;
}

interface CatalogDetailViewProps {
    kind: CatalogPickKind;
    loading: boolean;
    detail: CatalogDetailModel | null;
}

export function CatalogDetailView({ loading, detail }: CatalogDetailViewProps) {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const surface2 = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];
    const text = isDark ? theme.colors['text-dark'] : theme.colors.text;

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center py-16">
                <ActivityIndicator size="large" color={primary} />
            </View>
        );
    }

    if (!detail) {
        return (
            <View className="flex-1 items-center justify-center px-6 py-16">
                <Text className="text-center text-sm" style={{ color: muted }}>
                    {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_SEARCH_EMPTY)}
                </Text>
            </View>
        );
    }

    const gallery = detail.imageUrls?.length ? detail.imageUrls : detail.imageUrl ? [detail.imageUrl] : [];
    const showRating = typeof detail.rating === 'number' && detail.rating > 0;

    return (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={{ height: 220, backgroundColor: surface2 }}>
                {gallery[0] ? (
                    <Image source={{ uri: gallery[0] }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="image-outline" size={48} color={muted} />
                    </View>
                )}
            </View>
            {gallery.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2">
                    {gallery.slice(1, 5).map((url) => (
                        <Image
                            key={url}
                            source={{ uri: url }}
                            className="w-20 h-20 rounded-lg mr-2"
                            resizeMode="cover"
                        />
                    ))}
                </ScrollView>
            ) : null}
            <View className="px-4 pt-4">
                <Text className="text-xl font-bold" style={{ color: text }}>{detail.name}</Text>
                {detail.locationName ? (
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="location-outline" size={16} color={primary} />
                        <Text className="ml-1 text-sm flex-1" style={{ color: muted }}>{detail.locationName}</Text>
                    </View>
                ) : null}
                <View className="flex-row items-center mt-2 flex-wrap gap-2">
                    {showRating ? (
                        <View className="flex-row items-center px-2 py-1 rounded-full bg-surface dark:bg-surface-dark">
                            <Ionicons name="star" size={14} color={isDark ? theme.colors['warning-dark'] : theme.colors.warning} />
                            <Text className="ml-1 text-sm font-bold" style={{ color: text }}>{detail.rating!.toFixed(1)}</Text>
                        </View>
                    ) : null}
                    {detail.priceLabel ? (
                        <Text className="text-base font-bold" style={{ color: primary }}>{detail.priceLabel}</Text>
                    ) : null}
                </View>
                {detail.facts.length > 0 ? (
                    <View className="mt-4 rounded-xl p-3 bg-surface dark:bg-surface-dark">
                        {detail.facts.map((fact) => (
                            <View key={fact.label} className="flex-row items-center mb-2 last:mb-0">
                                <Ionicons name={fact.icon} size={16} color={primary} />
                                <Text className="ml-2 text-sm flex-1" style={{ color: text }}>{fact.label}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
                {detail.description ? (
                    <View className="mt-4">
                        <Text className="text-sm font-semibold mb-2" style={{ color: text }}>
                            {t(TRANSLATION_KEYS.TRIP_PLANNER.DETAIL_ABOUT)}
                        </Text>
                        <Text className="text-sm leading-5" style={{ color: muted }}>{detail.description}</Text>
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}

export function hotelStartingPrice(roomTypes?: Array<{ pricePerNight?: number }>): number | undefined {
    const prices = (roomTypes ?? [])
        .map((room) => Number(room?.pricePerNight))
        .filter((price) => Number.isFinite(price) && price > 0);
    return prices.length > 0 ? Math.min(...prices) : undefined;
}

export function priceLabelFromCost(cost: number | undefined, freeLabel: string): string | undefined {
    if (cost === undefined || Number.isNaN(cost)) return undefined;
    if (cost === 0) return freeLabel;
    return formatTaka(cost);
}

export function tourTypeLabel(tourType: string | undefined, t: (key: string) => string): string {
    if (!tourType) return '';
    const key = TRANSLATION_KEYS.TOUR_SPOTS.TYPES[tourType as keyof typeof TRANSLATION_KEYS.TOUR_SPOTS.TYPES];
    return key ? t(key) : formatEnumLabel(tourType);
}
