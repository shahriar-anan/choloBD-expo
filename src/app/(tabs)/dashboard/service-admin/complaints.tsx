import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { KeyboardAwareScroll } from '../../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
      Alert.alert('Complaints', error?.response?.data?.message || 'Could not load complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openComplaint = async (complaint: HotelComplaint) => {
    setOpenId(complaint.id);
    setDraft('');
    try {
      setComments(await getComplaintComments(complaint.id));
    } catch (error: any) {
      Alert.alert('Complaints', error?.response?.data?.message || 'Could not load comments.');
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
      Alert.alert('Complaints', error?.response?.data?.message || 'Could not add the comment.');
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
      Alert.alert('Complaints', error?.response?.data?.message || 'Could not update the complaint.');
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
        <Text className="mt-2 text-2xl font-bold text-text dark:text-text-dark">Complaints</Text>
        <Text className="mt-1 mb-4 text-sm text-muted dark:text-muted-dark">Guest complaints for your hotel</Text>

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : complaints.length === 0 ? (
          <Text className="text-sm text-muted dark:text-muted-dark">No complaints in the inbox.</Text>
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
                        {comment.authorName || comment.author?.userName || 'Staff'}: {comment.content}
                      </Text>
                    ))}
                    {status !== 'CLOSED' ? (
                      <>
                        <TextInput
                          value={draft}
                          onChangeText={setDraft}
                          placeholder="Write a comment"
                          className="px-3 py-2 mt-2 border rounded-lg border-border dark:border-border-dark text-text dark:text-text-dark"
                        />
                        <Pressable onPress={() => void sendComment(complaint.id)} disabled={busy} className="px-3 py-2 mt-2 rounded-lg bg-primary">
                          <Text className="font-semibold text-center text-white">Send comment</Text>
                        </Pressable>
                        <View className="flex-row gap-2 mt-2">
                          {status === 'OPEN' ? (
                            <Pressable onPress={() => void changeStatus(complaint.id, 'UNSOLVED')} disabled={busy} className="flex-1 px-3 py-2 border rounded-lg border-border dark:border-border-dark">
                              <Text className="text-sm font-semibold text-center text-text dark:text-text-dark">Unsolved</Text>
                            </Pressable>
                          ) : null}
                          <Pressable onPress={() => void changeStatus(complaint.id, 'CLOSED')} disabled={busy} className="flex-1 px-3 py-2 border rounded-lg border-border dark:border-border-dark">
                            <Text className="text-sm font-semibold text-center text-text dark:text-text-dark">Close</Text>
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
