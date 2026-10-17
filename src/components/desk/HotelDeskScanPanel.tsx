import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { QRBookingDetailsDisplay } from '../ui/QRBookingDetailsDisplay';
import { DeskScanActions } from './DeskScanActions';
import { updateHotelStayStatus } from '../../services/api/bookings';
import { hotelQrCheckIn } from '../../services/api/qr';
import { canRecordStay } from '../../utilities/hotelDesk';
import type { QRBookingDetail } from '../../types/qr';

export interface HotelDeskResult {
  booking: QRBookingDetail;
  checkedInAt: string | null;
}

interface HotelDeskScanPanelProps {
  result: HotelDeskResult;
  onChange: (next: HotelDeskResult) => void;
  onScanAnother: () => void;
}

export function HotelDeskScanPanel({ result, onChange, onScanAnother }: HotelDeskScanPanelProps) {
  const { t } = useTranslation();
  const [stayBusy, setStayBusy] = useState(false);
  const [checkInBusy, setCheckInBusy] = useState(false);
  const booking = result.booking;

  const recordStay = (status: 'COMPLETED' | 'NO_SHOW') => {
    const label =
      status === 'COMPLETED'
        ? t(TRANSLATION_KEYS.HOTEL_DESK.CHECK_OUT)
        : t(TRANSLATION_KEYS.HOTEL_DESK.NO_SHOW);
    Alert.alert(label, t(TRANSLATION_KEYS.HOTEL_DESK.SCAN_DOES_NOT_CHANGE), [
      { text: t(TRANSLATION_KEYS.COMMON.BACK), style: 'cancel' },
      {
        text: label,
        onPress: () => {
          void (async () => {
            try {
              setStayBusy(true);
              const updated = await updateHotelStayStatus(booking.id, status);
              onChange({
                ...result,
                booking: { ...booking, ...updated, status },
              });
            } catch (stayError: unknown) {
              const err = stayError as { response?: { data?: { message?: string } } };
              Alert.alert(
                label,
                err?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_UPDATE_STAY)
              );
            } finally {
              setStayBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const handleCheckIn = () => {
    if (result.checkedInAt) return;
    void (async () => {
      try {
        setCheckInBusy(true);
        const { checkedInAt } = await hotelQrCheckIn(booking.id);
        onChange({
          checkedInAt,
          booking: { ...booking, checkedInAt },
        });
      } catch (checkInError: unknown) {
        const err = checkInError as { response?: { data?: { message?: string } }; message?: string };
        Alert.alert(
          t(TRANSLATION_KEYS.QR.CHECK_IN_GUEST),
          err?.response?.data?.message || err?.message || t(TRANSLATION_KEYS.QR.SCAN_FAILED_BODY)
        );
      } finally {
        setCheckInBusy(false);
      }
    })();
  };

  return (
    <View className="flex-1">
      <QRBookingDetailsDisplay booking={{ ...booking, checkedInAt: result.checkedInAt ?? booking.checkedInAt }} />
      <DeskScanActions
        showCheckIn={!result.checkedInAt}
        checkInBusy={checkInBusy}
        onCheckIn={handleCheckIn}
        onScanAnother={onScanAnother}
        extra={
          canRecordStay(booking) ? (
            <View className="flex-row gap-2 mb-2">
              <Pressable
                onPress={() => recordStay('COMPLETED')}
                disabled={stayBusy}
                className="flex-1 px-3 py-3 border rounded-xl border-border dark:border-border-dark"
              >
                <Text className="font-semibold text-center text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.HOTEL_DESK.CHECK_OUT)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => recordStay('NO_SHOW')}
                disabled={stayBusy}
                className="flex-1 px-3 py-3 border rounded-xl border-border dark:border-border-dark"
              >
                <Text className="font-semibold text-center text-text dark:text-text-dark">
                  {t(TRANSLATION_KEYS.HOTEL_DESK.NO_SHOW)}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}
