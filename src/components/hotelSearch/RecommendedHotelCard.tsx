import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { formatMoney } from '../../utilities/hotelSearch';

const CARD_HEIGHT = 168;

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
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const hasRating = typeof rating === 'number' && rating > 0;
    const priceLabel = formatMoney(price);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${priceLabel}`}
            onPress={onPress}
            style={{ height: CARD_HEIGHT, width: '100%', borderRadius: 16, ...theme.elevation.sm }}
        >
            <View
                style={{
                    flex: 1,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'],
                }}
            >
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="bed-outline" size={28} color={muted} />
                    </View>
                )}
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.78)']}
                    locations={[0.42, 0.68, 1]}
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                    pointerEvents="none"
                />
                {hasRating ? (
                    <View
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(12,12,15,0.72)',
                            borderRadius: 999,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                        }}
                    >
                        <Ionicons name="star" size={11} color={warning} />
                        <Text style={{ marginLeft: 4, color: '#fff', fontSize: 12, fontWeight: '700' }}>
                            {rating.toFixed(1)}
                        </Text>
                    </View>
                ) : null}
                <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10 }}>
                    <Text numberOfLines={1} style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                        {name}
                    </Text>
                    <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 }}>
                        {priceLabel}
                        <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.88)' }}>
                            {`  ${priceSuffix}`}
                        </Text>
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
