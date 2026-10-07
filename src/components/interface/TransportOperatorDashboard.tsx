import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTransportOperator } from '../../hooks/useTransportOperator';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

function DeskCard({
  icon,
  title,
  subtitle,
  primary,
  muted,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  primary: string;
  muted: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
    >
      <View className="items-center justify-center w-12 h-12 mr-3 rounded-2xl bg-primary/10">
        <Ionicons name={icon} size={22} color={primary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-text dark:text-text-dark">{title}</Text>
        <Text className="mt-1 text-sm" style={{ color: muted }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={muted} />
    </Pressable>
  );
}

interface TransportOperatorDashboardProps {
  userName?: string;
  email?: string;
  imageUrl?: string;
  role?: string;
  userStatus?: string;
  onLogout: () => void;
}

export function TransportOperatorDashboard({
  userName,
}: TransportOperatorDashboardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const iconColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const { transport, transportType, loading, error } = useTransportOperator(true);
  const rental = transportType === 'CAR_RENTAL';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-6 pt-8 pb-8">
          <View className="flex-row items-start">
            <View className="flex-1">
              <Text className="text-sm text-muted dark:text-muted-dark">
                {userName
                  ? t(TRANSLATION_KEYS.PROFILE.GREETING, { name: userName })
                  : t(TRANSLATION_KEYS.DASHBOARD.WELCOME_BACK)}
              </Text>
              <Text className="mt-1 text-3xl font-bold font-heading text-text dark:text-text-dark">
                {t(rental ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.RENTAL_TITLE : TRANSLATION_KEYS.TRANSPORT_OPERATOR.TITLE)}
              </Text>
              {transport?.name ? (
                <Text className="mt-2 text-base text-muted dark:text-muted-dark">{transport.name}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/dashboard/transport-admin/settings')}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.DASHBOARD.SETTINGS)}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="settings-outline" size={24} color={iconColor} />
            </Pressable>
          </View>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator />
            </View>
          ) : error ? (
            <Text className="mt-6 text-sm text-error dark:text-error-dark">{error}</Text>
          ) : !transport ? (
            <Text className="mt-6 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NO_COMPANY)}
            </Text>
          ) : (
            <View className="mt-6">
              <DeskCard
                icon={rental ? 'key-outline' : 'people-outline'}
                title={t(rental ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.RENTALS : TRANSLATION_KEYS.TRANSPORT_OPERATOR.PASSENGERS)}
                subtitle={t(rental ? TRANSLATION_KEYS.TRANSPORT_OPERATOR.RENTALS_DESC : TRANSLATION_KEYS.TRANSPORT_OPERATOR.PASSENGERS_DESC)}
                primary={primary}
                muted={muted}
                onPress={() => router.push('/(tabs)/dashboard/transport-admin/bookings')}
              />
              {transportType === 'BUS' ? (
                <DeskCard
                  icon="bus-outline"
                  title={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.COACH_SERVICES)}
                  subtitle={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.COACH_SERVICES_DESC)}
                  primary={primary}
                  muted={muted}
                  onPress={() => router.push('/(tabs)/dashboard/transport-admin/coaches')}
                />
              ) : null}
              {transportType === 'CAR_RENTAL' ? (
                <DeskCard
                  icon="car-sport-outline"
                  title={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.VEHICLES)}
                  subtitle={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.VEHICLES_DESC)}
                  primary={primary}
                  muted={muted}
                  onPress={() => router.push('/(tabs)/dashboard/transport-admin/vehicles')}
                />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
