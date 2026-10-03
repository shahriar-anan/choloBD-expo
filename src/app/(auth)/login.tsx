import React, { useEffect } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginForm } from '../../validators/auth';
import AppBrandSection from '../../components/homepage/AppBrandSection';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { resolveRoleHome } from '../../utilities/travelerShell';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useFacebookSignIn } from '../../hooks/useFacebookSignIn';

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const placeholderColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;

  // OAuth hooks
  const { signInWithGoogle, isLoading: googleLoading, error: googleError } = useGoogleSignIn();
  const { signInWithFacebook, isLoading: facebookLoading, error: facebookError } = useFacebookSignIn();

  const { register, setValue, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    register('email');
    register('password');
  }, [register]);

  const onSubmit = (values: LoginForm) => {
    void dispatch(loginUser(values));
  };

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      return;
    }
    let active = true;
    void resolveRoleHome(auth.user.role, auth.user.id).then((path) => {
      if (active) {
        router.replace(path);
      }
    });
    return () => {
      active = false;
    };
  }, [auth.isAuthenticated, auth.user?.id, auth.user?.role, router]);

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
            <Text className="mt-4 mb-4 text-3xl font-bold text-center font-heading text-text dark:text-text-dark">{t(TRANSLATION_KEYS.AUTH.LOGIN.WELCOME_BACK)}</Text>
            <Text className="mb-6 text-center text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.LOGIN.SUBTITLE)}</Text>

            <View className="space-y-4">
              <View>
                <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.LOGIN.EMAIL_LABEL)}</Text>
                <TextInput
                  onChangeText={(v) => setValue('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="p-3 border rounded-lg border-border dark:border-border-dark bg-background-input dark:bg-background-input-dark text-text dark:text-text-dark"
                  placeholder={t(TRANSLATION_KEYS.AUTH.LOGIN.EMAIL_PLACEHOLDER)}
                  placeholderTextColor={placeholderColor}
                />
                {errors.email ? <Text className="text-xs text-danger mt-1">{String(errors.email.message)}</Text> : null}
              </View>

              <View>
                <Text className="mb-2 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.LOGIN.PASSWORD_LABEL)}</Text>
                <TextInput
                  onChangeText={(v) => setValue('password', v)}
                  secureTextEntry
                  className="p-3 border rounded-lg border-border dark:border-border-dark bg-background-input dark:bg-background-input-dark text-text dark:text-text-dark"
                  placeholder={t(TRANSLATION_KEYS.AUTH.LOGIN.PASSWORD_PLACEHOLDER)}
                  placeholderTextColor={placeholderColor}
                />
                {errors.password ? <Text className="text-xs text-danger mt-1">{String(errors.password.message)}</Text> : null}
              </View>

              <TouchableOpacity onPress={handleSubmit(onSubmit)} className="p-3 rounded-lg bg-primary dark:bg-primary-dark">
                <Text className="font-medium text-center text-white">{auth.isLoading ? t(TRANSLATION_KEYS.AUTH.LOGIN.SIGNING_IN) : t(TRANSLATION_KEYS.AUTH.LOGIN.SIGN_IN)}</Text>
              </TouchableOpacity>
              {auth.error ? <Text className="text-sm text-danger text-center mt-2">{String(auth.error)}</Text> : null}
            </View>

            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-border dark:bg-border-dark" />
              <Text className="px-3 text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.LOGIN.OR_CONTINUE_WITH)}</Text>
              <View className="flex-1 h-px bg-border dark:bg-border-dark" />
            </View>

            <Text className="mb-3 text-xs text-center text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.AUTH.LOGIN.SOCIAL_UNAVAILABLE)}
            </Text>

            {/* Google Sign-In Button */}
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
                    {t(TRANSLATION_KEYS.AUTH.LOGIN.SIGN_IN_GOOGLE)}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Facebook Sign-In Button */}
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
                    {t(TRANSLATION_KEYS.AUTH.LOGIN.SIGN_IN_FACEBOOK)}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.LOGIN.NO_ACCOUNT)}</Text>
              <Link href="/register">
                <Text className="ml-2 text-sm text-primary dark:text-primary-dark">{t(TRANSLATION_KEYS.AUTH.LOGIN.CREATE_ACCOUNT)}</Text>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
