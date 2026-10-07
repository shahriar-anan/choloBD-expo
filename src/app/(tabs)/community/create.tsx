import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthWithAdminCheck } from '../../../hooks/useAuthWithAdminCheck';
import { useCommunityPostLogic } from '../../../hooks/useCommunityPostLogic';
import { CreatePostForm } from '../../../components/community';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { goBack } from '../../../utilities/navigation';

export default function CommunityCreatePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuthWithAdminCheck();
  const { createDraft, uploadImagesAndAttach, loading } = useCommunityPostLogic();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const bg = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const handleSubmit = async (values: { userTripPlanId?: string; caption?: string; images: { url: string; order?: number; altText?: string }[] }) => {
    if (!isAuthenticated) {
      Alert.alert(t(TRANSLATION_KEYS.COMMUNITY.LOGIN_REQUIRED), t(TRANSLATION_KEYS.COMMUNITY.JOIN_DESC));
      return;
    }

    setIsSubmitting(true);
    try {
      const draft = await createDraft({ userTripPlanId: values.userTripPlanId, caption: values.caption || '' });
      if (!draft?.id) {
        return;
      }

      // Images are required by backend, so always attach them
      await uploadImagesAndAttach(draft.id, values.images);

      Alert.alert(t('common.success'), t(TRANSLATION_KEYS.COMMUNITY.DRAFT_CREATED));
      goBack(router);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View className="px-5 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => goBack(router)}>
          <Text style={{ color: primary, fontWeight: '700' }}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.COMMUNITY.CREATE_TITLE)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View className="px-5 pb-3">
        <Text style={{ color: text, fontSize: 13, lineHeight: 18 }}>{t(TRANSLATION_KEYS.COMMUNITY.CREATE_SUBTITLE)}</Text>
      </View>

      <CreatePostForm onSubmit={handleSubmit} isSubmitting={isSubmitting || loading} />
    </SafeAreaView>
  );
}
