import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientAppBar, PillButton } from '../../../components/hotelSearch/HotelFlowChrome';
import { useTransportSearch } from '../../../context/TransportSearchContext';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { OnPlatformTransportType } from '../../../types/transports';
import { goBack } from '../../../utilities/navigation';

const OPTIONS: { value: OnPlatformTransportType; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
    { value: 'BUS', icon: 'bus', labelKey: TRANSLATION_KEYS.TRANSPORT.BUS },
    { value: 'CAR_RENTAL', icon: 'car', labelKey: TRANSLATION_KEYS.TRANSPORT.RENTAL },
];

export default function TransportTypePage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const { params, setTransportType } = useTransportSearch();
    const [selected, setSelected] = useState<OnPlatformTransportType>(params.transportType);
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={t(TRANSLATION_KEYS.TRANSPORT.TYPE_TITLE)} onBack={() => goBack(router)} />
            <View className="flex-1 px-6 pt-6">
                <Text className="text-lg font-bold text-text dark:text-text-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT.TYPE)}
                </Text>
                <Text className="mt-1 mb-6 text-sm text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT.TYPE_HINT)}
                </Text>
                {OPTIONS.map((option) => {
                    const active = selected === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            onPress={() => setSelected(option.value)}
                            className="flex-row items-center p-4 mb-3 border rounded-2xl"
                            style={{
                                borderColor: active ? primary : isDark ? theme.colors['border-dark'] : theme.colors.border,
                                backgroundColor: active ? `${primary}14` : 'transparent',
                            }}
                        >
                            <Ionicons name={option.icon} size={22} color={primary} />
                            <Text className="ml-3 font-semibold text-text dark:text-text-dark">
                                {t(option.labelKey)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            <View className="px-4 pb-4">
                <PillButton
                    label={t(TRANSLATION_KEYS.TRANSPORT.CONFIRM)}
                    onPress={() => {
                        setTransportType(selected);
                        goBack(router);
                    }}
                />
            </View>
        </SafeAreaView>
    );
}
