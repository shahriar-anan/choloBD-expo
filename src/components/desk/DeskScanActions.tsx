import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface DeskScanActionsProps {
  showCheckIn: boolean;
  checkInBusy: boolean;
  onCheckIn: () => void;
  onScanAnother: () => void;
  extra?: React.ReactNode;
}

export function DeskScanActions({
  showCheckIn,
  checkInBusy,
  onCheckIn,
  onScanAnother,
  extra,
}: DeskScanActionsProps) {
  const { t } = useTranslation();

  return (
    <View className="px-4 pt-2 pb-4 border-t border-border dark:border-border-dark">
      {extra}
      {showCheckIn ? (
        <Pressable
          onPress={onCheckIn}
          disabled={checkInBusy}
          className="items-center px-6 py-3 mb-2 rounded-xl bg-primary dark:bg-primary-dark active:opacity-80"
        >
          {checkInBusy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.QR.CHECK_IN_GUEST)}</Text>
          )}
        </Pressable>
      ) : null}
      <Pressable
        onPress={onScanAnother}
        className={
          showCheckIn
            ? 'items-center px-6 py-3 border rounded-xl border-primary dark:border-primary-dark'
            : 'items-center px-6 py-3 rounded-xl bg-primary dark:bg-primary-dark'
        }
      >
        <Text
          className={
            showCheckIn
              ? 'font-semibold text-primary dark:text-primary-dark'
              : 'font-semibold text-white'
          }
        >
          {t(TRANSLATION_KEYS.QR.SCAN_ANOTHER)}
        </Text>
      </Pressable>
    </View>
  );
}
