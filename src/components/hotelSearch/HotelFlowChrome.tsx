import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

export function GradientAppBar({
    title,
    subtitle,
    onBack,
    rightIcon,
    onRightPress,
    rightLabel,
}: {
    title: string;
    subtitle?: string;
    onBack: () => void;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightPress?: () => void;
    rightLabel?: string;
}) {
    const { isDark } = useTheme();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    return (
        <LinearGradient colors={[primary, primary]} className="px-4 pt-3 pb-4">
            <View className="flex-row items-center">
                <Pressable accessibilityLabel="Back" onPress={onBack} className="items-center justify-center w-11 h-11">
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </Pressable>
                <View className="items-center flex-1">
                    <Text className="text-base font-bold text-white" numberOfLines={1}>{title}</Text>
                    {subtitle ? (
                        <Text className="text-xs text-white/80" numberOfLines={1}>{subtitle}</Text>
                    ) : null}
                </View>
                {rightIcon ? (
                    <Pressable accessibilityLabel={rightLabel || 'Action'} onPress={onRightPress} className="items-center justify-center w-11 h-11">
                        <Ionicons name={rightIcon} size={20} color="#fff" />
                    </Pressable>
                ) : (
                    <View className="w-11" />
                )}
            </View>
        </LinearGradient>
    );
}

export function PillButton({
    label,
    onPress,
    disabled,
}: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    const { isDark } = useTheme();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    return (
        <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={onPress}
            className="items-center justify-center py-4 rounded-full"
            style={{ backgroundColor: disabled ? muted : primary }}
        >
            <Text className="text-base font-bold text-white">{label}</Text>
        </Pressable>
    );
}

export function Stepper({
    value,
    onChange,
    min = 1,
}: {
    value: number;
    onChange: (next: number) => void;
    min?: number;
}) {
    const { isDark } = useTheme();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const minusDisabled = value <= min;
    return (
        <View className="flex-row items-center">
            <Pressable
                accessibilityLabel="Decrease"
                disabled={minusDisabled}
                onPress={() => onChange(value - 1)}
                className="items-center justify-center w-11 h-11 border rounded-full"
                style={{ borderColor: minusDisabled ? muted : primary }}
            >
                <Ionicons name="remove" size={18} color={minusDisabled ? muted : primary} />
            </Pressable>
            <Text className="w-10 text-base font-bold text-center text-text dark:text-text-dark">{value}</Text>
            <Pressable
                accessibilityLabel="Increase"
                onPress={() => onChange(value + 1)}
                className="items-center justify-center w-11 h-11 border rounded-full"
                style={{ borderColor: primary }}
            >
                <Ionicons name="add" size={18} color={primary} />
            </Pressable>
        </View>
    );
}
