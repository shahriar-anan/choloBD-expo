import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

const PILL_HEIGHT = 52;
const FLOAT_GAP = 6;
const SIDE_INSET = 4;

function isHiddenItem(style: StyleProp<ViewStyle> | undefined): boolean {
  const flat = StyleSheet.flatten(style);
  return flat?.display === 'none';
}

function isBarHidden(style: unknown): boolean {
  if (!style || typeof style !== 'object') {
    return false;
  }
  const flat = StyleSheet.flatten(style as StyleProp<ViewStyle>);
  return flat?.display === 'none' || flat?.height === 0;
}

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const focusedOptions = descriptors[state.routes[state.index].key]?.options;
  if (isBarHidden(focusedOptions?.tabBarStyle)) {
    return null;
  }

  const active = focusedOptions?.tabBarActiveTintColor ?? theme.colors.primary;
  const inactive = focusedOptions?.tabBarInactiveTintColor ?? theme.colors.muted;
  const pill = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: SIDE_INSET,
        right: SIDE_INSET,
        bottom: insets.bottom + FLOAT_GAP,
        height: PILL_HEIGHT,
        backgroundColor: 'transparent',
      }}
    >
      <View
        style={{
          height: PILL_HEIGHT,
          borderRadius: PILL_HEIGHT / 2,
          backgroundColor: pill,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? theme.colors['border-dark'] : theme.colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if (isHiddenItem(options.tabBarItemStyle)) {
            return null;
          }
          const focused = state.index === index;
          const color = focused ? active : inactive;
          const label = typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
          const badge = options.tabBarBadge;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? (typeof label === 'string' ? label : route.name)}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: PILL_HEIGHT }}
            >
              <View>
                {options.tabBarIcon?.({ focused, color, size: 20 })}
                {badge != null && badge !== '' ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -10,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      paddingHorizontal: 3,
                      backgroundColor: theme.colors.error,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{badge}</Text>
                  </View>
                ) : null}
              </View>
              {typeof label === 'string' ? (
                <Text style={{ color, fontSize: 11, fontWeight: '500', marginTop: 2 }} numberOfLines={1}>
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
