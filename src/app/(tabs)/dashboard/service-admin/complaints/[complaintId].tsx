import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';
import { useComplaintInboxLogic } from '@/hooks/useComplaintInboxLogic';
import { ComplaintStatus } from '@/types/enums';

export default function ComplaintDetailScreen() {
  const router = useRouter();
  const { complaintId } = useLocalSearchParams<{ complaintId: string }>();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const {
    selected,
    comments,
    detailLoading,
    actionLoading,
    loadDetail,
    handleUpdateStatus,
    handleAddComment,
  } = useComplaintInboxLogic();

  const [commentText, setCommentText] = useState('');
  const [responseText, setResponseText] = useState('');

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;

  useEffect(() => {
    if (complaintId) loadDetail(complaintId);
  }, [complaintId, loadDetail]);

  const onMarkUnsolved = () => {
    if (!complaintId) return;
    Alert.alert(
      t(TRANSLATION_KEYS.COMPLAINTS.MARK_UNSOLVED),
      t(TRANSLATION_KEYS.COMPLAINTS.MARK_UNSOLVED_CONFIRM),
      [
        { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
        {
          text: t(TRANSLATION_KEYS.COMMON.CONFIRM),
          onPress: () =>
            handleUpdateStatus(
              complaintId,
              ComplaintStatus.UNSOLVED,
              responseText.trim() || undefined
            ),
        },
      ]
    );
  };

  const onMarkClosed = () => {
    if (!complaintId) return;
    Alert.alert(
      t(TRANSLATION_KEYS.COMPLAINTS.MARK_CLOSED),
      t(TRANSLATION_KEYS.COMPLAINTS.MARK_CLOSED_CONFIRM),
      [
        { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
        {
          text: t(TRANSLATION_KEYS.COMMON.CONFIRM),
          onPress: () =>
            handleUpdateStatus(
              complaintId,
              ComplaintStatus.CLOSED,
              responseText.trim() || undefined
            ),
        },
      ]
    );
  };

  const onSendComment = async () => {
    if (!complaintId) return;
    const result = await handleAddComment(complaintId, commentText);
    if (result) setCommentText('');
  };

  if (detailLoading && !selected) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="items-center justify-center flex-1 bg-background dark:bg-background-dark"
      >
        <ActivityIndicator size="large" color={primary} />
      </SafeAreaView>
    );
  }

  if (!selected) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        className="flex-1 px-6 bg-background dark:bg-background-dark"
      >
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginTop: 16 }}>
          <Ionicons name="chevron-back" size={24} color={text} />
        </Pressable>
        <Text className="mt-6 text-base text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.COMPLAINTS.NOT_FOUND)}
        </Text>
      </SafeAreaView>
    );
  }

  const guest =
    selected.complainantName ||
    selected.complainant?.userName ||
    selected.complainant?.email ||
    'Guest';

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={24} color={text} />
        </Pressable>

        <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
          {selected.title}
        </Text>
        <Text className="mt-1 text-sm font-semibold text-primary dark:text-primary-dark">
          {selected.status}
        </Text>

        <View
          className="p-4 mt-4 border rounded-xl border-border dark:border-border-dark"
          style={{ backgroundColor: surface }}
        >
          <Text className="mb-2 text-xs text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.COMPLAINTS.FROM)}: {guest}
          </Text>
          <Text className="text-sm leading-5 text-text dark:text-text-dark">
            {selected.description}
          </Text>
          {selected.adminResponse ? (
            <View className="pt-3 mt-3 border-t border-border dark:border-border-dark">
              <Text className="mb-1 text-xs font-semibold text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.COMPLAINTS.ADMIN_RESPONSE)}
              </Text>
              <Text className="text-sm text-text dark:text-text-dark">
                {selected.adminResponse}
              </Text>
            </View>
          ) : null}
        </View>

        {selected.status !== ComplaintStatus.CLOSED ? (
          <View className="mt-6">
            <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.COMPLAINTS.RESPONSE_OPTIONAL)}
            </Text>
            <TextInput
              value={responseText}
              onChangeText={setResponseText}
              placeholder={t(TRANSLATION_KEYS.COMPLAINTS.RESPONSE_PLACEHOLDER)}
              placeholderTextColor={
                isDark ? theme.colors['muted-dark'] : theme.colors.muted
              }
              multiline
              style={{
                minHeight: 80,
                borderWidth: 1,
                borderColor: border,
                borderRadius: 12,
                padding: 12,
                color: text,
                backgroundColor: surface,
                textAlignVertical: 'top',
              }}
            />
            <View className="flex-row gap-3 mt-3">
              <Pressable
                onPress={onMarkUnsolved}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: (isDark ? theme.colors['error-dark'] : theme.colors.error) + '22' }}
              >
                <Text style={{ color: isDark ? theme.colors['error-dark'] : theme.colors.error, fontWeight: '700' }}>
                  {t(TRANSLATION_KEYS.COMPLAINTS.MARK_UNSOLVED)}
                </Text>
              </Pressable>
              <Pressable
                onPress={onMarkClosed}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: primary }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {t(TRANSLATION_KEYS.COMPLAINTS.MARK_CLOSED)}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View className="mt-8 mb-10">
          <Text className="mb-3 text-lg font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.COMPLAINTS.COMMENTS)}
          </Text>

          {comments.length === 0 ? (
            <Text className="mb-4 text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.COMPLAINTS.NO_COMMENTS)}
            </Text>
          ) : (
            comments.map((c) => (
              <View
                key={c.id}
                className="p-3 mb-2 border rounded-xl border-border dark:border-border-dark"
                style={{ backgroundColor: surface }}
              >
                <Text className="text-xs font-semibold text-muted dark:text-muted-dark">
                  {c.authorName || c.author?.userName || 'Staff'}
                </Text>
                <Text className="mt-1 text-sm text-text dark:text-text-dark">
                  {c.content}
                </Text>
              </View>
            ))
          )}

          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder={t(TRANSLATION_KEYS.COMPLAINTS.COMMENT_PLACEHOLDER)}
            placeholderTextColor={
              isDark ? theme.colors['muted-dark'] : theme.colors.muted
            }
            multiline
            style={{
              minHeight: 72,
              borderWidth: 1,
              borderColor: border,
              borderRadius: 12,
              padding: 12,
              color: text,
              backgroundColor: surface,
              textAlignVertical: 'top',
              marginTop: 8,
            }}
          />
          <Pressable
            onPress={onSendComment}
            disabled={actionLoading}
            className="items-center py-3 mt-3 rounded-xl"
            style={{ backgroundColor: primary, opacity: actionLoading ? 0.6 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {t(TRANSLATION_KEYS.COMPLAINTS.ADD_COMMENT)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
