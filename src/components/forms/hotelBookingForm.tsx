import React from 'react';
import { View, Text, TextInput, Pressable, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function guestContactFieldState(guestName: string, guestEmail: string, guestPhoneNumber: string) {
  const email = guestEmail.trim();
  const phone = guestPhoneNumber.trim();
  return {
    nameMissing: guestName.trim().length === 0,
    emailMissing: email.length === 0,
    emailInvalid: email.length > 0 && !EMAIL_PATTERN.test(email),
    phoneMissing: phone.length === 0,
    phoneInvalid: phone.length > 0 && phone.replace(/\D/g, '').length < 10,
  };
}

export function guestContactIsComplete(guestName: string, guestEmail: string, guestPhoneNumber: string): boolean {
  const state = guestContactFieldState(guestName, guestEmail, guestPhoneNumber);
  return !state.nameMissing && !state.emailMissing && !state.emailInvalid && !state.phoneMissing && !state.phoneInvalid;
}

interface HotelBookingFormProps {
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  guestPhoneNumber: string;
  setGuestName: (text: string) => void;
  setGuestEmail: (text: string) => void;
  setGuestPhoneNumber: (text: string) => void;
  paymentMethod?: string;
  setPaymentMethod?: (text: string) => void;
  specialRequests?: string;
  setSpecialRequests?: (text: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  isEditing?: boolean;
  onCancel?: () => void;
  hideSchedule?: boolean;
  showSubmit?: boolean;
  fieldErrors?: {
    guestName?: string;
    guestEmail?: string;
    guestPhoneNumber?: string;
  };
}

export function HotelBookingForm({
  checkInDate,
  checkOutDate,
  guestName,
  guestEmail,
  guestPhoneNumber,
  setGuestName,
  setGuestEmail,
  setGuestPhoneNumber,
  paymentMethod,
  setPaymentMethod,
  specialRequests,
  setSpecialRequests,
  onSubmit,
  submitting,
  isEditing = false,
  onCancel,
  hideSchedule = false,
  showSubmit = true,
  fieldErrors,
}: HotelBookingFormProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  const prettyDate = (value: string) => {
    if (!value) {
      return t(TRANSLATION_KEYS.BOOKING.NOT_SET);
    }
    try {
      return format(parseISO(value), 'd MMM yyyy');
    } catch {
      return value;
    }
  };

  return (
    <View>
      <Text className="mb-3 text-lg font-bold text-text dark:text-text-dark">
        {isEditing ? t(TRANSLATION_KEYS.BOOKING.EDIT_BOOKING) : t(TRANSLATION_KEYS.BOOKING.YOUR_DETAILS)}
      </Text>

      {!hideSchedule ? (
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 p-3 bg-white rounded-2xl dark:bg-surface-dark">
            <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.BOOKING.CHECK_IN)}</Text>
            <Text className="mt-1 font-bold text-text dark:text-text-dark">{prettyDate(checkInDate)}</Text>
          </View>
          <View className="flex-1 p-3 bg-white rounded-2xl dark:bg-surface-dark">
            <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.BOOKING.CHECK_OUT)}</Text>
            <Text className="mt-1 font-bold text-text dark:text-text-dark">{prettyDate(checkOutDate)}</Text>
          </View>
        </View>
      ) : null}

      <View className="p-4 bg-white rounded-3xl dark:bg-surface-dark">
        {!isEditing ? (
          <>
            <GuestField
              label={t(TRANSLATION_KEYS.BOOKING.GUEST_NAME)}
              icon="person"
              iconColor={muted}
              value={guestName}
              onChangeText={setGuestName}
              placeholder={t(TRANSLATION_KEYS.BOOKING.GUEST_NAME_PLACEHOLDER)}
              placeholderTextColor={muted}
              autoCapitalize="words"
              textContentType="name"
              error={fieldErrors?.guestName}
            />
            <GuestField
              label={t(TRANSLATION_KEYS.BOOKING.EMAIL)}
              icon="mail"
              iconColor={muted}
              value={guestEmail}
              onChangeText={setGuestEmail}
              placeholder={t(TRANSLATION_KEYS.BOOKING.EMAIL_PLACEHOLDER)}
              placeholderTextColor={muted}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              error={fieldErrors?.guestEmail}
            />
            <GuestField
              label={t(TRANSLATION_KEYS.BOOKING.PHONE_NUMBER)}
              icon="call"
              iconColor={muted}
              value={guestPhoneNumber}
              onChangeText={setGuestPhoneNumber}
              placeholder={t(TRANSLATION_KEYS.BOOKING.PHONE_PLACEHOLDER)}
              placeholderTextColor={muted}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              error={fieldErrors?.guestPhoneNumber}
            />
          </>
        ) : null}

        {setPaymentMethod !== undefined && isEditing ? (
          <GuestField
            label={`${t(TRANSLATION_KEYS.BOOKING.PAYMENT_METHOD)} (${t(TRANSLATION_KEYS.BOOKING.OPTIONAL)})`}
            icon="card"
            iconColor={muted}
            value={paymentMethod}
            onChangeText={setPaymentMethod}
            placeholder={t(TRANSLATION_KEYS.BOOKING.PAYMENT_METHOD_PLACEHOLDER)}
            placeholderTextColor={muted}
          />
        ) : null}

        <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.BOOKING.SPECIAL_REQUESTS)} ({t(TRANSLATION_KEYS.BOOKING.OPTIONAL)})
        </Text>
        <View className="px-3 py-2 border rounded-2xl border-border dark:border-border-dark bg-background dark:bg-background-dark">
          <TextInput
            value={specialRequests}
            onChangeText={setSpecialRequests}
            placeholder={t(TRANSLATION_KEYS.BOOKING.SPECIAL_REQUESTS_PLACEHOLDER)}
            placeholderTextColor={muted}
            multiline
            textAlignVertical="top"
            className="min-h-[88px] text-base text-text dark:text-text-dark"
          />
        </View>
      </View>

      {showSubmit ? (
        <View className="mt-4">
          <Pressable
            accessibilityRole="button"
            onPress={onSubmit}
            disabled={submitting}
            className="items-center justify-center rounded-full"
            style={{ backgroundColor: submitting ? muted : primary, minHeight: 52 }}
          >
            <Text className="text-base font-bold text-white">
              {submitting
                ? (isEditing ? t(TRANSLATION_KEYS.BOOKING.SAVING_BOOKING) : t(TRANSLATION_KEYS.BOOKING.CREATING_BOOKING))
                : (isEditing ? t(TRANSLATION_KEYS.BOOKING.SAVE_CHANGES) : t(TRANSLATION_KEYS.BOOKING.CREATE_BOOKING))}
            </Text>
          </Pressable>
          {isEditing && onCancel ? (
            <Pressable accessibilityRole="button" onPress={onCancel} disabled={submitting} className="items-center justify-center mt-3" style={{ minHeight: 44 }}>
              <Text className="font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.BOOKING.CANCEL_EDIT)}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function GuestField({
  label,
  icon,
  iconColor,
  error,
  ...input
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  error?: string;
} & TextInputProps) {
  const errorColor = theme.colors.error;
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">{label}</Text>
      <View
        className={`flex-row items-center px-3 border rounded-2xl bg-background dark:bg-background-dark ${error ? '' : 'border-border dark:border-border-dark'}`}
        style={{ minHeight: 52, borderColor: error ? errorColor : undefined }}
      >
        <Ionicons name={icon} size={18} color={error ? errorColor : iconColor} />
        <TextInput className="flex-1 py-3 ml-3 text-base text-text dark:text-text-dark" {...input} />
      </View>
      {error ? <Text className="mt-1 text-xs" style={{ color: errorColor }}>{error}</Text> : null}
    </View>
  );
}
