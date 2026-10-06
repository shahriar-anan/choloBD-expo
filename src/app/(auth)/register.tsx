import React, { useEffect, useRef } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { clearError, registerUser } from '../../store/slices/authSlice';
import { registerSchema, RegisterForm } from '../../validators/auth';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { resolveRoleHome } from '../../utilities/travelerShell';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useFacebookSignIn } from '../../hooks/useFacebookSignIn';
import { AuthButton } from '../../components/auth/AuthButton';
import { AuthField } from '../../components/auth/AuthField';
import { AuthErrorBanner, AuthScreen, AuthSocialRow, authErrorText } from '../../components/auth/AuthScreen';

export default function Register() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);
  const { t } = useTranslation();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const google = useGoogleSignIn();
  const facebook = useFacebookSignIn();

  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { userName: '', email: '', password: '', confirm: '' },
  });

  const onSubmit = (values: RegisterForm) => {
    if (auth.isLoading) {
      return;
    }
    void dispatch(registerUser({
      email: values.email.trim().toLowerCase(),
      password: values.password,
      userName: values.userName,
      role: 'USER',
    }));
  };

  const edit = (onChange: (value: string) => void) => (value: string) => {
    onChange(value);
    if (auth.error) {
      dispatch(clearError());
    }
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
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    <AuthScreen
      title={t(TRANSLATION_KEYS.AUTH.REGISTER.CREATE_ACCOUNT)}
      subtitle={t(TRANSLATION_KEYS.AUTH.REGISTER.SUBTITLE)}
      footer={(
        <>
          <AuthSocialRow
            googleReady={google.isReady}
            facebookReady={facebook.isReady}
            googleLoading={google.isLoading}
            facebookLoading={facebook.isLoading}
            onGoogle={() => { void google.signInWithGoogle(); }}
            onFacebook={() => { void facebook.signInWithFacebook(); }}
            googleLabel={t(TRANSLATION_KEYS.AUTH.REGISTER.SIGN_UP_GOOGLE)}
            facebookLabel={t(TRANSLATION_KEYS.AUTH.REGISTER.SIGN_UP_FACEBOOK)}
            dividerLabel={t(TRANSLATION_KEYS.AUTH.REGISTER.OR_SIGN_UP_WITH)}
          />
          <View className="mt-4 flex-row flex-wrap items-center justify-center">
            <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.ALREADY_ACCOUNT)}</Text>
            <Link href="/login" asChild>
              <TouchableOpacity accessibilityRole="link" className="ml-2 min-h-12 justify-center">
                <Text className="text-sm text-primary dark:text-primary-dark">{t(TRANSLATION_KEYS.AUTH.REGISTER.SIGN_IN)}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </>
      )}
    >
      <Controller
        control={control}
        name="userName"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <AuthField
            label={t(TRANSLATION_KEYS.AUTH.REGISTER.USERNAME_LABEL)}
            value={value}
            onChangeText={edit(onChange)}
            onBlur={onBlur}
            error={error?.message ? t(error.message) : undefined}
            placeholder={t(TRANSLATION_KEYS.AUTH.REGISTER.USERNAME_PLACEHOLDER)}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <AuthField
            ref={emailRef}
            label={t(TRANSLATION_KEYS.AUTH.REGISTER.EMAIL_LABEL)}
            value={value}
            onChangeText={edit(onChange)}
            onBlur={onBlur}
            error={error?.message ? t(error.message) : undefined}
            placeholder={t(TRANSLATION_KEYS.AUTH.REGISTER.EMAIL_PLACEHOLDER)}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <AuthField
            ref={passwordRef}
            label={t(TRANSLATION_KEYS.AUTH.REGISTER.PASSWORD_LABEL)}
            value={value}
            onChangeText={edit(onChange)}
            onBlur={onBlur}
            error={error?.message ? t(error.message) : undefined}
            hint={t(TRANSLATION_KEYS.AUTH.PASSWORD_HINT)}
            placeholder={t(TRANSLATION_KEYS.AUTH.REGISTER.PASSWORD_PLACEHOLDER)}
            secure
            showPasswordLabel={t(TRANSLATION_KEYS.AUTH.SHOW_PASSWORD)}
            hidePasswordLabel={t(TRANSLATION_KEYS.AUTH.HIDE_PASSWORD)}
            autoComplete="password-new"
            textContentType="newPassword"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="confirm"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <AuthField
            ref={confirmRef}
            label={t(TRANSLATION_KEYS.AUTH.REGISTER.CONFIRM_PASSWORD_LABEL)}
            value={value}
            onChangeText={edit(onChange)}
            onBlur={onBlur}
            error={error?.message ? t(error.message) : undefined}
            placeholder={t(TRANSLATION_KEYS.AUTH.REGISTER.CONFIRM_PLACEHOLDER)}
            secure
            showPasswordLabel={t(TRANSLATION_KEYS.AUTH.SHOW_PASSWORD)}
            hidePasswordLabel={t(TRANSLATION_KEYS.AUTH.HIDE_PASSWORD)}
            autoComplete="password-new"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />
      <AuthButton
        label={t(TRANSLATION_KEYS.AUTH.REGISTER.CREATE_BTN)}
        loadingLabel={t(TRANSLATION_KEYS.AUTH.REGISTER.CREATING)}
        loading={auth.isLoading}
        onPress={handleSubmit(onSubmit)}
      />
      {auth.error ? (
        <AuthErrorBanner
          message={authErrorText(auth.error, t, TRANSLATION_KEYS.AUTH.REGISTER.FAILED)}
          dismissLabel={t(TRANSLATION_KEYS.AUTH.DISMISS_ERROR)}
          onDismiss={() => dispatch(clearError())}
        />
      ) : null}
    </AuthScreen>
  );
}
