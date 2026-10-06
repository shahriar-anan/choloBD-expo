// Use 4 spaces for indentation

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { formatTaka } from '../../utils/tripPlanItinerary';

export interface SelectedPlaceValue {
    id?: string;
    name?: string;
    imageUrl?: string;
    subtitle?: string;
    cost?: number;
}

interface SelectedPlaceRowProps {
    label: string;
    required?: boolean;
    emptyLabel: string;
    emptyIcon: keyof typeof Ionicons.glyphMap;
    value?: SelectedPlaceValue;
    onPressChoose: () => void;
    onPressChange: () => void;
    onPressRemove?: () => void;
    disabled?: boolean;
    disabledHint?: string;
}

export function SelectedPlaceRow({
    label,
    required,
    emptyLabel,
    emptyIcon,
    value,
    onPressChoose,
    onPressChange,
    onPressRemove,
    disabled,
    disabledHint,
}: SelectedPlaceRowProps) {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
    const surface2 = isDark ? theme.colors['surface-2-dark'] : theme.colors['surface-2'];
    const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
    const border = isDark ? theme.colors['border-dark'] : theme.colors.border;

    if (disabled && disabledHint) {
        return (
            <View className="mb-3">
                <Text className="text-sm font-semibold mb-2" style={{ color: text }}>
                    {label}
                    {required ? <Text style={{ color: theme.colors.error }}> *</Text> : null}
                </Text>
                <Text className="text-xs" style={{ color: muted }}>{disabledHint}</Text>
            </View>
        );
    }

    const hasSelection = Boolean(value?.id && value?.name);

    return (
        <View className="mb-3">
            <Text className="text-sm font-semibold mb-2" style={{ color: text }}>
                {label}
                {required ? <Text style={{ color: theme.colors.error }}> *</Text> : null}
                {!required ? (
                    <Text className="text-xs font-normal" style={{ color: muted }}>
                        {' '}
                        ({t(TRANSLATION_KEYS.BOOKING.OPTIONAL)})
                    </Text>
                ) : null}
            </Text>
            {hasSelection ? (
                <View
                    className="flex-row items-center rounded-xl border p-2"
                    style={{ backgroundColor: surface, borderColor: border }}
                >
                    <View className="w-[72px] h-[72px] rounded-lg overflow-hidden" style={{ backgroundColor: surface2 }}>
                        {value?.imageUrl ? (
                            <Image source={{ uri: value.imageUrl }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <Ionicons name={emptyIcon} size={28} color={muted} />
                            </View>
                        )}
                    </View>
                    <View className="flex-1 ml-3 mr-2">
                        <Text className="text-base font-bold" style={{ color: text }} numberOfLines={2}>
                            {value?.name}
                        </Text>
                        {value?.subtitle ? (
                            <Text className="text-xs mt-0.5" style={{ color: muted }} numberOfLines={1}>
                                {value.subtitle}
                            </Text>
                        ) : null}
                        {typeof value?.cost === 'number' && value.cost > 0 ? (
                            <Text className="text-sm font-semibold mt-1" style={{ color: primary }}>
                                {formatTaka(value.cost)}
                            </Text>
                        ) : null}
                    </View>
                    <View className="items-end gap-2">
                        <TouchableOpacity
                            onPress={onPressChange}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            className="px-2 py-1"
                        >
                            <Text className="text-xs font-semibold" style={{ color: primary }}>
                                {t(TRANSLATION_KEYS.TRIP_PLANNER.WIZARD_CHANGE_PLACE)}
                            </Text>
                        </TouchableOpacity>
                        {onPressRemove ? (
                            <TouchableOpacity
                                onPress={onPressRemove}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                className="p-1"
                            >
                                <Ionicons name="trash-outline" size={20} color={isDark ? theme.colors['error-dark'] : theme.colors.error} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    onPress={onPressChoose}
                    activeOpacity={0.7}
                    className="flex-row items-center rounded-xl border px-3 py-4"
                    style={{ backgroundColor: surface, borderColor: border, borderStyle: 'dashed' }}
                >
                    <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${primary}18` }}
                    >
                        <Ionicons name={emptyIcon} size={22} color={primary} />
                    </View>
                    <Text className="flex-1 text-sm font-semibold" style={{ color: primary }}>
                        {emptyLabel}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={muted} />
                </TouchableOpacity>
            )}
        </View>
    );
}
