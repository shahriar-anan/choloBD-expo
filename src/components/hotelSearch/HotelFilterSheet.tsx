import React from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { HotelListFilter, HotelPriceBucket, HotelSearchListItem, HotelSortKey } from '../../types/hotelSearch';
import { formatMoney, minNightlyPrice, priceBuckets } from '../../utilities/hotelSearch';
import { PillButton } from './HotelFlowChrome';

const SORTS: Array<{ key: HotelSortKey; labelKey: string }> = [
    { key: 'popular', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.MOST_POPULAR },
    { key: 'cheapest', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.CHEAPEST },
    { key: 'rating', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.STAR_RATING },
];

export function HotelFilterSheet({
    visible,
    hotels,
    value,
    matchCount,
    onChange,
    onClose,
    onReset,
}: {
    visible: boolean;
    hotels: HotelSearchListItem[];
    value: HotelListFilter;
    matchCount: number;
    onChange: (next: HotelListFilter) => void;
    onClose: () => void;
    onReset: () => void;
}) {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
    const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
    const prices = hotels.map((hotel) => minNightlyPrice(hotel)).filter((price): price is number => price !== null);
    const buckets = priceBuckets(prices);
    const cheapest = prices.length ? Math.min(...prices) : null;
    const topStar = hotels.reduce((max, hotel) => Math.max(max, hotel.rating || 0), 0);
    const amenityNames = Array.from(new Set(hotels.flatMap((hotel) => hotel.amenities || []))).slice(0, 12);

    const toggleStar = (star: number) => {
        const stars = value.stars.includes(star)
            ? value.stars.filter((item) => item !== star)
            : [...value.stars, star];
        onChange({ ...value, stars });
    };

    const toggleBucket = (index: number) => {
        const priceBucketIndexes = value.priceBucketIndexes.includes(index)
            ? value.priceBucketIndexes.filter((item) => item !== index)
            : [...value.priceBucketIndexes, index];
        onChange({ ...value, priceBucketIndexes });
    };

    const toggleAmenity = (amenity: string) => {
        const amenityNamesSelected = value.amenityNames.includes(amenity)
            ? value.amenityNames.filter((item) => item !== amenity)
            : [...value.amenityNames, amenity];
        onChange({ ...value, amenityNames: amenityNamesSelected });
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="justify-end flex-1 bg-black/40">
                <View className="p-5 rounded-t-3xl" style={{ backgroundColor: surface, maxHeight: '88%' }}>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.FILTERS)}</Text>
                        <Pressable accessibilityLabel="Close" onPress={onClose} className="items-center justify-center w-11 h-11">
                            <Ionicons name="close" size={22} color={text} />
                        </Pressable>
                    </View>
                    <ScrollView>
                        <Text className="mb-2 font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.SORT)}</Text>
                        {SORTS.map((sort) => (
                            <Pressable key={sort.key} onPress={() => onChange({ ...value, sort: sort.key })} className="flex-row items-center justify-between py-2">
                                <View className="flex-row items-center">
                                    <Ionicons name={value.sort === sort.key ? 'radio-button-on' : 'radio-button-off'} size={20} color={primary} />
                                    <Text className="ml-2 text-text dark:text-text-dark">{t(sort.labelKey)}</Text>
                                </View>
                                {sort.key === 'cheapest' && cheapest !== null ? (
                                    <Text className="text-xs text-muted dark:text-muted-dark">{formatMoney(cheapest)}</Text>
                                ) : null}
                                {sort.key === 'rating' && topStar > 0 ? (
                                    <Text className="text-xs text-muted dark:text-muted-dark">{topStar} star</Text>
                                ) : null}
                            </Pressable>
                        ))}

                        <Text className="mt-4 mb-2 font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.PRICE_PER_NIGHT)}</Text>
                        {buckets.map((bucket: HotelPriceBucket, index) => (
                            <Pressable key={`${bucket.min}-${bucket.max}`} onPress={() => toggleBucket(index)} className="flex-row items-center py-2">
                                <Ionicons name={value.priceBucketIndexes.includes(index) ? 'checkbox' : 'square-outline'} size={20} color={primary} />
                                <Text className="ml-2 text-text dark:text-text-dark">{formatMoney(bucket.min)} - {formatMoney(bucket.max)}</Text>
                            </Pressable>
                        ))}

                        <Text className="mt-4 mb-2 font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.PROPERTY_NAME)}</Text>
                        <TextInput
                            value={value.propertyName}
                            onChangeText={(propertyName) => onChange({ ...value, propertyName })}
                            placeholder={t(TRANSLATION_KEYS.HOTEL_SEARCH.PROPERTY_NAME)}
                            placeholderTextColor={muted}
                            className="p-3 mb-4 rounded-xl text-text dark:text-text-dark"
                            style={{ borderWidth: 1, borderColor: border }}
                        />

                        <Text className="mb-2 font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.STAR_CATEGORY)}</Text>
                        <View className="flex-row gap-2 mb-4">
                            {[3, 4, 5].map((star) => {
                                const active = value.stars.includes(star);
                                return (
                                    <Pressable
                                        key={star}
                                        onPress={() => toggleStar(star)}
                                        className="px-4 py-2 rounded-full"
                                        style={{ backgroundColor: active ? primary : 'transparent', borderWidth: 1, borderColor: active ? primary : border }}
                                    >
                                        <Text style={{ color: active ? '#fff' : text }}>{star} ★</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {amenityNames.length > 0 ? (
                            <>
                                <Text className="mb-2 font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.FACILITIES)}</Text>
                                {amenityNames.map((amenity) => (
                                    <Pressable key={amenity} onPress={() => toggleAmenity(amenity)} className="flex-row items-center py-2">
                                        <Ionicons name={value.amenityNames.includes(amenity) ? 'checkbox' : 'square-outline'} size={20} color={primary} />
                                        <Text className="ml-2 text-text dark:text-text-dark">{amenity}</Text>
                                    </Pressable>
                                ))}
                            </>
                        ) : null}
                    </ScrollView>
                    <View className="flex-row gap-3 mt-4">
                        <Pressable onPress={onReset} className="items-center justify-center flex-1 py-4 rounded-full" style={{ backgroundColor: isDark ? '#333' : '#e5e7eb' }}>
                            <Text className="font-bold" style={{ color: text }}>{t(TRANSLATION_KEYS.HOTEL_SEARCH.RESET)}</Text>
                        </Pressable>
                        <View className="flex-[1.4]">
                            <PillButton label={t(TRANSLATION_KEYS.HOTEL_SEARCH.SHOW_HOTELS, { count: matchCount })} onPress={onClose} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
