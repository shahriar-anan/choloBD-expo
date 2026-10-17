import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { appAlert } from '../../../../components/ui/appAlert';
import { KeyboardAwareScroll } from '../../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import theme from '../../../../constants/theme';
import { useTheme } from '../../../../hooks/useTheme';
import {
  addComplaintComment,
  getComplaintComments,
  getComplaintInbox,
  HotelComplaint,
  updateComplaintStatus,
} from '../../../../services/api/complaints';

export default function HotelComplaintsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [complaints, setComplaints] = useState<HotelComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setComplaints(await getComplaintInbox());
    } catch (error: any) {
      appAlert(t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS), error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_LOAD_COMPLAINTS), undefined, 'error');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openComplaint = async (complaint: HotelComplaint) => {
    setOpenId(complaint.id);
    setDraft('');
    try {
      setComments(await getComplaintComments(complaint.id));
    } catch (error: any) {
      appAlert(t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS), error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_LOAD_COMMENTS), undefined, 'error');
    }
  };

  const sendComment = async (complaintId: string) => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await addComplaintComment(complaintId, draft.trim());
      setDraft('');
      setComments(await getComplaintComments(complaintId));
    } catch (error: any) {
      appAlert(t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS), error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_ADD_COMMENT), undefined, 'error');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (complaintId: string, status: 'UNSOLVED' | 'CLOSED') => {
    setBusy(true);
    try {
      await updateComplaintStatus(complaintId, status);
      await load();
      setOpenId(null);
    } catch (error: any) {
      appAlert(t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS), error?.response?.data?.message || t(TRANSLATION_KEYS.HOTEL_DESK.COULD_NOT_UPDATE_COMPLAINT), undefined, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAwareScroll className="flex-1 px-6 pt-4">
        <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={24} color={isDark ? theme.colors['text-dark'] : theme.colors.text} />
        </Pressable>
        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS)}</Text>
        <Text className="mt-1 mb-4 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.COMPLAINTS_DESC)}</Text>

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : complaints.length === 0 ? (
          <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.COMPLAINTS_EMPTY)}</Text>
        ) : (
          complaints.map((complaint) => {
            const open = openId === complaint.id;
            const status = String(complaint.status || '').toUpperCase();
            return (
              <View key={complaint.id} className="p-4 mb-3 bg-white border rounded-xl border-border dark:bg-surface-dark dark:border-border-dark">
                <Pressable onPress={() => void openComplaint(complaint)}>
                  <Text className="text-base font-semibold text-text dark:text-text-dark">{complaint.title}</Text>
                  <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{status}{complaint.complainantName ? ` · ${complaint.complainantName}` : ''}</Text>
                  <Text className="mt-2 text-sm text-text dark:text-text-dark">{complaint.description}</Text>
                </Pressable>
                {open ? (
                  <View className="mt-3">
                    {comments.map((comment) => (
                      <Text key={comment.id} className="mb-2 text-sm text-muted dark:text-muted-dark">
                        {comment.authorName || comment.author?.userName || t(TRANSLATION_KEYS.HOTEL_DESK.STAFF)}: {comment.content}
                      </Text>
                    ))}
                    {status !== 'CLOSED' ? (
                      <>
                        <TextInput
                          value={draft}
                          onChangeText={setDraft}
                          placeholder={t(TRANSLATION_KEYS.HOTEL_DESK.WRITE_COMMENT)}
                          className="px-3 py-2 mt-2 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark"
                        />
                        <Pressable onPress={() => void sendComment(complaint.id)} disabled={busy} className="px-3 py-2 mt-2 rounded-lg bg-primary">
                          <Text className="font-semibold text-center text-white">{t(TRANSLATION_KEYS.HOTEL_DESK.SEND_COMMENT)}</Text>
                        </Pressable>
                        <View className="flex-row gap-2 mt-2">
                          {status === 'OPEN' ? (
                            <Pressable onPress={() => void changeStatus(complaint.id, 'UNSOLVED')} disabled={busy} className="flex-1 px-3 py-2 border rounded-lg border-border dark:border-border-dark">
                              <Text className="text-sm font-semibold text-center text-text dark:text-text-dark">{t(TRANSLATION_KEYS.HOTEL_DESK.UNSOLVED)}</Text>
                            </Pressable>
                          ) : null}
                          <Pressable onPress={() => void changeStatus(complaint.id, 'CLOSED')} disabled={busy} className="flex-1 px-3 py-2 border rounded-lg border-border dark:border-border-dark">
                            <Text className="text-sm font-semibold text-center text-text dark:text-text-dark">{t(TRANSLATION_KEYS.COMMON.CLOSE)}</Text>
                          </Pressable>
                        </View>
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
