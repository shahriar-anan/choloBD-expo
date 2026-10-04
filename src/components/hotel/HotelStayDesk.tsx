import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { RootState } from '../../store/store';
import { getMyHotel } from '../../services/api/users';
import {
  getHotelStaff,
  HotelStaffMember,
  staffDisplayName,
  updateHotelDesk,
} from '../../services/api/hotelDesk';

interface HotelStayDeskProps {
  booking: any;
  onUpdated: (booking: any) => void;
}

export function HotelStayDesk({ booking, onUpdated }: HotelStayDeskProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const isAdmin = role === 'SERVICE_ADMIN';
  const isStaff = role === 'SERVICE_ADMIN' || role === 'EMPLOYEE';
  const [visible, setVisible] = useState(false);
  const [staff, setStaff] = useState<HotelStaffMember[]>([]);
  const [assigneeId, setAssigneeId] = useState<string | null>(booking?.assignedEmployeeId ?? null);
  const [note, setNote] = useState(booking?.staffNote || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAssigneeId(booking?.assignedEmployeeId ?? null);
    setNote(booking?.staffNote || '');
  }, [booking?.assignedEmployeeId, booking?.id, booking?.staffNote]);

  useEffect(() => {
    if (!isStaff || !booking?.hotelId) {
      setVisible(false);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const hotels = await getMyHotel();
        const mine = hotels.some((hotel) => hotel.id === booking.hotelId);
        if (!active) return;
        setVisible(mine);
        if (mine && isAdmin) {
          const people = await getHotelStaff(booking.hotelId);
          if (active) {
            setStaff(people.filter((person) => person.userStatus === 'ACTIVE' || person.id === booking.assignedEmployeeId));
          }
        }
      } catch {
        if (active) setVisible(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [booking?.assignedEmployeeId, booking?.hotelId, isAdmin, isStaff]);

  if (!visible) return null;

  const save = async () => {
    const payload: { assignedEmployeeId?: string | null; staffNote?: string | null } = {};
    const nextNote = note.trim();
    if (nextNote !== (booking.staffNote || '')) {
      payload.staffNote = nextNote || null;
    }
    if (isAdmin && assigneeId !== (booking.assignedEmployeeId ?? null)) {
      payload.assignedEmployeeId = assigneeId;
    }
    if (payload.assignedEmployeeId === undefined && payload.staffNote === undefined) {
      return;
    }
    setSaving(true);
    try {
      const updated = await updateHotelDesk(booking.id, payload);
      onUpdated(updated);
      Alert.alert(t(TRANSLATION_KEYS.HOTEL_DESK.STAFF_NOTE), t(TRANSLATION_KEYS.HOTEL_DESK.DESK_SAVED));
    } catch (error: any) {
      Alert.alert(
        t(TRANSLATION_KEYS.HOTEL_DESK.STAFF_NOTE),
        error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.LOAD_FAILED)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="p-4 mx-4 mt-4 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
      <Text className="mb-2 font-semibold text-text dark:text-text-dark">
        {t(TRANSLATION_KEYS.HOTEL_DESK.HANDLING)}
      </Text>
      {isAdmin ? (
        <View className="flex-row flex-wrap gap-2 mb-3">
          <Pressable
            onPress={() => setAssigneeId(null)}
            className={`px-3 py-2 rounded-full border ${assigneeId ? 'border-border dark:border-border-dark' : 'bg-primary border-primary'}`}
          >
            <Text className={`text-xs font-semibold ${assigneeId ? 'text-text dark:text-text-dark' : 'text-white'}`}>
              {t(TRANSLATION_KEYS.HOTEL_DESK.UNASSIGNED)}
            </Text>
          </Pressable>
          {staff.map((person) => {
            const selected = assigneeId === person.id;
            return (
              <Pressable
                key={person.id}
                onPress={() => setAssigneeId(person.id)}
                className={`px-3 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'}`}
              >
                <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                  {staffDisplayName(person)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text className="mb-3 text-sm text-text dark:text-text-dark">
          {booking.assignedEmployee ? staffDisplayName(booking.assignedEmployee) : t(TRANSLATION_KEYS.HOTEL_DESK.UNASSIGNED)}
        </Text>
      )}
      <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
        {t(TRANSLATION_KEYS.HOTEL_DESK.STAFF_NOTE)}
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder={t(TRANSLATION_KEYS.HOTEL_DESK.NOTE)}
        placeholderTextColor={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
        className="px-3 py-3 text-text dark:text-text-dark border rounded-xl border-border dark:border-border-dark"
      />
      <Pressable onPress={() => { void save(); }} disabled={saving} className="items-center py-3 mt-3 rounded-xl bg-primary">
        <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.HOTEL_DESK.SAVE_DESK)}</Text>
      </Pressable>
    </View>
  );
}
