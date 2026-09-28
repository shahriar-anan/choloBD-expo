import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { displayRoomName, formatMoney } from '../../utilities/hotelSearch';

interface RoomType {
  id: string;
  name?: string;
  roomType?: string;
  pricePerNight?: number;
  availableCount?: number;
  totalCount?: number;
  singleBedCount?: number;
  doubleBedCount?: number;
  images?: Array<{ url: string }>;
}

interface RoomTypeSelectorUIProps {
  roomTypes: RoomType[];
  selectedRoomsMap: Record<string, number>;
  onChange: (roomTypeId: string, delta: number) => void;
}

export function RoomTypeSelectorUI({ roomTypes, selectedRoomsMap, onChange }: RoomTypeSelectorUIProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const onPrimaryColor = isDark ? theme.colors['onPrimary-dark'] : theme.colors['onPrimary'];
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  return (
    <View className="mt-3">
      {roomTypes.map((roomType) => {
        const label = displayRoomName(roomType.name || roomType.roomType);
        const price = roomType.pricePerNight ?? 0;
        const available = roomType.availableCount ?? roomType.totalCount ?? undefined;
        const selected = selectedRoomsMap[roomType.id] || 0;
        const primaryImage = roomType.images?.[0]?.url;
        const plusDisabled = available !== undefined && selected >= available;

        return (
          <View key={roomType.id} className="flex-row items-center p-3 mt-3 bg-white border rounded-2xl dark:bg-surface-dark border-border dark:border-border-dark">
            {primaryImage ? (
              <Image source={{ uri: primaryImage }} className="w-16 h-16 mr-3 rounded-xl" />
            ) : null}
            <View className="flex-1">
              <Text className="font-semibold text-text dark:text-text-dark">{label}</Text>
              <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                {formatMoney(price)} {t(TRANSLATION_KEYS.BOOKING.PER_NIGHT)}
              </Text>
              {available !== undefined ? (
                <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{available} {t(TRANSLATION_KEYS.BOOKING.AVAILABLE)}</Text>
              ) : null}
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => onChange(roomType.id, -1)}
                disabled={selected <= 0}
                className="items-center justify-center w-9 h-9 border rounded-full"
                style={{ borderColor: selected <= 0 ? mutedColor : primaryColor, opacity: selected <= 0 ? 0.4 : 1 }}
              >
                <Ionicons name="remove" size={16} color={selected <= 0 ? mutedColor : primaryColor} />
              </TouchableOpacity>
              <Text className="w-8 font-bold text-center text-text dark:text-text-dark">{selected}</Text>
              <TouchableOpacity
                onPress={() => onChange(roomType.id, 1)}
                disabled={plusDisabled}
                className="items-center justify-center w-9 h-9 rounded-full"
                style={{ backgroundColor: plusDisabled ? mutedColor : primaryColor }}
              >
                <Ionicons name="add" size={16} color={onPrimaryColor} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default RoomTypeSelectorUI;
