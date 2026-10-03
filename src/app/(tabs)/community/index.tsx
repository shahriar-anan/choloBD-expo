import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthWithAdminCheck } from '../../../hooks/useAuthWithAdminCheck';
import { useFetchCommunityPosts } from '../../../hooks/useFetchCommunityPosts';
import { PostFeed } from '../../../components/community';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';

export default function CommunityIndex() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isAuthenticated, isMasterAdmin } = useAuthWithAdminCheck();
  const { posts, loading, error, pagination } = useFetchCommunityPosts(1, 20);
  const { t } = useTranslation();

  const bg = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const handleCreate = () => {
    router.push('/(tabs)/community/create');
  };

  const handlePostPress = (postId: string) => {
    router.push({ pathname: '/(tabs)/community/[postId]', params: { postId } });
  };

  const handlePending = () => {
    router.push('/(tabs)/community/pending');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View className="px-5 pb-3 gap-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/(tabs)');
            }}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
            style={{ marginRight: 8, minWidth: 44, minHeight: 44, justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={24} color={text} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.COMMUNITY.TITLE)}</Text>
        </View>
        <View>
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.COMMUNITY.SUBTITLE)}
          </Text>
        </View>

        <View className="flex-row flex-wrap items-center gap-3">
          {isMasterAdmin ? (
            <TouchableOpacity onPress={handlePending} style={{ padding: 10, alignSelf: 'flex-start' }}>
              <Ionicons name="shield-checkmark-outline" size={22} color={primary} />
            </TouchableOpacity>
          ) : null}
          {isAuthenticated ? (
            <TouchableOpacity
              onPress={handleCreate}
              style={{ backgroundColor: primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, alignSelf: 'flex-start' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t(TRANSLATION_KEYS.COMMUNITY.NEW_POST)}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {error ? (
        <View className="px-5 mb-3">
          <Text className="text-sm text-error dark:text-error-dark">{String(error?.message || error)}</Text>
        </View>
      ) : null}

      {!isAuthenticated ? (
        <View className="px-5 mb-3">
          <View
            style={{
              borderWidth: 1,
              borderColor: isDark ? theme.colors['border-dark'] : theme.colors.border,
              backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text style={{ color: text, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>{t(TRANSLATION_KEYS.COMMUNITY.JOIN_TITLE)}</Text>
            <Text style={{ color: muted, marginBottom: 12 }}>{t(TRANSLATION_KEYS.COMMUNITY.JOIN_DESC)}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: primary, fontWeight: '700' }}>{t(TRANSLATION_KEYS.COMMUNITY.SIGN_IN)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {loading && posts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <PostFeed
          posts={posts}
          loading={loading}
          emptyMessage={t(TRANSLATION_KEYS.COMMUNITY.EMPTY_FEED)}
          onPressPost={(post) => handlePostPress(post.id)}
          onEndReached={() => {
            if (pagination && posts.length < pagination.total) {
              // current slice replaces feed, so just refetch the next page when needed later
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
