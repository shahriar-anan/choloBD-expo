import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DeskCard, DeskScreen, MenuRow } from '../../../../../../components/hotelDesk/chrome';
import { useHotelProperty } from '../../../../../../components/hotelDesk/HotelPropertyContext';
import { TRANSLATION_KEYS } from '../../../../../../constants/translationKeys';
import { priceAmount } from '../../../../../../components/hotelDesk/draft';
import { displayRoomName, formatMoney, shiftSpoken } from '../../../../../../utilities/hotelSearch';

const SOLD = [
  ['morningShiftPrice', 'MORNING'],
  ['afternoonShiftPrice', 'AFTERNOON'],
  ['nightShiftPrice', 'NIGHT'],
] as const;

export default function RoomRatesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { hotel, hotelId, loading, isHotelAdmin } = useHotelProperty();
  const types = hotel?.roomTypes ?? [];

  const open = (id: string) => {
    router.push(`/(tabs)/dashboard/service-admin/hotel-info/rates/${id}?hotelId=${hotelId}` as any);
  };

  return (
    <DeskScreen title={t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_RATES)}>
      {hotel?.allowShiftBooking ? null : (
        <Text className="mb-3 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.SHIFT_BOOKING_HOTEL_OFF_HINT)}</Text>
      )}
      <DeskCard>
        {loading && types.length === 0 ? (
          <Text className="px-4 py-4 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.LOADING_HOTEL_DETAILS)}</Text>
        ) : types.length === 0 ? (
          <Text className="px-4 py-4 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.NO_ROOM_TYPES)}</Text>
        ) : types.map((roomType: any, index: number) => {
          const names = roomType.allowShiftBooking
            ? SOLD.filter(([field]) => priceAmount(roomType[field]) != null)
              .map(([, shift]) => t(shiftSpoken(shift).name))
              .join(', ')
            : '';
          const sold = names || t(TRANSLATION_KEYS.HOTEL_DESK.SHIFTS_OFF);
          const nightly = priceAmount(roomType.pricePerNight) ?? 0;
          return (
            <MenuRow
              key={roomType.id}
              label={displayRoomName(roomType.roomType)}
              hint={`${t(TRANSLATION_KEYS.HOTEL_SEARCH.SLEEPS, { count: roomType.maxGuests >= 1 ? roomType.maxGuests : 1 })} · ${formatMoney(nightly)} · ${sold}`}
              last={index === types.length - 1}
              onPress={() => open(roomType.id)}
            />
          );
        })}
      </DeskCard>
      {isHotelAdmin ? (
        <TouchableOpacity onPress={() => open('new')} className="flex-row items-center justify-center h-12 rounded-xl bg-primary">
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="ml-1 text-base font-semibold text-white">{t(TRANSLATION_KEYS.HOTEL_DESK.ADD_ROOM_TYPE)}</Text>
        </TouchableOpacity>
      ) : null}
    </DeskScreen>
  );
}
