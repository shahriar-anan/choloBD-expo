import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface MeasurableNode {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
  measureLayout: (
    relativeTo: object,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
    onFail: () => void,
  ) => void;
}

/** Call from a field's onFocus when you want the scroll to happen immediately. */
export const KeyboardFormFocusContext = React.createContext<() => void>(() => {});

function focusedInput(): MeasurableNode | null {
  const state = (TextInput as unknown as {
    State?: { currentlyFocusedInput?: () => MeasurableNode | null };
  }).State;
  const input = state?.currentlyFocusedInput?.();
  if (!input || typeof input.measureInWindow !== 'function' || typeof input.measureLayout !== 'function') {
    return null;
  }
  return input;
}

/**
 * Android `adjustResize` already shrinks the window. Adding the keyboard height
 * again would leave a large empty gap, so only pad when the window did not shrink.
 */
function androidKeyboardPadding(keyboardHeight: number): number {
  const windowHeight = Dimensions.get('window').height;
  const screenHeight = Dimensions.get('screen').height;
  const windowShrunk = screenHeight - windowHeight > keyboardHeight * 0.75;
  return windowShrunk ? 0 : keyboardHeight;
}

interface KeyboardAwareScrollProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
  showsVerticalScrollIndicator?: boolean;
  /** Keep a short form centered until the keyboard opens, then pin it to the top. */
  centerWhenClosed?: boolean;
  keyboardVerticalOffset?: number;
  /** Space kept between the focused field and the keyboard. */
  bottomClearance?: number;
  /**
   * Set false when a parent already applies KeyboardAvoidingView, so this
   * scroll only keeps the focused field in view.
   */
  avoiding?: boolean;
  /** Stretch to the parent. Turn off inside a sheet that should hug its content. */
  fill?: boolean;
  scrollStyle?: StyleProp<ViewStyle>;
}

export const KeyboardAwareScroll = forwardRef<ScrollView, KeyboardAwareScrollProps>(function KeyboardAwareScroll(
  {
    children,
    style,
    className,
    contentContainerStyle,
    keyboardShouldPersistTaps = 'handled',
    keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
    showsVerticalScrollIndicator = true,
    centerWhenClosed = false,
    keyboardVerticalOffset = 0,
    bottomClearance = 64,
    avoiding = true,
    fill = true,
    scrollStyle,
  },
  ref,
) {
  const frameRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardPaddingRef = useRef(0);
  const keyboardTopRef = useRef<number | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocused = useRef<MeasurableNode | null>(null);
  const generation = useRef(0);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const setScrollRef = useCallback((node: ScrollView | null) => {
    scrollRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  const scrollFocusedField = useCallback(() => {
    const scroll = scrollRef.current;
    const frame = frameRef.current;
    const input = focusedInput();
    if (!scroll || !frame || !input) {
      return;
    }
    // Ignore fields that belong to another form. Several of these scrolls can
    // be mounted at once, and the keyboard event is global.
    input.measureLayout(
      frame,
      () => {
        lastFocused.current = input;
        frame.measureInWindow((_frameX, frameY, _frameWidth, frameHeight) => {
          input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
            const frameBottom = frameY + frameHeight - keyboardPaddingRef.current;
            const windowHeight = Dimensions.get('window').height;
            // Sticky bars overlay a frame that still reaches the window. After the
            // frame lifts with the keyboard, that bar is covered, so keep only a small gap.
            const stickyVisible = windowHeight - frameBottom < 96;
            const clearance = stickyVisible ? bottomClearance : 64;
            let limit = frameBottom - clearance;
            const keyboardTop = keyboardTopRef.current;
            if (keyboardTop != null) {
              limit = Math.min(limit, keyboardTop - 64);
            }
            const inputBottom = inputY + inputHeight;
            if (inputBottom > limit + 1) {
              const nextY = Math.max(0, scrollY.current + (inputBottom - limit));
              scrollY.current = nextY;
              scroll.scrollTo({ y: nextY, animated: true });
              return;
            }
            if (inputY < frameY + 12) {
              const nextY = Math.max(0, scrollY.current - (frameY + 12 - inputY));
              scrollY.current = nextY;
              scroll.scrollTo({ y: nextY, animated: true });
            }
          });
        });
      },
      () => {},
    );
  }, [bottomClearance]);

  const scheduleScroll = useCallback((delay: number) => {
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
    }
    const gen = generation.current;
    scrollTimer.current = setTimeout(() => {
      if (gen !== generation.current) {
        return;
      }
      if (Platform.OS === 'android') {
        const height = Keyboard.metrics()?.height ?? 0;
        const extra = height > 0 ? androidKeyboardPadding(height) : 0;
        if (extra !== keyboardPaddingRef.current) {
          keyboardPaddingRef.current = extra;
          setKeyboardPadding(extra);
          scrollTimer.current = setTimeout(() => {
            if (gen === generation.current) {
              scrollFocusedField();
            }
          }, 60);
          return;
        }
      }
      scrollFocusedField();
    }, delay);
  }, [scrollFocusedField]);

  const onFieldFocus = useCallback(() => {
    scheduleScroll(80);
  }, [scheduleScroll]);

  useEffect(() => {
    const hideKeyboard = () => {
      generation.current += 1;
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
        scrollTimer.current = null;
      }
      keyboardPaddingRef.current = 0;
      keyboardTopRef.current = null;
      lastFocused.current = null;
      setKeyboardPadding(0);
      setKeyboardOpen(false);
    };

    const applyKeyboard = (event: KeyboardEvent, shouldScroll: boolean) => {
      const height = event.endCoordinates?.height ?? 0;
      if (height <= 0) {
        hideKeyboard();
        return;
      }
      const input = focusedInput();
      const frame = frameRef.current;
      if (!input || !frame) {
        return;
      }
      const gen = generation.current + 1;
      generation.current = gen;
      input.measureLayout(
        frame,
        () => {
          if (gen !== generation.current) {
            return;
          }
          const extra = Platform.OS === 'android' ? androidKeyboardPadding(height) : 0;
          keyboardPaddingRef.current = extra;
          keyboardTopRef.current = event.endCoordinates.screenY;
          setKeyboardPadding(extra);
          if (shouldScroll) {
            setKeyboardOpen(true);
            scheduleScroll(Platform.OS === 'ios' ? 80 : 240);
          }
        },
        () => {},
      );
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      applyKeyboard(event, Platform.OS !== 'ios');
    });
    const didShowSub = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardDidShow', (event) => applyKeyboard(event, true))
      : null;
    const hideSub = Keyboard.addListener(hideEvent, hideKeyboard);

    return () => {
      showSub.remove();
      didShowSub?.remove();
      hideSub.remove();
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    };
  }, [scheduleScroll]);

  useEffect(() => {
    if (!keyboardOpen) {
      return;
    }
    const watch = setInterval(() => {
      const input = focusedInput();
      if (input && input !== lastFocused.current) {
        scrollFocusedField();
      }
    }, 200);
    return () => clearInterval(watch);
  }, [keyboardOpen, scrollFocusedField]);

  const flatContent = StyleSheet.flatten(contentContainerStyle) ?? {};
  const baseBottom = typeof flatContent.paddingBottom === 'number' ? flatContent.paddingBottom : 0;
  const contentStyle = [
    contentContainerStyle,
    keyboardPadding > 0 ? { paddingBottom: baseBottom + keyboardPadding } : null,
    centerWhenClosed
      ? { flexGrow: 1, justifyContent: keyboardOpen ? 'flex-start' as const : 'center' as const }
      : null,
  ];

  const bounded = fill ? { flex: 1 as const } : undefined;
  const scroller = (
    <View ref={frameRef} collapsable={false} style={bounded}>
      <ScrollView
        ref={setScrollRef}
        className={className}
        style={[bounded, scrollStyle]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={contentStyle}
      >
        {children}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardFormFocusContext.Provider value={onFieldFocus}>
      {avoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={[bounded, style]}
        >
          {scroller}
        </KeyboardAvoidingView>
      ) : (
        <View style={[bounded, style]}>{scroller}</View>
      )}
    </KeyboardFormFocusContext.Provider>
  );
});
