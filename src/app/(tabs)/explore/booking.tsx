import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View, type ScrollView } from 'react-native';
import { KeyboardAwareScroll } from '../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import RoomTypeSelectorUI from '@/components/ui/roomTypeSelectorUI';
import { guestContactFieldState, guestContactIsComplete, HotelBookingForm } from '../../../components/forms/hotelBookingForm';
import { GradientAppBar } from '../../../components/hotelSearch/HotelFlowChrome';
import { useExplore } from './_provider';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { displayRoomName, formatMoney, nightsBetween, shortRangeLabel } from '../../../utilities/hotelSearch';
import { RoomType } from '../../../types/hotels';
import { goBack } from '../../../utilities/navigation';

export default function ExploreBooking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const {
    hotelDetail,
    selectedRoomsMap,
    changeRoomQty,
    checkInDate,
    checkOutDate,
    guestName,
    guestEmail,
    guestPhoneNumber,
    specialRequests,
    setGuestName,
    setGuestEmail,
    setGuestPhoneNumber,
    setSpecialRequests,
    submitBooking,
    submitting,
  } = useExplore();
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [showGuestErrors, setShowGuestErrors] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  useEffect(() => {
    if (!roomsOpen) {
      return;
    }
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [roomsOpen]);

  if (!hotelDetail) return null;

  const nights = checkInDate && checkOutDate ? Math.max(0, nightsBetween(checkInDate, checkOutDate)) : 0;
  const roomTypes = (hotelDetail.roomTypes || []) as RoomType[];
  const chosen = roomTypes
    .map((room) => ({ room, qty: selectedRoomsMap[room.id] || 0 }))
    .filter((row) => row.qty > 0);
  const total = chosen.reduce((sum, row) => sum + row.qty * (row.room.pricePerNight ?? 0) * nights, 0);
  const guestReady = guestContactIsComplete(guestName, guestEmail, guestPhoneNumber);
  const guestState = guestContactFieldState(guestName, guestEmail, guestPhoneNumber);
  const guestFieldErrors = showGuestErrors
    ? {
        guestName: guestState.nameMissing ? t(TRANSLATION_KEYS.BOOKING.GUEST_NAME_REQUIRED) : undefined,
        guestEmail: guestState.emailMissing
          ? t(TRANSLATION_KEYS.BOOKING.EMAIL_REQUIRED)
          : guestState.emailInvalid
            ? t(TRANSLATION_KEYS.BOOKING.EMAIL_INVALID)
            : undefined,
        guestPhoneNumber: guestState.phoneMissing
          ? t(TRANSLATION_KEYS.BOOKING.PHONE_REQUIRED)
          : guestState.phoneInvalid
            ? t(TRANSLATION_KEYS.BOOKING.PHONE_INVALID)
            : undefined,
      }
    : undefined;

  const handleCreateBooking = () => {
    if (!guestReady) {
      setShowGuestErrors(true);
      return;
    }
    submitBooking();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <GradientAppBar title={t(TRANSLATION_KEYS.BOOKING.COMPLETE_BOOKING)} subtitle={hotelDetail.name} onBack={() => goBack(router)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <KeyboardAwareScroll avoiding={false} ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-6">
          <View className="p-4 mb-6 bg-white rounded-3xl dark:bg-surface-dark">
            <Text className="text-xs font-semibold tracking-wide uppercase text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.BOOKING.YOUR_STAY)}
            </Text>
            <Text className="mt-2 text-base font-bold text-text dark:text-text-dark">
              {checkInDate && checkOutDate ? shortRangeLabel(checkInDate, checkOutDate) : t(TRANSLATION_KEYS.BOOKING.NOT_SET)}
            </Text>
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.BOOKING.NIGHTS)}: {nights}
            </Text>
            <View className="h-px my-3 bg-border dark:bg-border-dark" />
            {chosen.length === 0 ? (
              <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_SEARCH.NO_ROOMS)}</Text>
            ) : chosen.map(({ room, qty }) => (
              <View key={room.id} className="flex-row items-center justify-between py-1">
                <Text className="flex-1 text-sm font-semibold text-text dark:text-text-dark">
                  {displayRoomName(room.roomType)} × {qty}
                </Text>
                <Text className="text-sm text-muted dark:text-muted-dark">
                  {formatMoney(room.pricePerNight ?? 0)} {t(TRANSLATION_KEYS.BOOKING.PER_NIGHT)}
                </Text>
              </View>
            ))}
          </View>

          <HotelBookingForm
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            guestName={guestName}
            setGuestName={setGuestName}
            guestEmail={guestEmail}
            setGuestEmail={setGuestEmail}
            guestPhoneNumber={guestPhoneNumber}
            setGuestPhoneNumber={setGuestPhoneNumber}
            specialRequests={specialRequests}
            setSpecialRequests={setSpecialRequests}
            submitting={submitting}
            onSubmit={submitBooking}
            hideSchedule
            showSubmit={false}
            fieldErrors={guestFieldErrors}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => setRoomsOpen((open) => !open)}
            className="flex-row items-center justify-between px-4 py-4 mt-6 bg-white rounded-3xl dark:bg-surface-dark"
          >
            <Text className="font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.BOOKING.ADD_OR_CHANGE_ROOMS)}</Text>
            <Ionicons name={roomsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={muted} />
          </Pressable>
          {roomsOpen ? (
            <RoomTypeSelectorUI roomTypes={roomTypes} selectedRoomsMap={selectedRoomsMap} onChange={changeRoomQty} />
          ) : null}
        </View>
      </KeyboardAwareScroll>

      <View className="flex-row items-center px-4 pt-2 border-t border-border dark:border-border-dark bg-surface dark:bg-surface-dark" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
        <View className="flex-1 mr-3">
          <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.BOOKING.TOTAL_PRICE)}</Text>
          <Text className="text-lg font-bold text-text dark:text-text-dark" numberOfLines={1}>{formatMoney(total)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={handleCreateBooking}
          disabled={submitting}
          className="items-center justify-center px-5 rounded-full"
          style={{ backgroundColor: submitting || !guestReady ? muted : primary, minHeight: 44 }}
        >
          <Text className="text-base font-bold text-white">
            {submitting ? t(TRANSLATION_KEYS.BOOKING.CREATING_BOOKING) : t(TRANSLATION_KEYS.BOOKING.CREATE_BOOKING)}
          </Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
