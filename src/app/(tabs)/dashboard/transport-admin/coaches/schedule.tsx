import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScroll } from '../../../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../hooks/useTheme';
import theme from '../../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { useTransportOperator } from '../../../../../hooks/useTransportOperator';
import { CoachDateTimeField } from '../../../../../components/transportOperator/CoachDateTimeField';
import { createTransportTrip, getTransportRoutes } from '../../../../../services/api/transports';
import { TransportRouteRef } from '../../../../../types/transports';
import { routeLabelFromRef, tomorrowAt } from '../../../../../utilities/coachOperator';
import { goBack } from '../../../../../utilities/navigation';

function routeHasCounters(route: TransportRouteRef): boolean {
  return (route.stops?.length ?? 0) >= 2;
}

export default function TransportAdminCoachSchedulePage() {
  const router = useRouter();
  const { layoutId } = useLocalSearchParams<{ layoutId: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const { transportId, loading: opLoading } = useTransportOperator(true);

  const [routes, setRoutes] = useState<TransportRouteRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [routeId, setRouteId] = useState('');
  const [departureAt, setDepartureAt] = useState(() => tomorrowAt(8));
  const [arrivalAt, setArrivalAt] = useState(() => tomorrowAt(14));
  const [coachLabel, setCoachLabel] = useState('');

  const readyRoutes = useMemo(() => routes.filter(routeHasCounters), [routes]);

  useEffect(() => {
    if (!transportId) return;
    setLoading(true);
    getTransportRoutes(transportId)
      .then(setRoutes)
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, [transportId]);

  const inputClass =
    'border border-border dark:border-border-dark rounded-lg px-3 py-3 text-text dark:text-text-dark mb-3';

  const publish = async () => {
    if (!transportId || !layoutId || !routeId) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FILL_REQUIRED));
      return;
    }
    if (!(departureAt < arrivalAt)) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ARRIVAL_AFTER));
      return;
    }
    setBusy(true);
    try {
      await createTransportTrip({
        transportId,
        transportRouteId: routeId,
        layoutId,
        departureDateTime: departureAt.toISOString(),
        arrivalDateTime: arrivalAt.toISOString(),
        coachLabel: coachLabel.trim() || undefined,
      });
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SAVED));
      goBack(router);
    } catch (error: unknown) {
      Alert.alert(
        t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setBusy(false);
    }
  };

  if (opLoading || loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-6 pt-4 mb-2">
        <Pressable onPress={() => goBack(router)} style={{ padding: 6, marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={primary} />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_DEPARTURE)}
        </Text>
      </View>

      <KeyboardAwareScroll className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-2 text-sm font-semibold text-muted dark:text-muted-dark">
          {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STEP_ROUTE)}
        </Text>
        {readyRoutes.length === 0 ? (
          <Text className="mb-4 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ROUTE_HINT)}
          </Text>
        ) : (
          <View className="flex-row flex-wrap mb-4">
            {readyRoutes.map((route) => {
              const selected = routeId === route.id;
              return (
                <Pressable
                  key={route.id}
                  onPress={() => setRouteId(route.id)}
                  className={`px-3 py-2 mr-2 mb-2 rounded-full border ${selected ? 'border-primary bg-primary/15' : 'border-border dark:border-border-dark'}`}
                >
                  <Text className="text-sm text-text dark:text-text-dark">{routeLabelFromRef(route)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <CoachDateTimeField label={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DEPARTURE)} value={departureAt} onChange={setDepartureAt} />
        <CoachDateTimeField label={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ARRIVAL)} value={arrivalAt} onChange={setArrivalAt} />
        <TextInput
          className={inputClass}
          placeholder={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STEP_COACH)}
          placeholderTextColor={muted}
          value={coachLabel}
          onChangeText={setCoachLabel}
        />
        <Pressable
          disabled={busy || !routeId}
          onPress={publish}
          className="items-center py-3 rounded-xl bg-primary dark:bg-primary-dark"
          style={{ opacity: routeId ? 1 : 0.5 }}
        >
          <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.PUBLISH)}</Text>
        </Pressable>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
