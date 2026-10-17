import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { appAlert } from '../../../../../components/ui/appAlert';
import { useTranslation } from 'react-i18next';
import { DeskCard, DeskScreen, FieldLabel, PrimaryButton, useLeaveGuard } from '../../../../../components/hotelDesk/chrome';
import { clockValue } from '../../../../../components/hotelDesk/draft';
import { useHotelProperty } from '../../../../../components/hotelDesk/HotelPropertyContext';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { useTheme } from '../../../../../hooks/useTheme';
import theme from '../../../../../constants/theme';
import { appDateLocale, formatDeskDate } from '../../../../../utilities/hotelDesk';

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function StayTimesScreen() {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const { hotel, isHotelAdmin, savingProfile, savingBookingMode, saveProfile, saveBookingMode } = useHotelProperty();
  const saved = useMemo(() => ({
    checkInTime: clockValue(hotel?.checkInTime),
    checkOutTime: clockValue(hotel?.checkOutTime),
  }), [hotel?.checkInTime, hotel?.checkOutTime]);
  const [draft, setDraft] = useState(saved);
  const [switchEpoch, setSwitchEpoch] = useState(0);
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hotel || hydrated.current) return;
    hydrated.current = true;
    setDraft({ checkInTime: clockValue(hotel.checkInTime), checkOutTime: clockValue(hotel.checkOutTime) });
  }, [hotel]);
  const dirty = draft.checkInTime !== saved.checkInTime || draft.checkOutTime !== saved.checkOutTime;
  useLeaveGuard(isHotelAdmin && dirty);

  const save = async () => {
    if (!CLOCK.test(draft.checkInTime.trim()) || !CLOCK.test(draft.checkOutTime.trim())) {
      appAlert(t(TRANSLATION_KEYS.HOTEL_DESK.STAY_TIMES), t(TRANSLATION_KEYS.HOTEL_DESK.TIME_HINT));
      return;
    }
    try {
      const checkInTime = draft.checkInTime.trim();
      const checkOutTime = draft.checkOutTime.trim();
      await saveProfile({ checkInTime, checkOutTime });
      setDraft({ checkInTime, checkOutTime });
      appAlert(t(TRANSLATION_KEYS.HOTEL_DESK.PROFILE_SAVED_TITLE), t(TRANSLATION_KEYS.HOTEL_DESK.PROFILE_SAVED), undefined, 'success');
    } catch (error: any) {
      appAlert(
        t(TRANSLATION_KEYS.HOTEL_DESK.PROFILE_SAVED_TITLE),
        error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_SAVE_PROFILE),
       undefined, 'error');
    }
  };

  const askMode = (value: boolean) => {
    setSwitchEpoch((current) => current + 1);
    appAlert(
      t(TRANSLATION_KEYS.HOTEL_DESK.ALLOW_SHIFT_BOOKINGS),
      t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_MODE_LOCK_CONFIRM),
      [
        { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
        {
          text: t(TRANSLATION_KEYS.COMMON.CONFIRM),
          onPress: () => {
            void saveBookingMode(value).catch((error: any) => {
              setSwitchEpoch((current) => current + 1);
              appAlert(
                t(TRANSLATION_KEYS.HOTEL_DESK.ALLOW_SHIFT_BOOKINGS),
                error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_UPDATE_SHIFT_MODE),
               undefined, 'error');
            });
          },
        },
      ],
    );
  };

  const inputClass = 'flex-1 h-12 px-3 text-base border rounded-xl border-border dark:border-border-dark text-text dark:text-text-dark';

  return (
    <DeskScreen
      title={t(TRANSLATION_KEYS.HOTEL_DESK.STAY_TIMES)}
      footer={isHotelAdmin ? (
        <PrimaryButton
          label={savingProfile ? t(TRANSLATION_KEYS.HOTEL_DESK.SAVING) : t(TRANSLATION_KEYS.COMMON.SAVE)}
          onPress={() => { void save(); }}
          disabled={savingProfile || !dirty}
        />
      ) : undefined}
    >
      <Text className="mb-3 text-[13px] text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.TIME_HINT)}</Text>
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <FieldLabel>{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_IN)}</FieldLabel>
          <TextInput editable={isHotelAdmin} value={draft.checkInTime} onChangeText={(value) => setDraft((current) => ({ ...current, checkInTime: value }))} placeholder="14:00" placeholderTextColor={muted} className={`${inputClass} bg-white dark:bg-surface-dark`} />
        </View>
        <View className="flex-1">
          <FieldLabel>{t(TRANSLATION_KEYS.HOTEL_SEARCH.CHECK_OUT)}</FieldLabel>
          <TextInput editable={isHotelAdmin} value={draft.checkOutTime} onChangeText={(value) => setDraft((current) => ({ ...current, checkOutTime: value }))} placeholder="12:00" placeholderTextColor={muted} className={`${inputClass} bg-white dark:bg-surface-dark`} />
        </View>
      </View>
      <DeskCard>
        <View className="flex-row items-center px-4 py-4">
          <View className="flex-1 mr-3">
            <Text className="text-base font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.ALLOW_SHIFT_BOOKINGS)}</Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {hotel?.allowShiftBooking ? t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_ON) : t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_OFF)}
            </Text>
          </View>
          {isHotelAdmin ? (
            <Switch
              key={`${Boolean(hotel?.allowShiftBooking)}-${switchEpoch}`}
              value={Boolean(hotel?.allowShiftBooking)}
              disabled={savingBookingMode}
              onValueChange={askMode}
              trackColor={{ true: primary }}
            />
          ) : null}
        </View>
        <View className="px-4 pb-4">
          <Text className="text-sm text-muted dark:text-muted-dark">
            {hotel?.allowShiftBooking
              ? t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_ON_HINT)
              : t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_HOTEL_OFF_HINT)}
          </Text>
          {hotel?.lastBookingModeUpdateDate ? (
            <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.HOTEL_DESK.LAST_SHIFT_MODE_CHANGE, {
                date: formatDeskDate(hotel.lastBookingModeUpdateDate, appDateLocale(i18n.language)),
              })}
            </Text>
          ) : null}
          {isHotelAdmin ? (
            <Text className="mt-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_MODE_LOCK_CONFIRM)}</Text>
          ) : null}
        </View>
      </DeskCard>
    </DeskScreen>
  );
}
