import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { formatMoney } from '../../utilities/hotelSearch';

export function RecommendedHotelCard({
    name,
    imageUrl,
    price,
    rating,
    priceSuffix,
    onPress,
}: {
    name: string;
    imageUrl?: string;
    price: number;
    rating?: number;
    priceSuffix: string;
    onPress: () => void;
}) {
    const { isDark } = useTheme();
    const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const hasRating = typeof rating === 'number' && rating > 0;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={name}
            onPress={onPress}
            className="overflow-hidden bg-white rounded-3xl dark:bg-surface-dark"
        >
            <View className="bg-background dark:bg-background-dark" style={{ height: 148 }}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="items-center justify-center flex-1">
                        <Ionicons name="bed-outline" size={28} color={muted} />
                    </View>
                )}
                {hasRating ? (
                    <View className="absolute flex-row items-center px-2 py-1 rounded-full bottom-2 right-2" style={{ backgroundColor: 'rgba(12,12,15,0.72)' }}>
                        <Ionicons name="star" size={12} color={warning} />
                        <Text className="ml-1 text-xs font-bold text-white">{rating.toFixed(1)}</Text>
                    </View>
                ) : null}
            </View>
            <View className="px-3 pt-3 pb-3">
                <Text className="text-sm font-bold text-text dark:text-text-dark" numberOfLines={2}>
                    {name}
                </Text>
                <Text className="mt-2 text-base font-bold" style={{ color: primary }}>
                    {formatMoney(price)}
                </Text>
                <Text className="text-xs text-muted dark:text-muted-dark">{priceSuffix}</Text>
            </View>
        </Pressable>
    );
}
