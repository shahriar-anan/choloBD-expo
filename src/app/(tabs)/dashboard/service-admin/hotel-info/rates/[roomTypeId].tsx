import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DeskScreen, FieldLabel, PrimaryButton, useLeaveGuard } from '../../../../../../components/hotelDesk/chrome';
import {
  GUESTS_BY_TYPE,
  ROOM_TYPE_OPTIONS,
  SLOT_KEYS,
  SlotDraft,
  SlotKey,
  SlotOpen,
  guestIsInvalid,
  guestString,
  openFromSlots,
  parseSlot,
  slotIsInvalid,
  slotsFromRoomType,
} from '../../../../../../components/hotelDesk/draft';
import { useHotelProperty } from '../../../../../../components/hotelDesk/HotelPropertyContext';
import { TRANSLATION_KEYS } from '../../../../../../constants/translationKeys';
import { useTheme } from '../../../../../../hooks/useTheme';
import theme from '../../../../../../constants/theme';
import { displayRoomName } from '../../../../../../utilities/hotelSearch';

const SLOT_LABEL: Record<SlotKey, string> = {
  morning: TRANSLATION_KEYS.HOTEL_SEARCH.MORNING,
  afternoon: TRANSLATION_KEYS.HOTEL_SEARCH.AFTERNOON,
  night: TRANSLATION_KEYS.HOTEL_SEARCH.NIGHT,
};

interface RateDraft {
  roomType: string;
  price: string;
  guests: string;
  allowShift: boolean;
  slots: SlotDraft;
  open: SlotOpen;
}

function draftFor(roomType: any, isNew: boolean): RateDraft {
  if (isNew) {
    return {
      roomType: 'SINGLE',
      price: '',
      guests: '1',
      allowShift: false,
      slots: { morning: '', afternoon: '', night: '' },
      open: { morning: false, afternoon: false, night: false },
    };
  }
  const slots = slotsFromRoomType(roomType);
  return {
    roomType: roomType?.roomType || 'SINGLE',
    price: roomType?.pricePerNight != null ? String(roomType.pricePerNight) : '',
    guests: guestString(roomType?.maxGuests),
    allowShift: Boolean(roomType?.allowShiftBooking),
    slots,
    open: openFromSlots(slots),
  };
}

export default function RoomRateEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomTypeId?: string | string[] }>();
  const roomTypeId = Array.isArray(params.roomTypeId) ? params.roomTypeId[0] : params.roomTypeId;
  const isNew = roomTypeId === 'new';
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const { hotel, hotelId, loading, isHotelAdmin, savingType, saveRoomType, createType } = useHotelProperty();
  const roomType = (hotel?.roomTypes ?? []).find((item: any) => item.id === roomTypeId);
  const baseline = useMemo(() => draftFor(roomType, isNew), [roomType, isNew]);
  const [draft, setDraft] = useState<RateDraft>(baseline);
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    if (!isNew && !roomType) return;
    hydrated.current = true;
    setDraft(draftFor(roomType, isNew));
  }, [isNew, roomType]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const { allowLeave } = useLeaveGuard(isHotelAdmin && dirty);

  const setSlot = (key: SlotKey, value: string) => {
    setDraft((current) => ({ ...current, slots: { ...current.slots, [key]: value } }));
  };

  const save = async () => {
    const price = Number(draft.price.trim());
    if (!draft.price.trim() || !Number.isFinite(price) || price < 0) {
      Alert.alert(t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATE_TITLE), t(TRANSLATION_KEYS.HOTEL_DESK.PRICE_INVALID));
      return;
    }
    if (guestIsInvalid(draft.guests)) {
      Alert.alert(t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATE_TITLE), t(TRANSLATION_KEYS.HOTEL_DESK.MAX_GUESTS_INVALID));
      return;
    }
    const invalidSlot = SLOT_KEYS.some((key) => draft.open[key] && slotIsInvalid(draft.slots[key]));
    if (invalidSlot) {
      Alert.alert(t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATE_TITLE), t(TRANSLATION_KEYS.HOTEL_DESK.SLOT_PRICE_INVALID));
      return;
    }
    const guests = Number(draft.guests.trim());
    const slotPrices = {
      morningShiftPrice: draft.open.morning ? parseSlot(draft.slots.morning) : null,
      afternoonShiftPrice: draft.open.afternoon ? parseSlot(draft.slots.afternoon) : null,
      nightShiftPrice: draft.open.night ? parseSlot(draft.slots.night) : null,
    };
    try {
      if (isNew) {
        await createType({
          hotelId,
          roomType: draft.roomType,
          pricePerNight: price,
          totalCount: 1,
          maxGuests: guests,
          allowShiftBooking: draft.allowShift,
          ...slotPrices,
        });
      } else if (roomTypeId) {
        await saveRoomType(roomTypeId, {
          pricePerNight: price,
          maxGuests: guests,
          allowShiftBooking: draft.allowShift,
          ...slotPrices,
        });
      }
      allowLeave();
      Alert.alert(t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATE_SAVED_TITLE), t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATE_SAVED));
      router.back();
    } catch (error: any) {
      Alert.alert(
        t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATE_TITLE),
        error?.response?.data?.message || t(isNew
          ? TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_ADD_ROOM_TYPE
          : TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_UPDATE_RATE),
      );
    }
  };

  if (!isNew && !roomType) {
    return (
      <DeskScreen title={t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATES)}>
        <Text className="text-base text-muted dark:text-muted-dark">
          {loading ? t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.LOADING_HOTEL_DETAILS) : t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.NO_ROOM_TYPES)}
        </Text>
      </DeskScreen>
    );
  }

  const inputClass = 'h-12 px-3 text-base bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark text-text dark:text-text-dark';
  const moneyClass = 'flex-1 h-12 text-base text-text dark:text-text-dark';

  return (
    <DeskScreen
      title={isNew ? t(TRANSLATION_KEYS.HOTEL_DESK.ADD_ROOM_TYPE) : displayRoomName(draft.roomType)}
      footer={isHotelAdmin ? (
        <PrimaryButton
          label={savingType ? t(TRANSLATION_KEYS.HOTEL_DESK.SAVING) : t(TRANSLATION_KEYS.COMMON.SAVE)}
          onPress={() => { void save(); }}
          disabled={savingType}
        />
      ) : undefined}
    >
      {isNew && isHotelAdmin ? (
        <View className="flex-row flex-wrap gap-2 mb-4">
          {ROOM_TYPE_OPTIONS.map((option) => {
            const selected = draft.roomType === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => setDraft((current) => ({
                  ...current,
                  roomType: option,
                  guests: current.roomType === option ? current.guests : String(GUESTS_BY_TYPE[option] ?? 2),
                }))}
                className={`px-4 h-12 justify-center rounded-full ${selected ? 'bg-primary' : 'bg-white dark:bg-surface-dark'}`}
              >
                <Text className={selected ? 'font-semibold text-white' : 'text-text dark:text-text-dark'}>{displayRoomName(option)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
      <FieldLabel>{t(TRANSLATION_KEYS.HOTEL_DESK.GUESTS_PER_ROOM)}</FieldLabel>
      <TextInput
        editable={isHotelAdmin}
        value={draft.guests}
        onChangeText={(value) => setDraft((current) => ({ ...current, guests: value }))}
        keyboardType="number-pad"
        className={inputClass}
      />
      <Text className="mb-4 text-[13px] text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.MAX_GUESTS_INVALID)}</Text>
      <FieldLabel>{t(TRANSLATION_KEYS.HOTEL_SEARCH.PRICE_PER_NIGHT)}</FieldLabel>
      <View className="flex-row items-center h-12 px-3 mb-4 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
        <Text className="mr-2 text-base text-muted dark:text-muted-dark">৳</Text>
        <TextInput
          editable={isHotelAdmin}
          value={draft.price}
          onChangeText={(value) => setDraft((current) => ({ ...current, price: value }))}
          keyboardType="decimal-pad"
          placeholder={t(TRANSLATION_KEYS.HOTEL_DESK.PRICE_PLACEHOLDER)}
          placeholderTextColor={muted}
          className={moneyClass}
        />
      </View>
      <View className="flex-row items-center mb-4">
        <Text className="flex-1 mr-3 text-base text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.ALLOW_SHIFT_FOR_TYPE)}</Text>
        {isHotelAdmin ? (
          <Switch
            value={draft.allowShift}
            onValueChange={(value) => setDraft((current) => ({ ...current, allowShift: value }))}
            trackColor={{ true: primary }}
          />
        ) : (
          <Text className="text-sm text-muted dark:text-muted-dark">
            {draft.allowShift ? t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_ON) : t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_OFF)}
          </Text>
        )}
      </View>
      {draft.allowShift ? (
        <View>
          <Text className="mb-3 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.SLOT_PRICE_HINT)}</Text>
          {SLOT_KEYS.map((key) => (
            <View key={key} className="mb-3">
              <View className="flex-row items-center justify-between h-12">
                <Text className="text-base font-semibold text-text dark:text-text-dark">{t(SLOT_LABEL[key])}</Text>
                {isHotelAdmin && !draft.open[key] ? (
                  <TouchableOpacity
                    accessibilityLabel={t(TRANSLATION_KEYS.HOTEL_DESK.ADD_SHIFT)}
                    onPress={() => setDraft((current) => ({ ...current, open: { ...current.open, [key]: true } }))}
                    className="flex-row items-center h-10 px-3 rounded-full bg-primary"
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text className="ml-1 text-sm font-semibold text-white">{t(TRANSLATION_KEYS.HOTEL_DESK.ADD_SHIFT)}</Text>
                  </TouchableOpacity>
                ) : null}
                {isHotelAdmin && draft.open[key] ? (
                  <TouchableOpacity
                    accessibilityLabel={t(TRANSLATION_KEYS.HOTEL_DESK.REMOVE_SHIFT)}
                    onPress={() => setDraft((current) => ({
                      ...current,
                      open: { ...current.open, [key]: false },
                      slots: { ...current.slots, [key]: '' },
                    }))}
                    className="items-center justify-center w-10 h-10"
                  >
                    <Ionicons name="close-circle" size={22} color={muted} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {draft.open[key] ? (
                <View className="flex-row items-center h-12 px-3 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
                  <Text className="mr-2 text-base text-muted dark:text-muted-dark">৳</Text>
                  <TextInput
                    editable={isHotelAdmin}
                    value={draft.slots[key]}
                    onChangeText={(value) => setSlot(key, value)}
                    keyboardType="decimal-pad"
                    placeholder={t(TRANSLATION_KEYS.HOTEL_DESK.SLOT_PRICE_PLACEHOLDER)}
                    placeholderTextColor={muted}
                    className={moneyClass}
                  />
                </View>
              ) : null}
            </View>
          ))}
          {SLOT_KEYS.every((key) => !draft.open[key]) ? (
            <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.NO_SHIFT_PRICE_WARNING)}</Text>
          ) : null}
        </View>
      ) : null}
    </DeskScreen>
  );
}
