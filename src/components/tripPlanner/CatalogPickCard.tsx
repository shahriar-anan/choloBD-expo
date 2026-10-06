// Use 4 spaces for indentation

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { CatalogListItem } from './catalogPickerTypes';

interface CatalogPickCardProps {
    item: CatalogListItem;
    selected: boolean;
    onPressDetails: () => void;
    onPressUse: () => void;
}

export function CatalogPickCard({ item, selected, onPressDetails, onPressUse }: CatalogPickCardProps) {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
    const surface2 = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];
    const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
    const showRating = typeof item.rating === 'number' && item.rating > 0;

    return (
        <View
            className="mb-3 overflow-hidden rounded-2xl border"
            style={{
                backgroundColor: surface,
                borderColor: selected ? primary : isDark ? theme.colors['border-dark'] : theme.colors.border,
                borderWidth: selected ? 2 : 1,
                ...theme.elevation.sm,
            }}
        >
            <TouchableOpacity activeOpacity={0.85} onPress={onPressDetails}>
                <View style={{ height: 168, backgroundColor: surface2 }}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Ionicons name="image-outline" size={36} color={muted} />
                        </View>
                    )}
                    {item.badgeLabel ? (
                        <View
                            className="absolute top-2 left-2 px-2 py-1 rounded-md"
                            style={{ backgroundColor: primary, maxWidth: '75%' }}
                        >
                            <Text className="text-[10px] font-bold text-white" numberOfLines={1}>
                                {item.badgeLabel}
                            </Text>
                        </View>
                    ) : null}
                    {selected ? (
                        <View
                            className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
                            style={{ backgroundColor: primary }}
                        >
                            <Ionicons name="checkmark" size={18} color="#fff" />
                        </View>
                    ) : null}
                    {showRating ? (
                        <View
                            className="absolute bottom-2 right-2 flex-row items-center px-2 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(12,12,15,0.72)' }}
                        >
                            <Ionicons name="star" size={12} color={isDark ? theme.colors['warning-dark'] : theme.colors.warning} />
                            <Text className="ml-1 text-xs font-bold text-white">{item.rating!.toFixed(1)}</Text>
                        </View>
                    ) : null}
                </View>
                <View className="px-3 pt-3 pb-2">
                    <Text className="text-base font-bold" style={{ color: text }} numberOfLines={2}>
                        {item.name}
                    </Text>
                    {item.locationName ? (
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="location-outline" size={14} color={primary} />
                            <Text className="ml-1 text-xs flex-1" style={{ color: muted }} numberOfLines={1}>
                                {item.locationName}
                            </Text>
                        </View>
                    ) : null}
                    {item.priceLabel ? (
                        <Text className="mt-2 text-sm font-bold" style={{ color: primary }}>
                            {item.priceLabel}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
            <View className="flex-row gap-2 px-3 pb-3">
                <TouchableOpacity
                    onPress={onPressDetails}
                    className="flex-1 py-2.5 rounded-lg border items-center"
                    style={{ borderColor: isDark ? theme.colors['border-dark'] : theme.colors.border }}
                >
                    <Text className="text-sm font-semibold" style={{ color: text }}>
                        {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_DETAILS)}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onPressUse} className="flex-1 py-2.5 rounded-lg items-center bg-primary">
                    <Text className="text-sm font-semibold text-onPrimary">
                        {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CATALOG_USE)}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
