import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QRCodeDisplay } from '../../../../components/ui/QRCodeDisplay';
import { useQRGeneration } from '../../../../hooks/useQRGeneration';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { goBack } from '../../../../utilities/navigation';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';

export default function BookingQRGeneratePage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const bookingId = params.bookingId as string | undefined;

  const { generateQRToken, loading, error } = useQRGeneration();
  const [qrToken, setQRToken] = useState<string | null>(null);
  useEffect(() => {
    if (!bookingId) {
      return;
    }
    let active = true;
    void (async () => {
      try {
        const token = await generateQRToken(bookingId);
        if (!active || !token) return;
        setQRToken(token);
      } catch {
        if (!active) return;
      }
    })();
    return () => {
      active = false;
    };
  }, [bookingId, generateQRToken]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b dark:bg-surface-dark border-border dark:border-border-dark">
        <Text className="flex-1 mr-3 text-2xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.QR.CHECK_IN_TITLE)}</Text>
        <Pressable onPress={() => goBack(router)} style={{ padding: 6 }}>
          <Ionicons name="close" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
        </Pressable>
      </View>

      {loading || (Boolean(bookingId) && !error && !qrToken) ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text className="mt-4 text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.QR.GENERATING)}</Text>
        </View>
      ) : /already checked in/i.test(error || '') ? (
        <View className="items-center justify-center flex-1 px-8">
          <Ionicons name="checkmark-circle" size={56} color={isDark ? theme.colors['primary-dark'] : theme.colors.primary} />
          <Text className="mt-4 text-xl font-bold text-center text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.QR.CHECKED_IN)}
          </Text>
          <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.QR.SHOW_STAFF)}
          </Text>
          <Pressable onPress={() => goBack(router)} className="items-center px-6 py-3 mt-8 rounded-lg bg-primary dark:bg-primary-dark">
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.QR.DONE)}</Text>
          </Pressable>
        </View>
      ) : qrToken ? (
        <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 24, gap: 16 }}>
          <QRCodeDisplay qrToken={qrToken} />

          <View className="p-4 rounded-xl bg-surface-2 dark:bg-surface-2-dark border border-border dark:border-border-dark">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color={isDark ? theme.colors['primary-dark'] : theme.colors.primary} />
              <Text className="ml-2 font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.QR.READY)}</Text>
            </View>
            <Text className="text-xs text-muted dark:text-muted-dark leading-5">
              {t(TRANSLATION_KEYS.QR.READY_BODY)}
            </Text>
          </View>

          <View className="p-4 rounded-xl bg-surface-2 dark:bg-surface-2-dark border border-border dark:border-border-dark">
            <Text className="mb-2 font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.QR.INSTRUCTIONS)}</Text>
            <Text className="text-xs text-muted dark:text-muted-dark leading-5">
              {t(TRANSLATION_KEYS.QR.INSTRUCTIONS_BODY)}
            </Text>
          </View>

          <Pressable onPress={() => goBack(router)} className="flex-row items-center justify-center px-6 py-3 rounded-lg bg-primary dark:bg-primary-dark active:opacity-80">
            <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.QR.DONE)}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="items-center justify-center py-12">
            <Ionicons name="alert-circle" size={48} color={isDark ? theme.colors['error-dark'] : theme.colors.error} />
            <Text className="mt-4 text-lg font-semibold text-center text-text dark:text-text-dark">{t(TRANSLATION_KEYS.QR.FAILED)}</Text>
            <Text className="mt-2 text-sm text-center text-muted dark:text-muted-dark">{error || t(TRANSLATION_KEYS.QR.UNKNOWN_ERROR)}</Text>
          </View>

          <Pressable onPress={() => goBack(router)} className="items-center px-6 py-3 mt-8 rounded-lg bg-primary dark:bg-primary-dark">
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.QR.GO_BACK)}</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
