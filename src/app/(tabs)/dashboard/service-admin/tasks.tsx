import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { KeyboardAwareScroll } from '../../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import theme from '../../../../constants/theme';
import { useTheme } from '../../../../hooks/useTheme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { RootState } from '../../../../store/store';
import { getHotelRooms, getMyHotel } from '../../../../services/api/users';
import {
  completeHotelTask,
  createHotelTask,
  getHotelStaff,
  getHotelTasks,
  HotelStaffMember,
  HotelTaskRow,
  staffDisplayName,
} from '../../../../services/api/hotelDesk';
import { goBack } from '../../../../utilities/navigation';

export default function CleaningTasksPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomId?: string }>();
  const presetRoomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const isAdmin = role === 'SERVICE_ADMIN';
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<HotelTaskRow[]>([]);
  const [staff, setStaff] = useState<HotelStaffMember[]>([]);
  const [rooms, setRooms] = useState<Array<{ id: string; roomNumber?: string }>>([]);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(presetRoomId ?? null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hotels = await getMyHotel();
      const id = hotels[0]?.id ?? null;
      setHotelId(id);
      if (!id) {
        setTasks([]);
        return;
      }
      const nextTasks = await getHotelTasks(id);
      setTasks(nextTasks);
      if (role === 'SERVICE_ADMIN') {
        const [nextStaff, nextRooms] = await Promise.all([
          getHotelStaff(id),
          getHotelRooms(id),
        ]);
        setStaff(nextStaff.filter((person) => person.userStatus === 'ACTIVE'));
        setRooms(nextRooms);
      }
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, [role, t]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const sendTask = async () => {
    if (!hotelId || !assigneeId) {
      Alert.alert(t(TRANSLATION_KEYS.HOTEL_DESK.TASKS_TITLE), t(TRANSLATION_KEYS.HOTEL_DESK.NO_ASSIGNEE));
      return;
    }
    setSaving(true);
    try {
      await createHotelTask({
        hotelId,
        assigneeUserId: assigneeId,
        hotelRoomId: roomId,
        note: note.trim() || null,
      });
      setNote('');
      setAssigneeId(null);
      await load();
    } catch (sendError: any) {
      Alert.alert(
        t(TRANSLATION_KEYS.HOTEL_DESK.TASKS_TITLE),
        sendError?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.LOAD_FAILED)
      );
    } finally {
      setSaving(false);
    }
  };

  const finishTask = (task: HotelTaskRow) => {
    Alert.alert(t(TRANSLATION_KEYS.HOTEL_DESK.COMPLETE_TASK), task.hotelRoom?.roomNumber ? `Room ${task.hotelRoom.roomNumber}` : '', [
      { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
      {
        text: t(TRANSLATION_KEYS.HOTEL_DESK.COMPLETE_TASK),
        onPress: () => {
          void (async () => {
            try {
              await completeHotelTask(task.id);
              await load();
            } catch (finishError: any) {
              Alert.alert(
                t(TRANSLATION_KEYS.HOTEL_DESK.TASKS_TITLE),
                finishError?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.LOAD_FAILED)
              );
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAwareScroll className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <Pressable onPress={() => goBack(router)} accessibilityRole="button" style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.HOTEL_DESK.TASKS_TITLE)}
        </Text>

        {loading ? <ActivityIndicator className="mt-8" color={theme.colors.primary} /> : null}
        {error ? <Text className="mt-4 text-sm text-text dark:text-text-dark">{error}</Text> : null}

        {isAdmin && !loading ? (
          <View className="p-4 mt-6 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
            <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.HOTEL_DESK.ASSIGNEE)}
            </Text>
            <View className="flex-row flex-wrap gap-2">
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
            <Text className="mt-4 mb-2 text-sm font-semibold text-text dark:text-text-dark">Room</Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => setRoomId(null)}
                className={`px-3 py-2 rounded-full border ${roomId ? 'border-border dark:border-border-dark' : 'bg-primary border-primary'}`}
              >
                <Text className={`text-xs font-semibold ${roomId ? 'text-text dark:text-text-dark' : 'text-white'}`}>
                  {t(TRANSLATION_KEYS.HOTEL_DESK.UNASSIGNED)}
                </Text>
              </Pressable>
              {rooms.map((room) => {
                const selected = roomId === room.id;
                return (
                  <Pressable
                    key={room.id}
                    onPress={() => setRoomId(room.id)}
                    className={`px-3 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'border-border dark:border-border-dark'}`}
                  >
                    <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                      {room.roomNumber || room.id.slice(0, 6)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t(TRANSLATION_KEYS.HOTEL_DESK.NOTE)}
              placeholderTextColor={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
              className="px-3 py-3 mt-4 text-text dark:text-text-dark border rounded-xl border-border dark:border-border-dark"
            />
            <Pressable
              onPress={() => { void sendTask(); }}
              disabled={saving}
              className="items-center py-3 mt-4 rounded-xl bg-primary"
            >
              <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.HOTEL_DESK.CREATE_TASK)}</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && tasks.length === 0 ? (
          <Text className="mt-6 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.HOTEL_DESK.TASKS_EMPTY)}
          </Text>
        ) : null}

        <View className="gap-3 mt-4">
          {tasks.map((task) => {
            const open = task.status === 'OPEN';
            return (
              <View key={task.id} className="p-4 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-text dark:text-text-dark">
                    {task.hotelRoom?.roomNumber ? `Room ${task.hotelRoom.roomNumber}` : t(TRANSLATION_KEYS.HOTEL_DESK.TASKS_TITLE)}
                  </Text>
                  <Text className="text-xs font-semibold text-primary dark:text-primary-dark">
                    {open ? t(TRANSLATION_KEYS.HOTEL_DESK.TASK_OPEN) : t(TRANSLATION_KEYS.HOTEL_DESK.TASK_DONE)}
                  </Text>
                </View>
                <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                  {staffDisplayName(task.assignee)}
                </Text>
                {task.note ? (
                  <Text className="mt-2 text-sm text-text dark:text-text-dark">{task.note}</Text>
                ) : null}
                {open ? (
                  <Pressable onPress={() => finishTask(task)} className="self-start mt-3">
                    <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                      {t(TRANSLATION_KEYS.HOTEL_DESK.COMPLETE_TASK)}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
