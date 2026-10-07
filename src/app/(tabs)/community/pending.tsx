import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useAdminCommunityLogic } from '../../../hooks/useAdminCommunityLogic';
import { PostCard } from '../../../components/community';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function CommunityPendingPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { pendingPosts, pendingLoading, fetchPending, doActivate, canAdmin } = useAdminCommunityLogic();
  const { t } = useTranslation();

  const bg = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  useEffect(() => {
    fetchPending(1, 20);
  }, [fetchPending]);

  if (!canAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: text }}>{t(TRANSLATION_KEYS.COMMUNITY.ACCESS_DENIED)}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View className="px-5 pb-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => goBack(router)}>
          <Ionicons name="chevron-back" size={24} color={primary} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.COMMUNITY.PENDING_TITLE)}</Text>
        <View style={{ width: 24 }} />
      </View>

      {pendingLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <FlatList
          data={pendingPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4 mb-3">
              <PostCard post={item} />
              <TouchableOpacity
                onPress={async () => {
                  await doActivate(item.id);
                }}
                className="mt-2 self-end px-4 py-2 rounded-full"
                style={{ backgroundColor: primary }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t(TRANSLATION_KEYS.COMMUNITY.ACTIVATE)}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-16">
              <Text className="text-text dark:text-text-dark">{t(TRANSLATION_KEYS.COMMUNITY.NO_PENDING)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
