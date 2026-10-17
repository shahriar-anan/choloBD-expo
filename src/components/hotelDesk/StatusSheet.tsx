import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HotelRoomDeskStatus } from '../../services/api/hotels';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';

const STATUSES: HotelRoomDeskStatus[] = ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'];

const STATUS_KEYS: Record<HotelRoomDeskStatus, string> = {
  AVAILABLE: TRANSLATION_KEYS.HOTEL_DESK.READY_TO_SELL,
  MAINTENANCE: TRANSLATION_KEYS.HOTEL_DESK.NEEDS_CLEANING,
  OUT_OF_SERVICE: TRANSLATION_KEYS.HOTEL_DESK.OUT_OF_SERVICE,
};

export function StatusSheet({
  visible,
  current,
  saving,
  showAssign,
  onClose,
  onSelect,
  onAssign,
}: {
  visible: boolean;
  current?: string | null;
  saving?: boolean;
  showAssign?: boolean;
  onClose: () => void;
  onSelect: (status: HotelRoomDeskStatus) => void;
  onAssign?: () => void;
}) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="justify-end flex-1">
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={onClose} />
        <View className="px-4 pt-4 pb-8 bg-white rounded-t-3xl dark:bg-surface-dark">
          <Text className="mb-3 text-[17px] font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_STATUS_SHEET)}</Text>
          {saving ? <ActivityIndicator color={primary} /> : null}
          {STATUSES.map((status) => {
            const selected = current === status;
            return (
              <TouchableOpacity
                key={status}
                disabled={saving || selected}
                onPress={() => onSelect(status)}
                className="justify-center h-12 px-1 border-b border-border dark:border-border-dark"
              >
                <Text className={`text-base ${selected ? 'font-semibold text-primary dark:text-primary-dark' : 'text-text dark:text-text-dark'}`}>
                  {t(STATUS_KEYS[status])}
                </Text>
              </TouchableOpacity>
            );
          })}
          {showAssign && onAssign ? (
            <TouchableOpacity onPress={onAssign} className="justify-center h-12">
              <Text className="text-base font-semibold text-primary dark:text-primary-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.ASSIGN_CLEANING)}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function statusLabelKey(status?: string | null): string {
  if (status && status in STATUS_KEYS) return STATUS_KEYS[status as HotelRoomDeskStatus];
  return TRANSLATION_KEYS.QR.NOT_AVAILABLE;
}
