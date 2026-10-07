import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { GradientAppBar } from '../../../components/hotelSearch/HotelFlowChrome';
import { searchHotelDestinations } from '../../../services/api/search';
import { HotelSearchDestination } from '../../../types/hotelSearch';
import { useHotelSearch } from '../../../context/HotelSearchContext';
import { goBack } from '../../../utilities/navigation';

export default function HotelDestinationPage() {
    const router = useRouter();
    const { isDark } = useTheme();
    const { params, setDestination } = useHotelSearch();
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<HotelSearchDestination[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

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
                const rows = await searchHotelDestinations(trimmed);
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

    const choose = (row: HotelSearchDestination) => {
        setDestination(row);
        goBack(router);
    };

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={t(TRANSLATION_KEYS.HOTEL_SEARCH.WHERE)} onBack={() => goBack(router)} />
            <View className="flex-row items-center px-4 py-3 border-b border-border dark:border-border-dark">
                <Ionicons name="business" size={20} color={primary} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t(TRANSLATION_KEYS.HOTEL_SEARCH.SEARCH_PLACEHOLDER)}
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
                    <Text className="px-4 py-6 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.TYPE_TO_SEARCH)}</Text>
                ) : null}
                {loading ? <ActivityIndicator className="mt-6" color={primary} /> : null}
                {error ? <Text className="px-4 py-6 text-sm text-error">{t(TRANSLATION_KEYS.HOTEL_SEARCH.SEARCH_FAILED)}</Text> : null}
                {!loading && !error && query.trim().length >= 2 && results.length === 0 ? (
                    <Text className="px-4 py-6 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.NO_MATCHES)}</Text>
                ) : null}
                {results.map((row) => {
                    const selected = params.destination?.id === row.id && params.destination.source === row.source;
                    return (
                        <Pressable
                            key={`${row.source}-${row.id}`}
                            onPress={() => choose(row)}
                            className="flex-row items-center px-4 py-3"
                            style={{ backgroundColor: selected ? `${primary}18` : 'transparent' }}
                        >
                            <Ionicons
                                name={row.source === 'location' ? 'location' : row.source === 'hotel' ? 'business' : row.source === 'activitySpot' ? 'walk' : 'navigate'}
                                size={20}
                                color={row.source === 'location' ? primary : muted}
                            />
                            <View className="flex-1 ml-3">
                                <Text className="font-bold text-text dark:text-text-dark">{row.name}</Text>
                                {row.subtitle ? <Text className="text-xs text-muted dark:text-muted-dark">{row.subtitle}</Text> : null}
                            </View>
                            {selected ? <Ionicons name="checkmark" size={18} color={primary} /> : null}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
