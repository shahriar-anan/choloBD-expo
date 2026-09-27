import React, { useEffect, useState } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterForm } from '../../validators/auth';
import AppBrandSection from '../../components/homepage/AppBrandSection';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useFacebookSignIn } from '../../hooks/useFacebookSignIn';

export default function Register() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const placeholderColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  // OAuth hooks
  const { signInWithGoogle, isLoading: googleLoading, error: googleError } = useGoogleSignIn();
  const { signInWithFacebook, isLoading: facebookLoading, error: facebookError } = useFacebookSignIn();

  const { register, setValue, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    register('userName');
    register('email');
    register('password');
    register('confirm');
    register('role');
  }, [register]);

  const [showRolePicker, setShowRolePicker] = useState(false);
  const ROLE_OPTIONS = ['MASTER_ADMIN', 'SERVICE_ADMIN', 'EMPLOYEE', 'USER'] as const;

  const onSubmit = (values: RegisterForm) => {
    void dispatch(registerUser({ email: values.email, password: values.password, userName: values.userName, role: values.role }));
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace('/(tabs)/dashboard');
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.error]);

  useEffect(() => {
    return () => {
      void dispatch(clearError());
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 p-6 bg-surface dark:bg-surface-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="justify-center flex-1">
        <View className="w-full max-w-md mx-auto">
          <View className="p-6 shadow-md bg-surface dark:bg-surface-dark rounded-2xl">
            <View className="items-center mb-6">
              <AppBrandSection width={240} height={90} />
            </View>
            <Text className="mt-4 mb-2 text-3xl font-bold text-center font-heading text-text dark:text-text-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.CREATE_ACCOUNT)}</Text>
            <Text className="mb-6 text-center text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.SUBTITLE)}</Text>

            <View className="space-y-4">
              <View>
                <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.USERNAME_LABEL)}</Text>
                <TextInput
                  onChangeText={(v) => setValue('userName', v)}
                  autoCapitalize="none"
                  className="p-3 border rounded-lg border-border dark:border-border-dark bg-background-input dark:bg-background-input-dark text-text dark:text-text-dark"
                  placeholder={t(TRANSLATION_KEYS.AUTH.REGISTER.USERNAME_PLACEHOLDER)}
                  placeholderTextColor={placeholderColor}
                />
                {errors.userName ? <Text className="mt-1 text-xs text-danger">{String(errors.userName.message)}</Text> : null}
              </View>

              <View>
                <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.EMAIL_LABEL)}</Text>
                <TextInput
                  onChangeText={(v) => setValue('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="p-3 border rounded-lg border-border dark:border-border-dark bg-background-input dark:bg-background-input-dark text-text dark:text-text-dark"
                  placeholder={t(TRANSLATION_KEYS.AUTH.REGISTER.EMAIL_PLACEHOLDER)}
                  placeholderTextColor={placeholderColor}
                />
                {errors.email ? <Text className="mt-1 text-xs text-danger">{String(errors.email.message)}</Text> : null}
              </View>

              <View>
                <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.PASSWORD_LABEL)}</Text>
                <TextInput
                  onChangeText={(v) => setValue('password', v)}
                  secureTextEntry
                  className="p-3 border rounded-lg border-border dark:border-border-dark bg-background-input dark:bg-background-input-dark text-text dark:text-text-dark"
                  placeholder={t(TRANSLATION_KEYS.AUTH.REGISTER.PASSWORD_PLACEHOLDER)}
                  placeholderTextColor={placeholderColor}
                />
                {errors.password ? <Text className="mt-1 text-xs text-danger">{String(errors.password.message)}</Text> : null}
              </View>

              <View>
                <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.CONFIRM_PASSWORD_LABEL)}</Text>
                <TextInput
                  onChangeText={(v) => setValue('confirm', v)}
                  secureTextEntry
                  className="p-3 border rounded-lg border-border dark:border-border-dark bg-background-input dark:bg-background-input-dark text-text dark:text-text-dark"
                  placeholder={t(TRANSLATION_KEYS.AUTH.REGISTER.PASSWORD_PLACEHOLDER)}
                  placeholderTextColor={placeholderColor}
                />
                {errors.confirm ? <Text className="mt-1 text-xs text-danger">{String(errors.confirm.message)}</Text> : null}
              </View>

              <View>
                <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.ROLE_LABEL)}</Text>
                <TouchableOpacity
                  onPress={() => setShowRolePicker(!showRolePicker)}
                  className="flex-row items-center justify-between p-3 border rounded-lg border-border dark:border-border-dark bg-background dark:bg-background-dark"
                >
                  <Text className={"flex-1"}>
                    {watch('role') || t(TRANSLATION_KEYS.AUTH.REGISTER.SELECT_ROLE)}
                  </Text>
                  <Ionicons name={showRolePicker ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.primary} />
                </TouchableOpacity>

                {showRolePicker && (
                  <View className="mt-2 overflow-hidden bg-white border rounded-lg border-border dark:border-border-dark dark:bg-surface-dark">
                    {ROLE_OPTIONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => {
                          setValue('role', r as any);
                          setShowRolePicker(false);
                        }}
                        className={`p-4 border-b border-border dark:border-border-dark`}
                      >
                        <Text className="font-medium text-text dark:text-text-dark">{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text className="mt-2 text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.ROLE_DESC)}</Text>
                {errors.role ? <Text className="mt-1 text-xs text-danger">{String((errors.role as any).message)}</Text> : null}
              </View>

              <TouchableOpacity onPress={handleSubmit(onSubmit)} className="p-3 rounded-lg bg-primary dark:bg-primary-dark">
                <Text className="font-medium text-center text-white">{auth.isLoading ? t(TRANSLATION_KEYS.AUTH.REGISTER.CREATING) : t(TRANSLATION_KEYS.AUTH.REGISTER.CREATE_BTN)}</Text>
              </TouchableOpacity>
              {auth.error ? <Text className="mt-2 text-sm text-center text-danger">{String(auth.error)}</Text> : null}
            </View>

            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-border dark:bg-border-dark" />
              <Text className="px-3 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.OR_SIGN_UP_WITH)}</Text>
              <View className="flex-1 h-px bg-border dark:bg-border-dark" />
            </View>

            <Text className="mb-3 text-xs text-center text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.AUTH.LOGIN.SOCIAL_UNAVAILABLE)}
            </Text>

            {/* Google Sign-Up Button */}
            <TouchableOpacity
              onPress={signInWithGoogle}
              disabled
              className={`flex-row items-center justify-center gap-3 p-4 rounded-xl mb-3
                           bg-white border border-gray-200
                           dark:bg-gray-900 dark:border-gray-700
                           opacity-50`}
            >
              {googleLoading ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#1F2937" />
                  <Text className="font-semibold text-gray-900 dark:text-white text-base">
                    {t(TRANSLATION_KEYS.AUTH.REGISTER.SIGN_UP_GOOGLE)}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Facebook Sign-Up Button */}
            <TouchableOpacity
              onPress={signInWithFacebook}
              disabled
              className={`flex-row items-center justify-center gap-3 p-4 rounded-xl
                           bg-[#1877F2]
                           opacity-50`}
            >
              {facebookLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-facebook" size={20} color="white" />
                  <Text className="font-semibold text-white text-base">
                    {t(TRANSLATION_KEYS.AUTH.REGISTER.SIGN_UP_FACEBOOK)}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.ALREADY_ACCOUNT)}</Text>
              <Link href="/login">
                <Text className="ml-2 text-sm text-primary dark:text-primary-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.SIGN_IN)}</Text>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
