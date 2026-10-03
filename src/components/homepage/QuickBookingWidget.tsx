import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { DatePickerInput } from '../ui/DatePickerInput';

interface ActivityTypeOption {
  id: string;
  label: string;
  route: string;
}

const ACTIVITY_TYPES: ActivityTypeOption[] = [
  { id: 'hotels', label: 'Hotels', route: '/(tabs)/explore/hotel-search' },
  { id: 'tours', label: 'Tours', route: '/(tabs)/trip-planner?tab=templates&fromHome=true' },
  { id: 'attractions', label: 'Attractions', route: '/(tabs)/explore/attractions?tab=places' },
];

export default function QuickBookingWidget() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [selectedActivityType, setSelectedActivityType] = useState<string>('hotels');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const onPrimaryColor = isDark ? theme.colors['onPrimary-dark'] : theme.colors['onPrimary'];
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  const currentActivityType = ACTIVITY_TYPES.find((t) => t.id === selectedActivityType);

  const handleBook = () => {
    if (!currentActivityType) {
      Alert.alert(t(TRANSLATION_KEYS.COMMON.ERROR), 'Please select an activity type');
      return;
    }

    // Navigate to the corresponding booking flow
    router.push(currentActivityType.route);
  };

  return (
    <View
      className="mx-4 mb-6 p-4 rounded-xl border"
      style={{
        backgroundColor: surfaceColor,
        borderColor: borderColor,
      }}
    >
      {/* Header */}
      <Text
        className="text-lg font-bold mb-4"
        style={{ color: textColor }}
      >
        {t(TRANSLATION_KEYS.HOME.BOOKING_WIDGET.TITLE)}
      </Text>

      {/* Activity Type Picker */}
      <View className="mb-4">
        <Text
          className="text-xs font-semibold mb-2 uppercase"
          style={{ color: mutedColor }}
        >
          {t(TRANSLATION_KEYS.HOME.BOOKING_WIDGET.ACTIVITY_TYPE)}
        </Text>
        <View className="flex-row gap-2">
          {ACTIVITY_TYPES.map((type) => {
            const isSelected = selectedActivityType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedActivityType(type.id)}
                activeOpacity={0.7}
                className="flex-1 py-2 px-3 rounded-lg border items-center"
                style={{
                  backgroundColor: isSelected ? primaryColor : 'transparent',
                  borderColor: isSelected ? primaryColor : borderColor,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: isSelected ? onPrimaryColor : textColor,
                  }}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Date Picker */}
      <View className="mb-4">
        <DatePickerInput
          label={t(TRANSLATION_KEYS.HOME.BOOKING_WIDGET.DATE)}
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder={new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        />
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        onPress={handleBook}
        activeOpacity={0.8}
        className="py-3 px-4 rounded-lg items-center justify-center flex-row gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        <Feather name="check-circle" size={18} color={onPrimaryColor} />
        <Text
          className="font-bold text-center"
          style={{ color: onPrimaryColor }}
        >
          {t(TRANSLATION_KEYS.HOME.BOOKING_WIDGET.BOOK_BTN)}
        </Text>
      </TouchableOpacity>

      {/* Footer Tagline */}
      <Text
        className="text-xs text-center mt-3 font-light leading-4"
        style={{ color: mutedColor }}
      >
        {t(TRANSLATION_KEYS.HOME.BOOKING_WIDGET.SEAMLESS)}
      </Text>
    </View>
  );
}
