import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { QRCodeDisplay } from '../ui/QRCodeDisplay';
import { generateTransportBoardingQr } from '../../services/api/transportBookings';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { goBack } from '../../utilities/navigation';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface BusBoardingQrScreenProps {
  bookingId: string | undefined;
}

export function BusBoardingQrScreen({ bookingId }: BusBoardingQrScreenProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    setLoading(true);
    setError(null);
    generateTransportBoardingQr(bookingId)
      .then((result) => {
        if (!active) return;
        setQrToken(result.qrToken);
        setExpiresAt(result.expiresAt || null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'QR code could not be created');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b dark:bg-surface-dark border-border dark:border-border-dark">
        <Text className="flex-1 mr-3 text-2xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.QR.BUS_BOARDING_TITLE)}
        </Text>
        <Pressable onPress={() => goBack(router)} style={{ padding: 6 }}>
          <Ionicons name="close" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
        </Pressable>
      </View>

      {loading || (Boolean(bookingId) && !error && !qrToken) ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text className="mt-4 text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.QR.GENERATING)}</Text>
        </View>
      ) : qrToken ? (
        <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 24, gap: 16 }}>
          <QRCodeDisplay
            qrToken={qrToken}
            expiresAt={expiresAt ?? undefined}
            label={t(TRANSLATION_KEYS.QR.BUS_BOARDING_TITLE)}
            hint={t(TRANSLATION_KEYS.QR.BUS_SHOW_STAFF)}
          />
          <View className="p-4 rounded-xl bg-surface-2 dark:bg-surface-2-dark border border-border dark:border-border-dark">
            <Text className="text-xs text-muted dark:text-muted-dark leading-5">
              {t(TRANSLATION_KEYS.QR.BUS_INSTRUCTIONS_BODY)}
            </Text>
          </View>
          <Pressable
            onPress={() => goBack(router)}
            className="flex-row items-center justify-center px-6 py-3 rounded-lg bg-primary dark:bg-primary-dark active:opacity-80"
          >
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.QR.DONE)}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="items-center justify-center py-12">
            <Text className="mt-4 text-lg font-semibold text-center text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.QR.FAILED)}
            </Text>
            <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
              {error || t(TRANSLATION_KEYS.QR.UNKNOWN_ERROR)}
            </Text>
          </View>
          <Pressable onPress={() => goBack(router)} className="items-center px-6 py-3 mt-8 rounded-lg bg-primary dark:bg-primary-dark">
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.QR.GO_BACK)}</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
