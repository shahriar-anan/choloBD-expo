import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { HotelListFilter, HotelMinRating, HotelSortKey } from '../../types/hotelSearch';
import { PillButton } from './HotelFlowChrome';

const SORTS: Array<{ key: HotelSortKey; labelKey: string }> = [
    { key: 'rating', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.HIGHEST_RATING },
    { key: 'name', labelKey: TRANSLATION_KEYS.HOTEL_SEARCH.HOTEL_NAME },
];

const RATINGS: Array<{ value: HotelMinRating; label: string }> = [
    { value: '0', label: '' },
    { value: '3', label: '3.0+' },
    { value: '4', label: '4.0+' },
    { value: '5', label: '5' },
];

export function HotelFilterSheet({
    visible,
    value,
    matchCount,
    onChange,
    onClose,
    onReset,
}: {
    visible: boolean;
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
                        <Text className="mb-2 font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.MIN_RATING)}</Text>
                        {RATINGS.map((rating) => (
                            <Pressable
                                key={rating.value}
                                onPress={() => onChange({ ...value, minRating: rating.value })}
                                className="flex-row items-center py-2"
                            >
                                <Ionicons name={value.minRating === rating.value ? 'radio-button-on' : 'radio-button-off'} size={20} color={primary} />
                                <Text className="ml-2 text-text dark:text-text-dark">
                                    {rating.value === '0' ? t(TRANSLATION_KEYS.HOTEL_SEARCH.ANY_RATING) : rating.label}
                                </Text>
                            </Pressable>
                        ))}

                        <Text className="mt-4 mb-2 font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.SORT)}</Text>
                        {SORTS.map((sort) => (
                            <Pressable key={sort.key} onPress={() => onChange({ ...value, sort: sort.key })} className="flex-row items-center py-2">
                                <Ionicons name={value.sort === sort.key ? 'radio-button-on' : 'radio-button-off'} size={20} color={primary} />
                                <Text className="ml-2 text-text dark:text-text-dark">{t(sort.labelKey)}</Text>
                            </Pressable>
                        ))}
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
