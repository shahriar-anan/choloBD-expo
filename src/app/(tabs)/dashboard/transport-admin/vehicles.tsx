import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScroll } from '../../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../hooks/useTheme';
import theme from '../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';
import { useTransportOperator } from '../../../../hooks/useTransportOperator';
import {
  createTransportClass,
  createTransportVehicle,
  getTransportClasses,
  getTransportVehicles,
  updateTransportClass,
  deleteTransportVehicle,
  updateTransportVehicle,
} from '../../../../services/api/transports';
import { uploadCommunityImageToCloudinary } from '../../../../services/api/cloudinaryUpload';
import { TransportClassRef, TransportVehicle } from '../../../../types/transports';
import { goBack } from '../../../../utilities/navigation';

const RENTAL_CATEGORIES = ['SEDAN', 'SUV', 'HATCHBACK', 'VAN', 'MICROBUS', 'OTHER'] as const;
type FleetFilter = 'all' | 'free' | 'hired' | 'out';
type Editor = { kind: 'add' } | { kind: 'edit'; vehicle: TransportVehicle };

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  SEDAN: 'car-sport-outline',
  SUV: 'car-outline',
  HATCHBACK: 'car-outline',
  VAN: 'bus-outline',
  MICROBUS: 'bus-outline',
  OTHER: 'ellipse-outline',
};

function categoryLabel(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function fleetStatus(vehicle: TransportVehicle): 'out' | 'hired' | 'free' {
  const status = (vehicle.vehicleStatus || '').toUpperCase();
  if (status === 'OUT_OF_SERVICE' || status === 'MAINTENANCE' || vehicle.isActive === false) {
    return 'out';
  }
  if (vehicle.isAvailable === false) return 'hired';
  return 'free';
}

export default function TransportAdminVehiclesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const success = isDark ? theme.colors['success-dark'] : theme.colors.success;
  const warning = isDark ? theme.colors['warning-dark'] : theme.colors.warning;
  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const { transportId, transportType, loading: opLoading } = useTransportOperator(true);

  const [classes, setClasses] = useState<TransportClassRef[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FleetFilter>('all');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [category, setCategory] = useState<string>(RENTAL_CATEGORIES[0]);
  const [dailyRate, setDailyRate] = useState('');
  const [carName, setCarName] = useState('');
  const [plate, setPlate] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'AVAILABLE' | 'OUT_OF_SERVICE'>('AVAILABLE');

  const reload = useCallback(async () => {
    if (!transportId) return;
    const now = new Date();
    const [classRows, vehicleRows] = await Promise.all([
      getTransportClasses(transportId),
      getTransportVehicles({
        transportId,
        checkInDate: now.toISOString(),
        checkOutDate: new Date(now.getTime() + 60 * 1000).toISOString(),
      }),
    ]);
    setClasses(classRows);
    setVehicles(vehicleRows);
  }, [transportId]);

  useFocusEffect(
    useCallback(() => {
      if (!transportId) return;
      setLoading(true);
      reload()
        .catch(() => {
          setClasses([]);
          setVehicles([]);
        })
        .finally(() => setLoading(false));
    }, [transportId, reload])
  );

  const openAdd = () => {
    setCategory(RENTAL_CATEGORIES[0]);
    setDailyRate('');
    setCarName('');
    setPlate('');
    setPhotoUri(null);
    setServiceStatus('AVAILABLE');
    setEditor({ kind: 'add' });
  };

  const openEdit = (vehicle: TransportVehicle) => {
    setCategory(vehicle.transportClass?.vehicleRentalCategory || RENTAL_CATEGORIES[0]);
    setDailyRate(String(vehicle.transportClass?.basePrice ?? ''));
    setCarName(vehicle.name || '');
    setPlate(vehicle.licensePlate || '');
    setPhotoUri(vehicle.imageUrl || null);
    setServiceStatus(fleetStatus(vehicle) === 'out' ? 'OUT_OF_SERVICE' : 'AVAILABLE');
    setEditor({ kind: 'edit', vehicle });
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const resolveImageUrl = async (): Promise<string | null> => {
    if (!photoUri) return null;
    if (photoUri.startsWith('http://') || photoUri.startsWith('https://')) return photoUri;
    return uploadCommunityImageToCloudinary({ uri: photoUri });
  };

  const resolveClassId = async (rate: number): Promise<string> => {
    if (!transportId) throw new Error('Missing company');
    const existing = classes.find(
      (row) => row.vehicleRentalCategory === category && Number(row.basePrice) === rate
    );
    if (existing) return existing.id;
    const created = await createTransportClass({
      transportId,
      name: categoryLabel(category),
      basePrice: rate,
      vehicleRentalCategory: category,
    });
    return created.id;
  };

  const saveCar = async () => {
    if (!transportId || !editor) return;
    const rate = Number(dailyRate);
    if (!carName.trim() || !plate.trim() || !Number.isFinite(rate) || rate <= 0) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FILL_REQUIRED));
      return;
    }
    setBusy(true);
    try {
      const imageUrl = await resolveImageUrl();
      if (editor.kind === 'add') {
        const classId = await resolveClassId(rate);
        await createTransportVehicle({
          transportId,
          transportClassId: classId,
          name: carName.trim(),
          licensePlate: plate.trim(),
          ...(imageUrl ? { imageUrl } : {}),
        });
      } else {
        const vehicle = editor.vehicle;
        const hired = fleetStatus(vehicle) === 'hired';
        const currentCategory = vehicle.transportClass?.vehicleRentalCategory || '';
        const currentRate = Number(vehicle.transportClass?.basePrice ?? 0);
        const classChanged = currentCategory !== category || currentRate !== rate;
        let transportClassId = vehicle.transportClassId;
        if (classChanged) {
          const sharing = vehicles.filter((row) => row.transportClassId === vehicle.transportClassId).length;
          if (sharing <= 1 && vehicle.transportClassId && currentCategory === category) {
            await updateTransportClass(vehicle.transportClassId, {
              basePrice: rate,
              name: categoryLabel(category),
            });
          } else {
            transportClassId = await resolveClassId(rate);
          }
        }
        await updateTransportVehicle(vehicle.id, {
          name: carName.trim(),
          licensePlate: plate.trim(),
          imageUrl,
          transportClassId,
          ...(hired ? {} : { vehicleStatus: serviceStatus }),
        });
      }
      setEditor(null);
      await reload();
    } catch (error: unknown) {
      Alert.alert(
        t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setBusy(false);
    }
  };

  const removeCar = async (vehicleId: string) => {
    setBusy(true);
    try {
      await deleteTransportVehicle(vehicleId);
      setEditor(null);
      await reload();
    } catch (error: unknown) {
      Alert.alert(
        t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteCar = (vehicleId: string) => {
    Alert.alert(t(TRANSLATION_KEYS.COMMON.DELETE), t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DELETE_CAR_CONFIRM), [
      { text: t(TRANSLATION_KEYS.COMMON.CANCEL), style: 'cancel' },
      { text: t(TRANSLATION_KEYS.COMMON.DELETE), style: 'destructive', onPress: () => { void removeCar(vehicleId); } },
    ]);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (filter !== 'all' && fleetStatus(vehicle) !== filter) return false;
      if (!q) return true;
      const categoryName = categoryLabel(vehicle.transportClass?.vehicleRentalCategory || vehicle.transportClass?.name || '');
      return [vehicle.name, vehicle.licensePlate, categoryName].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [vehicles, query, filter]);

  if (opLoading || !transportId || loading) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  if (transportType !== 'CAR_RENTAL') {
    return (
      <SafeAreaView edges={['top']} className="flex-1 px-6 bg-background dark:bg-background-dark">
        <Text className="mt-8 text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.RENTAL_ONLY)}</Text>
      </SafeAreaView>
    );
  }

  const fieldClass =
    'border border-border dark:border-border-dark rounded-2xl px-4 py-3.5 text-base text-text dark:text-text-dark bg-white dark:bg-surface-dark';

  if (editor) {
    const editing = editor.kind === 'edit' ? editor.vehicle : null;
    const hired = editing ? fleetStatus(editing) === 'hired' : false;
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable onPress={() => setEditor(null)} style={{ padding: 6, marginRight: 8 }} accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color={primary} />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-text dark:text-text-dark">
            {editing ? t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CAR_DETAILS) : t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_CAR)}
          </Text>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <KeyboardAwareScroll avoiding={false} className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="mt-2 mb-2 text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CAR_PHOTO)}
          </Text>
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CAR_PHOTO)}
            className="mb-2 overflow-hidden border rounded-2xl border-border dark:border-border-dark bg-white dark:bg-surface-dark"
            style={{ height: 180 }}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View className="items-center justify-center flex-1">
                <Ionicons name="camera-outline" size={28} color={primary} />
                <Text className="mt-2 text-sm font-semibold text-primary dark:text-primary-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_CAR_PHOTO)}
                </Text>
              </View>
            )}
          </Pressable>
          {photoUri ? (
            <View className="flex-row justify-end mb-2" style={{ gap: 16 }}>
              <Pressable onPress={pickPhoto}>
                <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CHANGE_PHOTO)}
                </Text>
              </Pressable>
              <Pressable onPress={() => setPhotoUri(null)}>
                <Text className="text-sm font-semibold text-muted dark:text-muted-dark">
                  {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.REMOVE_PHOTO)}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text className="mt-3 mb-3 text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.RATE_GROUP)}
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {RENTAL_CATEGORIES.map((cat) => {
              const selected = category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`items-center justify-center py-3 mb-2 rounded-2xl border ${selected ? 'bg-primary dark:bg-primary-dark border-primary' : 'bg-white border-border dark:bg-surface-dark dark:border-border-dark'}`}
                  style={{ width: '48%' }}
                >
                  <Ionicons name={CATEGORY_ICON[cat]} size={20} color={selected ? '#fff' : primary} />
                  <Text className={`mt-1 text-xs font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                    {categoryLabel(cat)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mt-5 mb-2 text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CAR_NAME)}
          </Text>
          <TextInput className={fieldClass} placeholderTextColor={muted} value={carName} onChangeText={setCarName} />

          <Text className="mt-4 mb-2 text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.PLATE)}
          </Text>
          <TextInput
            className={fieldClass}
            placeholderTextColor={muted}
            autoCapitalize="characters"
            value={plate}
            onChangeText={setPlate}
          />

          <Text className="mt-4 mb-2 text-sm font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DAILY_RATE)}
          </Text>
          <TextInput
            className={fieldClass}
            placeholderTextColor={muted}
            keyboardType="numeric"
            value={dailyRate}
            onChangeText={setDailyRate}
          />

          {editing ? (
            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
                {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS)}
              </Text>
              {hired ? (
                <View className="p-4 border rounded-2xl border-border dark:border-border-dark bg-white dark:bg-surface-dark">
                  <Text className="text-sm font-semibold" style={{ color: warning }}>
                    {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ON_HIRE)}
                  </Text>
                  <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ON_HIRE_LOCKED)}
                  </Text>
                </View>
              ) : (
                <View className="flex-row" style={{ gap: 10 }}>
                  {([
                    ['AVAILABLE', t(TRANSLATION_KEYS.TRANSPORT.AVAILABLE)],
                    ['OUT_OF_SERVICE', t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.OUT_OF_SERVICE)],
                  ] as const).map(([value, label]) => {
                    const selected = serviceStatus === value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setServiceStatus(value)}
                        className={`flex-1 py-3 rounded-2xl border items-center ${selected ? 'bg-primary dark:bg-primary-dark border-primary' : 'bg-white border-border dark:bg-surface-dark dark:border-border-dark'}`}
                      >
                        <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null}
        </KeyboardAwareScroll>
        <View className="px-5 pt-2 pb-2">
          {editing ? (
            <Pressable
              disabled={busy}
              onPress={() => confirmDeleteCar(editing.id)}
              className="items-center py-3 mb-2"
            >
              <Text className="font-semibold" style={{ color: errorColor }}>
                {t(TRANSLATION_KEYS.COMMON.DELETE)}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            disabled={busy}
            onPress={saveCar}
            className="items-center py-4 rounded-2xl bg-primary dark:bg-primary-dark"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">{t(TRANSLATION_KEYS.COMMON.SAVE)}</Text>
            )}
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const chips: { id: FleetFilter; label: string }[] = [
    { id: 'all', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_ALL) },
    { id: 'free', label: t(TRANSLATION_KEYS.TRANSPORT.AVAILABLE) },
    { id: 'hired', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ON_HIRE) },
    { id: 'out', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.OUT_OF_SERVICE) },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAwareScroll className="flex-1 px-5 pt-3" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => goBack(router)} style={{ padding: 6, marginRight: 8 }} accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color={primary} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FLEET)}
            </Text>
            <Text className="text-sm text-muted dark:text-muted-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.VEHICLES_DESC)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={openAdd}
          accessibilityRole="button"
          accessibilityLabel={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_CAR)}
          className="flex-row items-center justify-center py-4 mb-4 rounded-2xl bg-primary dark:bg-primary-dark"
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text className="ml-2 text-base font-semibold text-white">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_CAR)}
          </Text>
        </Pressable>

        <View className="flex-row items-center px-3 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark">
          <Ionicons name="search" size={18} color={muted} />
          <TextInput
            className="flex-1 py-3 ml-2 text-base text-text dark:text-text-dark"
            placeholder={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SEARCH_CARS)}
            placeholderTextColor={muted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ flexGrow: 0 }}>
          {chips.map((chip) => {
            const selected = filter === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setFilter(chip.id)}
                className={`px-4 py-2 mr-2 rounded-full border ${selected ? 'bg-primary dark:bg-primary-dark border-primary' : 'bg-white border-border dark:bg-surface-dark dark:border-border-dark'}`}
              >
                <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-text dark:text-text-dark'}`}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {visible.length === 0 ? (
          <View className="items-center px-6 py-16">
            <Ionicons name="car-outline" size={36} color={primary} />
            <Text className="mt-4 text-base font-semibold text-center text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.NO_FLEET)}
            </Text>
          </View>
        ) : (
          visible.map((vehicle) => {
            const status = fleetStatus(vehicle);
            const tone = status === 'free' ? success : status === 'hired' ? warning : muted;
            const label = status === 'free'
              ? t(TRANSLATION_KEYS.TRANSPORT.AVAILABLE)
              : status === 'hired'
                ? t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ON_HIRE)
                : t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.OUT_OF_SERVICE);
            const categoryName = categoryLabel(vehicle.transportClass?.vehicleRentalCategory || vehicle.transportClass?.name || '');
            return (
              <View
                key={vehicle.id}
                className="p-4 mb-3 bg-white border rounded-2xl border-border dark:bg-surface-dark dark:border-border-dark"
              >
                <Pressable onPress={() => openEdit(vehicle)} className="flex-row items-center">
                  {vehicle.imageUrl ? (
                    <Image source={{ uri: vehicle.imageUrl }} className="w-14 h-14 mr-3 rounded-2xl" resizeMode="cover" />
                  ) : (
                    <View className="items-center justify-center w-14 h-14 mr-3 rounded-2xl bg-primary/10">
                      <Ionicons name="car-sport" size={22} color={primary} />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-text dark:text-text-dark" numberOfLines={1}>
                      {vehicle.name || categoryName}
                    </Text>
                    <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark" numberOfLines={1}>
                      {[categoryName, vehicle.licensePlate].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={muted} />
                </Pressable>
                <View className="flex-row items-center justify-between mt-3">
                  <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${tone}22` }}>
                    <Text className="text-xs font-semibold" style={{ color: tone }}>{label}</Text>
                  </View>
                  <Text className="text-base font-bold" style={{ color: textColor }}>
                    ৳{vehicle.transportClass?.basePrice ?? 0}
                    <Text className="text-xs font-medium text-muted dark:text-muted-dark"> {t(TRANSLATION_KEYS.TRANSPORT.PER_DAY)}</Text>
                  </Text>
                </View>
                <View className="flex-row mt-3" style={{ gap: 10 }}>
                  <Pressable
                    onPress={() => openEdit(vehicle)}
                    className="items-center flex-1 py-2.5 rounded-xl bg-primary/10"
                  >
                    <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                      {t(TRANSLATION_KEYS.COMMON.EDIT)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDeleteCar(vehicle.id)}
                    disabled={busy}
                    className="items-center flex-1 py-2.5 rounded-xl"
                    style={{ backgroundColor: `${errorColor}18` }}
                  >
                    <Text className="text-sm font-semibold" style={{ color: errorColor }}>
                      {t(TRANSLATION_KEYS.COMMON.DELETE)}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
