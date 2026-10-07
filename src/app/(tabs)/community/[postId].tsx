import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthWithAdminCheck } from '../../../hooks/useAuthWithAdminCheck';
import { useFetchCommunityPost } from '../../../hooks/useFetchCommunityPost';
import { useCommunityPostLogic } from '../../../hooks/useCommunityPostLogic';
import { TagChip } from '../../../components/community';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function CommunityPostDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = params.postId;
  const { isDark } = useTheme();
  const { user, isMasterAdmin, isAuthenticated } = useAuthWithAdminCheck();
  const { post, loading, refetch } = useFetchCommunityPost(postId);
  const { toggleReact, doDeactivate } = useCommunityPostLogic();
  const { t } = useTranslation();

  const bg = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const canEdit = useMemo(() => {
    if (!post) return false;
    return user?.id === post.creatorUserId || isMasterAdmin;
  }, [isMasterAdmin, post, user?.id]);

  const handleReact = async () => {
    if (!post?.id) return;
    if (!isAuthenticated) {
      Alert.alert(t(TRANSLATION_KEYS.COMMUNITY.LOGIN_REQUIRED), t(TRANSLATION_KEYS.COMMUNITY.SUBTITLE));
      return;
    }
    await toggleReact(post.id);
    await refetch();
  };

  const handleDeactivate = async () => {
    if (!post?.id) return;
    await doDeactivate(post.id);
    goBack(router);
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View className="px-5 pb-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => goBack(router)}>
          <Ionicons name="chevron-back" size={24} color={primary} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.COMMUNITY.POST_TITLE)}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-6">
          <View
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface,
              borderWidth: 1,
              borderColor: isDark ? theme.colors['border-dark'] : theme.colors.border,
            }}
          >
            {post.images?.[0] ? (
              <Image source={{ uri: post.images[0].url }} style={{ width: '100%', height: 320 }} resizeMode="cover" />
            ) : (
              <View style={{ height: 320, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="image-outline" size={40} color={muted} />
              </View>
            )}

            <View className="px-4 py-4">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-lg font-semibold text-text dark:text-text-dark">{post.creator?.userName}</Text>
                  <Text className="text-xs text-muted dark:text-muted-dark">{new Date(post.createdAt).toLocaleString()}</Text>
                </View>
                <Text className="text-xs text-muted dark:text-muted-dark">
                  {post.isActive ? t(TRANSLATION_KEYS.COMMUNITY.ACTIVE) : t(TRANSLATION_KEYS.COMMUNITY.DRAFT)}
                </Text>
              </View>

              {post.caption ? <Text className="text-base leading-6 text-text dark:text-text-dark mb-3">{post.caption}</Text> : null}

              {post.tags?.length ? (
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <TagChip key={tag.taggedUserId} tag={tag} />
                  ))}
                </View>
              ) : null}

              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={handleReact}
                  className="flex-row items-center px-4 py-2 rounded-full"
                  style={{ backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface }}
                >
                  <Ionicons name={post.userHasReacted ? 'heart' : 'heart-outline'} size={18} color={theme.colors.error} />
                  <Text className="ml-2 text-sm font-semibold text-text dark:text-text-dark">{post.wowCount}</Text>
                </TouchableOpacity>

                {canEdit ? (
                  <TouchableOpacity
                    onPress={handleDeactivate}
                    className="px-4 py-2 rounded-full"
                    style={{ backgroundColor: isDark ? theme.colors['surface-dark'] : theme.colors.surface }}
                  >
                    <Text className="text-sm font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.COMMUNITY.DEACTIVATE)}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>

          {post.images?.length > 1 ? (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-text dark:text-text-dark mb-2">{t(TRANSLATION_KEYS.COMMUNITY.MORE_PHOTOS)}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {post.images.slice(1).map((image) => (
                  <Image key={image.id} source={{ uri: image.url }} style={{ width: 140, height: 140, borderRadius: 16, marginRight: 12 }} />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
