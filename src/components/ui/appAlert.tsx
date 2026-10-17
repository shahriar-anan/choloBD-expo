import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import theme from '../../constants/theme';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { useTheme } from '../../hooks/useTheme';

export type AlertTone = 'success' | 'error' | 'warning' | 'info';
export type AlertActionTone = 'primary' | 'danger' | 'ghost';

export interface AlertAction {
  label: string;
  tone?: AlertActionTone;
  onPress?: () => void;
}

export interface ShowAlertInput {
  tone?: AlertTone;
  title: string;
  message?: string;
  detail?: string;
  detailLabel?: string;
  footnote?: string;
  actions?: AlertAction[];
}

interface LegacyAlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertRequest extends ShowAlertInput {
  id: number;
  tone: AlertTone;
  actions: AlertAction[];
  resolve: (index: number | null) => void;
}

const TONE_ICON = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'alert-circle',
  info: 'information-circle',
} as const;

let nextId = 1;
let queue: AlertRequest[] = [];
const listeners = new Set<(items: AlertRequest[]) => void>();

function emit(): void {
  const snapshot = queue.slice();
  listeners.forEach((listener) => listener(snapshot));
}

function subscribeAlerts(listener: (items: AlertRequest[]) => void): () => void {
  listeners.add(listener);
  listener(queue.slice());
  return () => {
    listeners.delete(listener);
  };
}

function enqueue(request: Omit<AlertRequest, 'id' | 'resolve'>): Promise<number | null> {
  return new Promise((resolve) => {
    queue = [...queue, { ...request, id: nextId, resolve }];
    nextId += 1;
    emit();
  });
}

function settleAlert(id: number, index: number | null): void {
  const request = queue.find((item) => item.id === id);
  if (!request) return;
  queue = queue.filter((item) => item.id !== id);
  emit();
  request.resolve(index);
}

function mapLegacyButton(button: LegacyAlertButton): AlertAction {
  const tone: AlertActionTone = button.style === 'destructive'
    ? 'danger'
    : button.style === 'cancel'
      ? 'ghost'
      : 'primary';
  return { label: button.text ?? '', tone, onPress: button.onPress };
}

function dismissActionIndex(actions: AlertAction[]): number | null {
  if (actions.length <= 1) return 0;
  const cancelIndex = actions.findIndex((action) => action.tone === 'ghost');
  return cancelIndex >= 0 ? cancelIndex : null;
}

export function showAlert(options: ShowAlertInput): Promise<number | null> {
  const actions = options.actions?.length
    ? options.actions
    : [{ label: '', tone: 'primary' as const }];
  return enqueue({
    tone: options.tone ?? 'info',
    title: options.title,
    message: options.message,
    detail: options.detail,
    detailLabel: options.detailLabel,
    footnote: options.footnote,
    actions,
  });
}

export function appAlert(
  titleOrOptions: string | ShowAlertInput,
  message?: string,
  buttons?: LegacyAlertButton[],
  tone?: AlertTone,
): Promise<number | null> {
  if (typeof titleOrOptions !== 'string') {
    return showAlert(titleOrOptions);
  }
  const actions = (buttons?.length ? buttons : [{ text: '' }]).map(mapLegacyButton);
  const derivedTone = tone ?? (actions.some((action) => action.tone === 'danger') ? 'warning' : 'info');
  return enqueue({
    tone: derivedTone,
    title: titleOrOptions,
    message,
    actions,
  });
}

interface AppAlertProps {
  visible: boolean;
  tone?: AlertTone;
  title: string;
  message?: string;
  detail?: string;
  detailLabel?: string;
  footnote?: string;
  actions: AlertAction[];
  onDismiss: () => void;
  onAction: (index: number) => void;
}

export function AppAlert({
  visible,
  tone = 'info',
  title,
  message,
  detail,
  detailLabel,
  footnote,
  actions,
  onDismiss,
  onAction,
}: AppAlertProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  if (!visible) return null;

  const surface = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const border = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const danger = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const success = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const toneColor = { success, error: danger, warning, info: primary }[tone];
  const body = message?.trim();
  const code = detail?.trim();
  const note = footnote?.trim();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.COMMON.CLOSE)}
          onPress={onDismiss}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
        <View
          accessibilityRole="alert"
          style={[
            styles.card,
            theme.elevation.md,
            { backgroundColor: surface, maxHeight: height * 0.85 },
          ]}
        >
          <ScrollView bounces={false} contentContainerStyle={styles.body}>
            <View style={[styles.iconWrap, { backgroundColor: `${toneColor}1F` }]}>
              <Ionicons name={TONE_ICON[tone]} size={32} color={toneColor} />
            </View>
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            {body ? <Text style={[styles.message, { color: muted }]}>{body}</Text> : null}
            {code ? (
              <View style={styles.detail}>
                {detailLabel ? <Text style={[styles.detailLabel, { color: muted }]}>{detailLabel}</Text> : null}
                <View style={[styles.detailChip, { backgroundColor: `${primary}15`, borderColor: `${primary}40` }]}>
                  <Text style={[styles.detailValue, { color: primary }]}>{code}</Text>
                </View>
              </View>
            ) : null}
            {note ? (
              <View style={[styles.footnote, { borderColor: `${muted}33`, backgroundColor: `${muted}14` }]}>
                <Text style={[styles.footnoteText, { color: muted }]}>{note}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            {actions.map((action, index) => {
              const actionTone = action.tone ?? 'primary';
              const backgroundColor = actionTone === 'danger'
                ? danger
                : actionTone === 'ghost'
                  ? 'transparent'
                  : primary;
              const labelColor = actionTone === 'ghost' ? textColor : '#FFFFFF';
              return (
                <Pressable
                  key={`${action.label}-${index}`}
                  accessibilityRole="button"
                  onPress={() => onAction(index)}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor,
                      borderColor: border,
                      borderWidth: actionTone === 'ghost' ? 1 : 0,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.buttonLabel, { color: labelColor }]}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function AlertHost() {
  const { t } = useTranslation();
  const [items, setItems] = useState<AlertRequest[]>([]);

  useEffect(() => subscribeAlerts(setItems), []);

  const current = items[0];
  if (!current) return null;

  const actions = current.actions.map((action) => ({
    ...action,
    label: action.label || t(TRANSLATION_KEYS.COMMON.OK),
  }));

  const finish = (index: number | null) => {
    const action = index === null ? undefined : current.actions[index];
    settleAlert(current.id, index);
    action?.onPress?.();
  };

  return (
    <AppAlert
      visible
      tone={current.tone}
      title={current.title}
      message={current.message}
      detail={current.detail}
      detailLabel={current.detailLabel}
      footnote={current.footnote}
      actions={actions}
      onDismiss={() => finish(dismissActionIndex(actions))}
      onAction={(index) => finish(index)}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  detail: {
    marginTop: 16,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  detailChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  footnote: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  footnoteText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});
