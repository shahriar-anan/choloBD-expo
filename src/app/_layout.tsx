import './globals.css';
import 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../providers/ThemeProvider';
import { LanguageProvider } from '../providers/LanguageProvider';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useAuthInitializer } from '../hooks/state/useAuthInitializer';
import { usePreloadAssets } from '../hooks/usePreloadAssets';
import { API_BASE_URL } from '../constants/api';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { SplashScreen as CustomSplash } from '../components/splash';
import { useState, useEffect } from 'react';

function AppContentStack() {
  return <Stack initialRouteName="index" screenOptions={{ headerShown: false }} />;
}

function AppContentLayout() {
  useAuthInitializer(API_BASE_URL);
  const { isReady: assetsReady } = usePreloadAssets();
  const [splashDone, setSplashDone] = useState(false);
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);

  // Persistent listener: if the axios interceptor logs the user out (expired/invalid
  // tokens) while they are deep in the tabs, redirect them back to login.
  useEffect(() => {
    if (auth.isInitializing) return;
    if (!auth.isAuthenticated && !auth.tokens && splashDone) {
      router.replace('/(auth)/login');
    }
  }, [auth.isAuthenticated, auth.tokens, auth.isInitializing, splashDone]);

  useEffect(() => {
    if (assetsReady && splashDone) {
      // Hide native splash when custom splash is done
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [assetsReady, splashDone]);

  // Show custom splash while preloading
  if (!assetsReady) {
    return (
      <CustomSplash delay={0} /> // Show splash indefinitely until assets ready
    );
  }

  // Show custom splash with fade-out transition
  if (!splashDone) {
    return (
      <CustomSplash
        delay={2500}
        onComplete={() => setSplashDone(true)}
      />
    );
  }

  // App is ready, show main content
  return (
    <SafeAreaProvider>
      <AppContentStack />
    </SafeAreaProvider>
  );
}

function AppContent() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppContentLayout />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </GestureHandlerRootView>
  );
}