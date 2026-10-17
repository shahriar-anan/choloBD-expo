import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DeskCard, DeskScreen, MenuRow } from '../../../../../../components/hotelDesk/chrome';
import { useHotelProperty } from '../../../../../../components/hotelDesk/HotelPropertyContext';
import { StatusSheet, statusLabelKey } from '../../../../../../components/hotelDesk/StatusSheet';
import { HotelRoomDeskStatus } from '../../../../../../services/api/hotels';
import { TRANSLATION_KEYS } from '../../../../../../constants/translationKeys';
import { displayRoomName } from '../../../../../../utilities/hotelSearch';

export default function RoomsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { hotelId, rooms, loading, isHotelAdmin, savingRoomId, setRoomStatus } = useHotelProperty();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rooms.find((room) => room.id === selectedId) ?? null;

  const changeStatus = async (status: HotelRoomDeskStatus) => {
    if (!selected) return;
    try {
      await setRoomStatus(selected.id, status);
      setSelectedId(null);
    } catch (error: any) {
      Alert.alert(
        t(TRANSLATION_KEYS.HOTEL_DESK.ROOM_STATUS_TITLE),
        error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_UPDATE_ROOM),
      );
    }
  };

  return (
    <DeskScreen title={t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOMS)}>
      <DeskCard>
        {loading && rooms.length === 0 ? (
          <Text className="px-4 py-4 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.SERVICE_ADMIN.LOADING_HOTEL_DETAILS)}</Text>
        ) : rooms.length === 0 ? (
          <Text className="px-4 py-4 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.NO_PHYSICAL_ROOMS)}</Text>
        ) : rooms.map((room, index) => {
          const status = String(room.roomStatus || '').toUpperCase();
          return (
          <MenuRow
            key={room.id}
            label={room.roomNumber
              ? t(TRANSLATION_KEYS.QR.ROOM_NUMBER, { number: room.roomNumber })
              : t(TRANSLATION_KEYS.QR.ROOM_FALLBACK)}
            hint={displayRoomName(room.hotelRoomType?.roomType ?? room.roomType) || t(TRANSLATION_KEYS.HOTEL_DESK.UNKNOWN_TYPE)}
            value={t(statusLabelKey(status))}
            tone={status === 'AVAILABLE' ? 'success' : status === 'MAINTENANCE' ? 'warning' : 'muted'}
            last={index === rooms.length - 1}
            onPress={() => setSelectedId(room.id)}
          />
          );
        })}
      </DeskCard>
      <StatusSheet
        visible={Boolean(selected)}
        current={selected ? String(selected.roomStatus || '').toUpperCase() : null}
        saving={savingRoomId === selected?.id}
        showAssign={isHotelAdmin}
        onClose={() => setSelectedId(null)}
        onSelect={(status) => { void changeStatus(status); }}
        onAssign={selected ? () => {
          const roomId = selected.id;
          setSelectedId(null);
          router.push(`/(tabs)/dashboard/service-admin/tasks?roomId=${roomId}&hotelId=${hotelId}` as any);
        } : undefined}
      />
    </DeskScreen>
  );
}
