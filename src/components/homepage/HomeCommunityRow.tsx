import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useHomeCommunityPosts } from '../../hooks/useHomeFeed';
import { CommunityPost } from '../../types/community';
import { HomeFeedStatus, HomeSectionHeader } from './HomeSectionHeader';
import PhotoCard from './PhotoCard';

export default function HomeCommunityRow() {
  const router = useRouter();
  const { t } = useTranslation();
  const { posts, isLoading, error, refetch } = useHomeCommunityPosts();
  const visible = posts.slice(0, 4);

  if (!isLoading && !error && posts.length === 0) return null;

  const rows: CommunityPost[][] = [];
  for (let index = 0; index < visible.length; index += 2) {
    rows.push(visible.slice(index, index + 2));
  }

  return (
    <View style={{ paddingTop: 22, paddingBottom: 8, paddingHorizontal: 16 }}>
      <HomeSectionHeader
        title={t(TRANSLATION_KEYS.HOME.FROM_TRAVELERS)}
        onSeeAll={posts.length > 0 ? () => router.push('/(tabs)/community') : undefined}
      />
      <HomeFeedStatus isLoading={isLoading} error={error} onRetry={refetch} />
      {!isLoading && !error && visible.length > 0 ? (
        <View>
          {rows.map((row, rowIndex) => (
            <View key={row.map((post) => post.id).join('-')} style={{ flexDirection: 'row', gap: 10, marginTop: rowIndex === 0 ? 0 : 10 }}>
              {row.map((post) => {
                const imageUrl = [...(post.images ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url;
                return (
                  <View key={post.id} style={{ flex: 1 }}>
                    <PhotoCard
                      imageUrl={imageUrl}
                      width="100%"
                      height={168}
                      title={post.caption || ''}
                      onPress={() => router.push({ pathname: '/(tabs)/community/[postId]', params: { postId: post.id } })}
                    />
                  </View>
                );
              })}
              {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
          <View style={{ marginTop: 10 }}>
            <PhotoCard
              imageUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=500&fit=crop"
              width="100%"
              height={132}
              title={t(TRANSLATION_KEYS.HOME.BUILD_ITINERARY)}
              detail={t(TRANSLATION_KEYS.HOME.BUILD_ITINERARY_HINT)}
              onPress={() => router.push('/(tabs)/trip-planner')}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
