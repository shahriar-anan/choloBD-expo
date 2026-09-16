import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import theme from '@/constants/theme';
import { TRANSLATION_KEYS } from '@/constants/translationKeys';

type TaskStatus = 'pending' | 'in-progress' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high';

interface MaintenanceTask {
  id: string;
  roomNumber: string;
  taskType: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate: string;
}

/** Local demo tasks — no maintenance API exists on backend (same as web). */
const SEED_TASKS: MaintenanceTask[] = [
  {
    id: 'maint-001',
    roomNumber: '202',
    taskType: 'HVAC Repair',
    description: 'Air conditioning not cooling properly',
    status: 'in-progress',
    priority: 'high',
    assignedTo: 'Ahmed Hassan',
    dueDate: '2026-02-02',
  },
  {
    id: 'maint-002',
    roomNumber: '103',
    taskType: 'Plumbing',
    description: 'Leaky faucet in bathroom',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-02-03',
  },
  {
    id: 'maint-003',
    roomNumber: '101',
    taskType: 'Electrical',
    description: 'Bedside lamp not working',
    status: 'pending',
    priority: 'low',
    dueDate: '2026-02-04',
  },
  {
    id: 'maint-004',
    roomNumber: '201',
    taskType: 'Furniture Repair',
    description: 'Chair broken in living area',
    status: 'completed',
    priority: 'medium',
    assignedTo: 'Mohammed Ali',
    dueDate: '2026-02-01',
  },
];

function priorityColor(priority: TaskPriority, isDark: boolean) {
  if (priority === 'high') return isDark ? theme.colors['error-dark'] : theme.colors.error;
  if (priority === 'medium') return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  return isDark ? theme.colors['primary-dark'] : theme.colors.primary;
}

function statusColor(status: TaskStatus, isDark: boolean) {
  if (status === 'completed') return isDark ? theme.colors['success-dark'] : theme.colors.success;
  if (status === 'in-progress') return isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  return isDark ? theme.colors['error-dark'] : theme.colors.error;
}

export function MaintenanceTab() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<MaintenanceTask[]>(SEED_TASKS);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((task) => task.status === filter)),
    [tasks, filter]
  );

  const cycleStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const next: TaskStatus =
          task.status === 'pending'
            ? 'in-progress'
            : task.status === 'in-progress'
              ? 'completed'
              : 'pending';
        return { ...task, status: next };
      })
    );
  };

  const filters: Array<{ id: TaskStatus | 'all'; label: string }> = [
    { id: 'all', label: t(TRANSLATION_KEYS.COMPLAINTS.ALL_STATUSES) },
    { id: 'pending', label: t(TRANSLATION_KEYS.MAINTENANCE.PENDING) },
    { id: 'in-progress', label: t(TRANSLATION_KEYS.MAINTENANCE.IN_PROGRESS) },
    { id: 'completed', label: t(TRANSLATION_KEYS.MAINTENANCE.COMPLETED) },
  ];

  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const text = isDark ? theme.colors['text-dark'] : theme.colors.text;

  return (
    <View className="flex-1 px-6 pt-4">
      <View className="p-3 mb-4 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
        <Text className="text-xs font-semibold text-warning dark:text-warning-dark">
          {t(TRANSLATION_KEYS.MAINTENANCE.DEMO_BANNER)}
        </Text>
      </View>

      <Text className="mb-3 text-lg font-semibold text-text dark:text-text-dark">
        {t(TRANSLATION_KEYS.MAINTENANCE.TITLE)}
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: active ? primary : 'transparent',
                borderWidth: 1,
                borderColor: active
                  ? primary
                  : isDark
                    ? theme.colors['border-dark']
                    : theme.colors.border,
              }}
            >
              <Text style={{ color: active ? '#fff' : text, fontSize: 12, fontWeight: '600' }}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const pColor = priorityColor(item.priority, isDark);
          const sColor = statusColor(item.status, isDark);
          return (
            <Pressable
              onPress={() => cycleStatus(item.id)}
              className="p-4 mb-3 border rounded-xl border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-semibold text-text dark:text-text-dark">
                    {item.taskType}
                  </Text>
                  <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                    Room {item.roomNumber}
                    {item.assignedTo ? ` · ${item.assignedTo}` : ''}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: sColor + '22' }}>
                  <Text style={{ color: sColor, fontSize: 11, fontWeight: '700' }}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text className="mb-2 text-sm text-muted dark:text-muted-dark">
                {item.description}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text style={{ color: pColor, fontSize: 11, fontWeight: '700' }}>
                  {item.priority.toUpperCase()}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={isDark ? theme.colors['muted-dark'] : theme.colors.muted}
                  />
                  <Text className="ml-1 text-xs text-muted dark:text-muted-dark">
                    {item.dueDate}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text className="py-8 text-center text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.MAINTENANCE.EMPTY)}
          </Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
