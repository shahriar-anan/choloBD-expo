import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Text, TouchableOpacity, View } from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  placement?: 'top' | 'bottom';
  /** Space between a bottom toast and the screen edge, so it clears a footer. */
  bottomOffset?: number;
}

export function Toast({
  visible,
  message,
  onDismiss,
  duration = 3000,
  actionLabel,
  onAction,
  placement = 'top',
  bottomOffset = 24,
}: ToastProps) {
  const hidden = placement === 'top' ? -88 : 88;
  const translate = useRef(new Animated.Value(hidden)).current;
  const [mounted, setMounted] = useState(visible);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!visible) {
      Animated.timing(translate, { toValue: hidden, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
      return;
    }
    setMounted(true);
    Animated.timing(translate, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => dismissRef.current(), duration);
    return () => clearTimeout(timer);
  }, [visible, duration, message, hidden, translate]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8 || Math.abs(gesture.dx) > 12,
      onPanResponderMove: (_, gesture) => {
        translate.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dy) > 28 || Math.abs(gesture.dx) > 48) {
          dismissRef.current();
          return;
        }
        Animated.spring(translate, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Animated.View
      {...pan.panHandlers}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        top: placement === 'top' ? 12 : undefined,
        bottom: placement === 'bottom' ? bottomOffset : undefined,
        zIndex: 40,
        transform: [{ translateY: translate }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => dismissRef.current()}
        className="rounded-2xl bg-text px-4 py-3 flex-row items-center"
        style={{ minHeight: 48 }}
      >
        <Text className="text-background flex-1 text-sm font-semibold">{message}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity
            onPress={onAction}
            accessibilityRole="button"
            className="ml-3 px-2 py-2"
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text className="text-background text-sm font-bold">{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}
