import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { ProfileAvatar } from '../../../components/ui/profileAvatar';
import { getUserProfile, updateUserProfile } from '../../../services/api/users';
import { uploadCommunityImageToCloudinary } from '../../../services/api/cloudinaryUpload';
import { AppDispatch, RootState } from '../../../store/store';
import { setAuthUser } from '../../../store/slices/authSlice';
import { saveUser } from '../../../lib/secureStore';
import { AuthUser } from '../../../types/auth';

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function textOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function serverMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function mergeSavedUser(current: AuthUser, saved: Record<string, unknown>): AuthUser {
  const read = (key: keyof AuthUser) => (typeof saved[key] === 'string' ? saved[key] as string : undefined);
  return {
    ...current,
    id: read('id') || current.id,
    email: read('email') || current.email,
    userName: read('userName') ?? current.userName,
    role: (read('role') as AuthUser['role']) || current.role,
    imageUrl: read('imageUrl') ?? current.imageUrl,
    userStatus: read('userStatus') ?? current.userStatus,
    firstName: textOrNull(typeof saved.firstName === 'string' ? saved.firstName : ''),
    lastName: textOrNull(typeof saved.lastName === 'string' ? saved.lastName : ''),
    phoneNumber: textOrNull(typeof saved.phoneNumber === 'string' ? saved.phoneNumber : ''),
  };
}

export default function AccountScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const placeholderColor = muted;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFormError(null);
    try {
      const profile = await getUserProfile();
      setUserName(typeof profile?.userName === 'string' ? profile.userName : '');
      setFirstName(typeof profile?.firstName === 'string' ? profile.firstName : '');
      setLastName(typeof profile?.lastName === 'string' ? profile.lastName : '');
      setPhoneNumber(typeof profile?.phoneNumber === 'string' ? profile.phoneNumber : '');
      setEmail(typeof profile?.email === 'string' ? profile.email : '');
      setImageUrl(typeof profile?.imageUrl === 'string' ? profile.imageUrl : null);
      setLocalPhotoUri(null);
    } catch (error: unknown) {
      setFormError(serverMessage(error, t(TRANSLATION_KEYS.PROFILE.SAVE_FAILED)));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickPhoto = async (source: 'library' | 'camera') => {
    const permission = source === 'library'
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t(TRANSLATION_KEYS.COMMON.ERROR),
        t(source === 'library' ? TRANSLATION_KEYS.PROFILE.PHOTO_PERMISSION : TRANSLATION_KEYS.PROFILE.CAMERA_PERMISSION),
      );
      return;
    }

    const result = source === 'library'
      ? await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      })
      : await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }
    setLocalPhotoUri(result.assets[0].uri);
    setFormError(null);
  };

  const save = async () => {
    const nextUserName = userName.trim();
    const nextEmail = email.trim();
    if (nextUserName.length < 2 || nextUserName.length > 50 || !USERNAME_PATTERN.test(nextUserName)) {
      setFormError(t(TRANSLATION_KEYS.PROFILE.USERNAME_INVALID));
      return;
    }
    if (!EMAIL_PATTERN.test(nextEmail)) {
      setFormError(t(TRANSLATION_KEYS.PROFILE.EMAIL_INVALID));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      let nextImageUrl = imageUrl || undefined;
      if (localPhotoUri) {
        try {
          nextImageUrl = await uploadCommunityImageToCloudinary(
            {
              uri: localPhotoUri,
              name: `profile-${Date.now()}.jpg`,
              type: 'image/jpeg',
            },
            'cholo-bd/profiles',
          );
        } catch (uploadError: unknown) {
          setFormError(serverMessage(uploadError, t(TRANSLATION_KEYS.PROFILE.PHOTO_UPLOAD_FAILED)));
          return;
        }
      }

      const saved = await updateUserProfile({
        userName: nextUserName,
        email: nextEmail,
        firstName: textOrNull(firstName),
        lastName: textOrNull(lastName),
        phoneNumber: textOrNull(phoneNumber),
        ...(nextImageUrl ? { imageUrl: nextImageUrl } : {}),
      });

      if (authUser && saved && typeof saved === 'object') {
        const nextUser = mergeSavedUser(authUser, saved as Record<string, unknown>);
        await saveUser(nextUser);
        dispatch(setAuthUser(nextUser));
      }

      Alert.alert(t(TRANSLATION_KEYS.COMMON.SUCCESS), t(TRANSLATION_KEYS.PROFILE.SAVED));
      router.back();
    } catch (error: unknown) {
      setFormError(serverMessage(error, t(TRANSLATION_KEYS.PROFILE.SAVE_FAILED)));
    } finally {
      setSaving(false);
    }
  };

  const previewName = userName.trim() || email.trim();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center px-4 pt-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.COMMON.BACK)}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </Pressable>
        <Text className="text-2xl font-bold font-heading text-text dark:text-text-dark">
          {t(TRANSLATION_KEYS.PROFILE.EDIT_ACCOUNT)}
        </Text>
      </View>

      {loading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <View className="items-center mb-5">
              {localPhotoUri ? (
                <Image
                  source={{ uri: localPhotoUri }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  accessibilityRole="image"
                />
              ) : (
                <ProfileAvatar imageUrl={imageUrl} userName={previewName} email={email} size={96} />
              )}
              <View className="flex-row mt-4">
                <Pressable
                  onPress={() => { void pickPhoto('library'); }}
                  disabled={saving}
                  accessibilityRole="button"
                  className="px-3 py-2 mr-2 border rounded-full border-border dark:border-border-dark"
                >
                  <Text className="text-sm text-text dark:text-text-dark">{t(TRANSLATION_KEYS.PROFILE.CHOOSE_PHOTO)}</Text>
                </Pressable>
                <Pressable
                  onPress={() => { void pickPhoto('camera'); }}
                  disabled={saving}
                  accessibilityRole="button"
                  className="px-3 py-2 border rounded-full border-border dark:border-border-dark"
                >
                  <Text className="text-sm text-text dark:text-text-dark">{t(TRANSLATION_KEYS.PROFILE.TAKE_PHOTO)}</Text>
                </Pressable>
              </View>
            </View>

            <Field label={t(TRANSLATION_KEYS.PROFILE.USERNAME)} value={userName} onChangeText={setUserName} autoCapitalize="none" placeholderColor={placeholderColor} />
            <Field label={t(TRANSLATION_KEYS.PROFILE.FIRST_NAME)} value={firstName} onChangeText={setFirstName} placeholderColor={placeholderColor} />
            <Field label={t(TRANSLATION_KEYS.PROFILE.LAST_NAME)} value={lastName} onChangeText={setLastName} placeholderColor={placeholderColor} />
            <Field label={t(TRANSLATION_KEYS.PROFILE.PHONE)} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholderColor={placeholderColor} />
            <Field label={t(TRANSLATION_KEYS.PROFILE.EMAIL)} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderColor={placeholderColor} />

            {formError ? <Text className="mb-3 text-sm text-danger">{formError}</Text> : null}

            <Pressable
              onPress={() => { void save(); }}
              disabled={saving}
              accessibilityRole="button"
              className="items-center p-3 rounded-lg bg-primary dark:bg-primary-dark"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              <Text className="font-medium text-white">
                {saving ? t(TRANSLATION_KEYS.PROFILE.SAVING) : t(TRANSLATION_KEYS.COMMON.SAVE)}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  placeholderColor,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: 'none' | 'sentences';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  placeholderColor: string;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        className="p-3 border rounded-lg border-border dark:border-border-dark bg-background-input dark:bg-background-input-dark text-text dark:text-text-dark"
        placeholder={label}
        placeholderTextColor={placeholderColor}
      />
    </View>
  );
}
