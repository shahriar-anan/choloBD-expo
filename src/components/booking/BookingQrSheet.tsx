import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { QRCodeDisplay } from '../ui/QRCodeDisplay';
import { generateActivityQr } from '../../services/api/activityBookings';

interface BookingQrSheetProps {
  visible: boolean;
  mode: 'activity' | 'unsupported';
  bookingId?: string | null;
  onClose: () => void;
}

export function BookingQrSheet({ visible, mode, bookingId, onClose }: BookingQrSheetProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  useEffect(() => {
    if (!visible) {
      setQrToken(null);
      setExpiresAt(undefined);
      setError(null);
      setLoading(false);
      return;
    }
    if (mode !== 'activity' || !bookingId) {
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    generateActivityQr(bookingId)
      .then((result) => {
        if (!active) return;
        setQrToken(result.qrToken);
        setExpiresAt(result.expiresAt || undefined);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : t(TRANSLATION_KEYS.COMMON.ERROR));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, mode, bookingId, t]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="items-center justify-center flex-1 px-6 bg-black/50" onPress={onClose}>
        <Pressable
          onPress={() => undefined}
          className="w-full p-5 rounded-2xl"
          style={{ backgroundColor: surface, maxWidth: 420 }}
        >
          {mode === 'unsupported' ? (
            <>
              <Text className="text-lg font-bold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.BOOKING.QR_NOT_SUPPORTED_TITLE)}
              </Text>
              <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.BOOKING.QR_NOT_SUPPORTED_BODY)}
              </Text>
            </>
          ) : loading ? (
            <View className="items-center py-8">
              <ActivityIndicator color={primary} />
            </View>
          ) : qrToken ? (
            <QRCodeDisplay
              qrToken={qrToken}
              expiresAt={expiresAt}
              size={220}
              label={t(TRANSLATION_KEYS.BOOKING.QR_CODE)}
              hint={t(TRANSLATION_KEYS.DASHBOARD.ATTRACTION_BOOKINGS.QR_HINT)}
            />
          ) : (
            <Text className="text-sm text-error dark:text-error-dark">
              {error || t(TRANSLATION_KEYS.COMMON.ERROR)}
            </Text>
          )}
          <Pressable onPress={onClose} className="items-center py-3 mt-4">
            <Text className="font-semibold" style={{ color: primary }}>{t(TRANSLATION_KEYS.COMMON.CLOSE)}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
