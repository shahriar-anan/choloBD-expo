import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

const APP_ICON = require('../../../assets/app-icon.png');

/** Time the mark stays on screen before the exit fade. */
const HOLD_MS = 1500;
const EXIT_MS = 380;

interface SplashScreenProps {
  onComplete?: () => void;
}

/**
 * Branded launch screen. The native splash stays up until this view has
 * painted, then the app icon springs in and the screen fades out.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const started = useRef(false);
  const cancelled = useRef(false);
  const finished = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const screenOpacity = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.72);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslate = useSharedValue(10);

  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (exitTimer.current) {
        clearTimeout(exitTimer.current);
      }
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
      }
    };
  }, []);

  const finish = () => {
    if (cancelled.current || finished.current) {
      return;
    }
    finished.current = true;
    onCompleteRef.current?.();
  };

  const play = (reduceMotion: boolean) => {
    if (cancelled.current) {
      return;
    }
    if (reduceMotion) {
      taglineTranslate.value = 0;
      taglineOpacity.value = withTiming(1, { duration: 180 });
    } else {
      // Icon is already on screen (matching the native splash). Pop and settle
      // so the handoff is not a blank frame.
      iconScale.value = withSequence(
        withTiming(1.08, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 12, stiffness: 140, mass: 0.8 }),
      );
      ringOpacity.value = withSequence(
        withTiming(0.45, { duration: 180 }),
        withTiming(0, { duration: 720, easing: Easing.out(Easing.cubic) }),
      );
      ringScale.value = withTiming(1.65, { duration: 900, easing: Easing.out(Easing.cubic) });
      taglineOpacity.value = withDelay(280, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
      taglineTranslate.value = withDelay(280, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
    }

    const hold = reduceMotion ? 700 : HOLD_MS;
    exitTimer.current = setTimeout(() => {
      if (cancelled.current) {
        return;
      }
      screenOpacity.value = withTiming(0, { duration: EXIT_MS, easing: Easing.inOut(Easing.cubic) }, (completed) => {
        if (completed) {
          runOnJS(finish)();
        }
      });
      if (!reduceMotion) {
        iconScale.value = withTiming(1.04, { duration: EXIT_MS, easing: Easing.inOut(Easing.cubic) });
      }
    }, hold);
    fallbackTimer.current = setTimeout(finish, hold + EXIT_MS + 80);
  };

  const onLayout = () => {
    if (started.current) {
      return;
    }
    started.current = true;
    // Drop the static native splash only after this frame exists, so the
    // icon animation is what the user actually sees.
    void ExpoSplashScreen.hideAsync().catch(() => {});
    AccessibilityInfo.isReduceMotionEnabled().then(play).catch(() => play(false));
  };

  const backgroundColor = isDark ? theme.colors['background-dark'] : theme.colors.background;
  const taglineColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const ringColor = isDark ? 'rgba(94, 234, 212, 0.35)' : 'rgba(15, 118, 110, 0.28)';

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslate.value }],
  }));

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.container, screenStyle, { backgroundColor }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.mark}>
        <Animated.View style={[styles.ring, ringStyle, { backgroundColor: ringColor }]} />
        <Animated.View style={iconStyle}>
          <Image source={APP_ICON} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        </Animated.View>
      </View>
      <Animated.View style={[styles.bottomSection, taglineStyle, { bottom: Math.max(insets.bottom, 16) + 28 }]}>
        <Text style={[styles.tagline, { color: taglineColor }]}>
          {t(TRANSLATION_KEYS.SPLASH.TAGLINE)}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mark: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
  },
  logo: {
    width: 132,
    height: 132,
  },
  bottomSection: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 24,
  },
});

export default SplashScreen;
