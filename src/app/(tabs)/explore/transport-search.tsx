import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { PillButton } from '../../../components/hotelSearch/HotelFlowChrome';
import { useTransportSearch } from '../../../context/TransportSearchContext';
import { longDayLabel } from '../../../utilities/hotelSearch';

export default function TransportSearchPage() {
    const router = useRouter();
    const { fromHome } = useLocalSearchParams<{ fromHome?: string }>();
    const { isDark } = useTheme();
    const { params, setReturnDate } = useTransportSearch();
    const { t } = useTranslation();
    const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
    const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
    const isRental = params.transportType === 'CAR_RENTAL';
    const typeLabel = isRental
        ? t(TRANSLATION_KEYS.TRANSPORT.RENTAL)
        : t(TRANSLATION_KEYS.TRANSPORT.BUS);

    const goBack = () => {
        if (fromHome === 'true') {
            router.replace('/(tabs)');
            return;
        }
        router.back();
    };

    const search = () => {
        if (isRental) {
            if (!params.from?.locationId) {
                Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.PICKUP_LOCATION), t(TRANSLATION_KEYS.TRANSPORT.CHOOSE_PICKUP));
                return;
            }
            if (!params.date || !params.returnDate) {
                Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL), t(TRANSLATION_KEYS.TRANSPORT.CHOOSE_DATES));
                return;
            }
            if (!isBefore(startOfDay(parseISO(params.date)), startOfDay(parseISO(params.returnDate)))) {
                Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL), t(TRANSLATION_KEYS.TRANSPORT.RETURN_AFTER_PICKUP));
                return;
            }
            router.push({
                pathname: '/(tabs)/explore/transport-results',
                params: {
                    mode: 'CAR_RENTAL',
                    locationId: params.from.locationId,
                    pickupName: params.from.name,
                    pickupDate: params.date,
                    returnDateRental: params.returnDate,
                },
            });
            return;
        }

        if (!params.from?.locationId) {
            Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.FROM), t(TRANSLATION_KEYS.TRANSPORT.CHOOSE_LOCATIONS));
            return;
        }
        if (!params.to?.locationId) {
            Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.TO), t(TRANSLATION_KEYS.TRANSPORT.CHOOSE_LOCATIONS));
            return;
        }
        if (!params.date) {
            Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.DATE), t(TRANSLATION_KEYS.TRANSPORT.SELECT_DATE));
            return;
        }
        if (
            params.returnDate &&
            isBefore(startOfDay(parseISO(params.returnDate)), startOfDay(parseISO(params.date)))
        ) {
            Alert.alert(t(TRANSLATION_KEYS.TRANSPORT.RETURN_DATE), t(TRANSLATION_KEYS.TRANSPORT.RETURN_DATE_INVALID));
            return;
        }

        router.push({
            pathname: '/(tabs)/explore/transport-results',
            params: {
                mode: 'BUS',
                originId: params.from.locationId,
                destinationId: params.to.locationId,
                date: params.date,
                returnDate: params.returnDate ?? '',
                leg: 'outbound',
            },
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <ScrollView>
                <LinearGradient colors={[primary, isDark ? theme.colors['background-dark'] : theme.colors.background]} className="px-4 pt-2 pb-16">
                    <Pressable accessibilityLabel="Back" onPress={goBack} className="items-center justify-center w-11 h-11">
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </Pressable>
                    <Text className="text-3xl font-bold text-center text-white">
                        {t(TRANSLATION_KEYS.TRANSPORT.SEARCH_TITLE)}
                    </Text>
                    <Text className="mt-1 text-sm text-center text-white/90">
                        {isRental
                            ? t(TRANSLATION_KEYS.TRANSPORT.RENTAL_SUBTITLE)
                            : t(TRANSLATION_KEYS.TRANSPORT.SEARCH_SUBTITLE)}
                    </Text>
                </LinearGradient>

                <View className="px-4 -mt-10">
                    <View className="p-4 bg-white shadow rounded-3xl dark:bg-surface-dark">
                        <Pressable
                            onPress={() => router.push('/(tabs)/explore/transport-from')}
                            className="p-3 mb-3 rounded-2xl bg-background dark:bg-background-dark"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name={isRental ? 'car' : 'radio-button-on'} size={20} color={primary} />
                                <View className="flex-1 ml-3">
                                    <Text className="text-xs text-muted dark:text-muted-dark">
                                        {isRental
                                            ? t(TRANSLATION_KEYS.TRANSPORT.PICKUP_LOCATION)
                                            : t(TRANSLATION_KEYS.TRANSPORT.FROM)}
                                    </Text>
                                    <Text className="font-bold text-text dark:text-text-dark">
                                        {params.from?.name || (isRental
                                            ? t(TRANSLATION_KEYS.TRANSPORT.CHOOSE_PICKUP)
                                            : t(TRANSLATION_KEYS.TRANSPORT.FROM))}
                                    </Text>
                                    <Text className="text-xs text-muted dark:text-muted-dark">
                                        {params.from?.subtitle || (isRental
                                            ? t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_HINT)
                                            : t(TRANSLATION_KEYS.TRANSPORT.FROM_HINT))}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>

                        {isRental ? null : (
                        <Pressable
                            onPress={() => router.push('/(tabs)/explore/transport-to')}
                            className="p-3 mb-3 rounded-2xl bg-background dark:bg-background-dark"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="location" size={20} color={primary} />
                                <View className="ml-3">
                                    <Text className="font-bold text-text dark:text-text-dark">
                                        {params.to?.name || t(TRANSLATION_KEYS.TRANSPORT.TO)}
                                    </Text>
                                    <Text className="text-xs text-muted dark:text-muted-dark">
                                        {params.to?.subtitle || t(TRANSLATION_KEYS.TRANSPORT.TO_HINT)}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                        )}

                        {isRental ? null : params.transportType === 'BUS' ? (
                            <Pressable
                                onPress={() => router.push('/(tabs)/explore/transport-date?which=return')}
                                className="p-3 mb-3 rounded-2xl bg-background dark:bg-background-dark"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar-outline" size={20} color={primary} />
                                    <View className="flex-1 ml-3">
                                        <Text className="font-bold text-text dark:text-text-dark">
                                            {params.returnDate
                                                ? longDayLabel(params.returnDate)
                                                : t(TRANSLATION_KEYS.TRANSPORT.RETURN_DATE_OPTIONAL)}
                                        </Text>
                                        <Text className="text-xs text-muted dark:text-muted-dark">
                                            {t(TRANSLATION_KEYS.TRANSPORT.RETURN_DATE_HINT)}
                                        </Text>
                                    </View>
                                    {params.returnDate ? (
                                        <Pressable
                                            onPress={() => setReturnDate(null)}
                                            className="px-2 py-1"
                                            accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT.CLEAR_RETURN_DATE)}
                                        >
                                            <Ionicons name="close-circle" size={22} color={muted} />
                                        </Pressable>
                                    ) : null}
                                </View>
                            </Pressable>
                        ) : null}

                        <Pressable
                            onPress={() => router.push('/(tabs)/explore/transport-date?which=journey')}
                            className="p-3 mb-3 rounded-2xl bg-background dark:bg-background-dark"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="calendar" size={20} color={primary} />
                                <View className="ml-3">
                                    <Text className="text-xs text-muted dark:text-muted-dark">
                                        {isRental
                                            ? t(TRANSLATION_KEYS.TRANSPORT.RENTAL_PICKUP_LABEL)
                                            : t(TRANSLATION_KEYS.TRANSPORT.DATE)}
                                    </Text>
                                    <Text className="font-bold text-text dark:text-text-dark">
                                        {params.date
                                            ? longDayLabel(params.date)
                                            : t(TRANSLATION_KEYS.TRANSPORT.SELECT_DATE)}
                                    </Text>
                                    {isRental ? null : (
                                        <Text className="text-xs text-muted dark:text-muted-dark">
                                            {t(TRANSLATION_KEYS.TRANSPORT.DATE_HINT)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </Pressable>

                        {isRental ? (
                            <Pressable
                                onPress={() => router.push('/(tabs)/explore/transport-date?which=return')}
                                className="p-3 mb-3 rounded-2xl bg-background dark:bg-background-dark"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar-outline" size={20} color={primary} />
                                    <View className="flex-1 ml-3">
                                        <Text className="text-xs text-muted dark:text-muted-dark">
                                            {t(TRANSLATION_KEYS.TRANSPORT.RENTAL_RETURN_LABEL)}
                                        </Text>
                                        <Text className="font-bold text-text dark:text-text-dark">
                                            {params.returnDate
                                                ? longDayLabel(params.returnDate)
                                                : t(TRANSLATION_KEYS.TRANSPORT.SELECT_DATE)}
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        ) : null}

                        <Pressable
                            onPress={() => router.push('/(tabs)/explore/transport-type')}
                            className="p-3 mb-4 rounded-2xl bg-background dark:bg-background-dark"
                        >
                            <View className="flex-row items-center">
                                <Ionicons
                                    name={params.transportType === 'BUS' ? 'bus' : 'car'}
                                    size={20}
                                    color={primary}
                                />
                                <View className="ml-3">
                                    <Text className="font-bold text-text dark:text-text-dark">{typeLabel}</Text>
                                    <Text className="text-xs text-muted dark:text-muted-dark">
                                        {t(TRANSLATION_KEYS.TRANSPORT.TYPE_HINT)}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>

                        <PillButton label={t(TRANSLATION_KEYS.TRANSPORT.SEARCH)} onPress={search} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
