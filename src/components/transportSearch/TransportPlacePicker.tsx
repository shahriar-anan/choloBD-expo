import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { GradientAppBar } from '../hotelSearch/HotelFlowChrome';
import { searchTransportPlaces } from '../../services/api/search';
import { TransportPlace } from '../../types/transportSearch';

interface TransportPlacePickerProps {
    title: string;
    selectedId?: string;
    onChoose: (place: TransportPlace) => void;
}

export function TransportPlacePicker({ title, selectedId, onChoose }: TransportPlacePickerProps) {
    const router = useRouter();
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TransportPlace[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setError(false);
            return;
        }
        let cancelled = false;
        const handle = setTimeout(async () => {
            setLoading(true);
            setError(false);
            try {
                const rows = await searchTransportPlaces(trimmed);
                if (!cancelled) {
                    setResults(rows);
                }
            } catch {
                if (!cancelled) {
                    setError(true);
                    setResults([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [query]);

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={title} onBack={() => router.back()} />
            <View className="flex-row items-center px-4 py-3 border-b border-border dark:border-border-dark">
                <Ionicons name="location" size={20} color={primary} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t(TRANSLATION_KEYS.TRANSPORT.SEARCH_PLACEHOLDER)}
                    placeholderTextColor={muted}
                    className="flex-1 ml-3 text-text dark:text-text-dark"
                />
                {query.length > 0 ? (
                    <Pressable onPress={() => setQuery('')}>
                        <Text style={{ color: primary }}>{t(TRANSLATION_KEYS.HOTEL_SEARCH.CLEAR)}</Text>
                    </Pressable>
                ) : null}
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
                {query.trim().length < 2 ? (
                    <Text className="px-4 py-6 text-sm text-muted dark:text-muted-dark">
                        {t(TRANSLATION_KEYS.TRANSPORT.TYPE_TO_SEARCH)}
                    </Text>
                ) : null}
                {loading ? <ActivityIndicator className="mt-6" color={primary} /> : null}
                {error ? (
                    <Text className="px-4 py-6 text-sm text-error">{t(TRANSLATION_KEYS.HOTEL_SEARCH.SEARCH_FAILED)}</Text>
                ) : null}
                {!loading && !error && query.trim().length >= 2 && results.length === 0 ? (
                    <Text className="px-4 py-6 text-sm text-muted dark:text-muted-dark">
                        {t(TRANSLATION_KEYS.HOTEL_SEARCH.NO_MATCHES)}
                    </Text>
                ) : null}
                {results.map((row) => {
                    const selected = selectedId === row.id;
                    return (
                        <Pressable
                            key={row.id}
                            onPress={() => onChoose(row)}
                            className="flex-row items-center px-4 py-3"
                            style={{ backgroundColor: selected ? `${primary}18` : 'transparent' }}
                        >
                            <Ionicons name="location" size={20} color={primary} />
                            <View className="flex-1 ml-3">
                                <Text className="font-bold text-text dark:text-text-dark">{row.name}</Text>
                                {row.subtitle ? (
                                    <Text className="text-xs text-muted dark:text-muted-dark">{row.subtitle}</Text>
                                ) : null}
                            </View>
                            {selected ? <Ionicons name="checkmark" size={18} color={primary} /> : null}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
