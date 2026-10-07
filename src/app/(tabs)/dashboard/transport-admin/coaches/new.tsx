import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScroll } from '../../../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../hooks/useTheme';
import theme from '../../../../../constants/theme';
import { TRANSLATION_KEYS } from '../../../../../constants/translationKeys';
import { useTransportOperator } from '../../../../../hooks/useTransportOperator';
import { fetchLocations } from '../../../../../services/api/locations';
import { SearchableLocationInput } from '../../../../../components/ui/SearchableLocationInput';
import { CoachCabinMap } from '../../../../../components/transportOperator/CoachCabinMap';
import { CoachDateTimeField } from '../../../../../components/transportOperator/CoachDateTimeField';
import { uploadCommunityImageToCloudinary } from '../../../../../services/api/cloudinaryUpload';
import {
  addTransportRouteStop,
  createTransportClass,
  createTransportLayout,
  createTransportRoute,
  createTransportTrip,
  updateTransportLayout,
} from '../../../../../services/api/transports';
import { Location } from '../../../../../types/locations';
import {
  COACH_BUS_TYPES,
  CoachBusType,
  planCoachSeats,
  previewCoachSeats,
  tomorrowAt,
} from '../../../../../utilities/coachOperator';
import { goBack } from '../../../../../utilities/navigation';

type WizardStep = 'coach' | 'route' | 'time';

const TYPE_KEY: Record<CoachBusType, string> = {
  AC_SEATER: TRANSLATION_KEYS.TRANSPORT_OPERATOR.AC_SEATER,
  NON_AC_SEATER: TRANSLATION_KEYS.TRANSPORT_OPERATOR.NON_AC_SEATER,
  AC_SLEEPER: TRANSLATION_KEYS.TRANSPORT_OPERATOR.AC_SLEEPER,
  NON_AC_SLEEPER: TRANSLATION_KEYS.TRANSPORT_OPERATOR.NON_AC_SLEEPER,
};

export default function TransportAdminCoachWizardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const primary = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const muted = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const { transportId, transportType, loading: opLoading } = useTransportOperator(true);

  const [step, setStep] = useState<WizardStep>('coach');
  const [busy, setBusy] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  const [className, setClassName] = useState('');
  const [classPrice, setClassPrice] = useState('');
  const [busServiceType, setBusServiceType] = useState<CoachBusType>(COACH_BUS_TYPES[1]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [layoutId, setLayoutId] = useState('');
  const [photoSaved, setPhotoSaved] = useState(false);

  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [boardingName, setBoardingName] = useState('');
  const [droppingName, setDroppingName] = useState('');
  const [routeId, setRouteId] = useState('');

  const [departureAt, setDepartureAt] = useState(() => tomorrowAt(8));
  const [arrivalAt, setArrivalAt] = useState(() => tomorrowAt(14));
  const [coachLabel, setCoachLabel] = useState('');

  const cabin = isDark ? '#23252D' : '#F3F4F6';
  const soldFill = isDark ? '#4B5563' : '#D1D5DB';
  const availableFill = isDark ? '#18191E' : '#FFFFFF';
  const ink = isDark ? '#F9FAFB' : '#111827';

  useEffect(() => {
    setLocationsLoading(true);
    fetchLocations()
      .then(setLocations)
      .catch(() => setLocations([]))
      .finally(() => setLocationsLoading(false));
  }, []);

  const districts = locations.filter((row) => String(row.locationType || '').toUpperCase() === 'DISTRICT');

  const notifyFail = (error: unknown) => {
    Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FAILED), error instanceof Error ? error.message : undefined);
  };

  const inputClass =
    'border border-border dark:border-border-dark rounded-lg px-3 py-3 text-text dark:text-text-dark mb-3';

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoSaved(false);
    }
  };

  const attachPhoto = async (id: string) => {
    if (!photoUri || photoSaved) return;
    const imageUrl = await uploadCommunityImageToCloudinary({ uri: photoUri });
    await updateTransportLayout(id, { imageUrl });
    setPhotoSaved(true);
  };

  const saveCoach = async () => {
    if (layoutId) {
      setBusy(true);
      try {
        await attachPhoto(layoutId);
      } catch (error: unknown) {
        notifyFail(error);
      } finally {
        setBusy(false);
        setStep('route');
      }
      return;
    }
    const price = Number(classPrice);
    if (!transportId || !className.trim() || !(price > 0)) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FILL_REQUIRED));
      return;
    }
    setBusy(true);
    try {
      const createdClass = await createTransportClass({
        transportId,
        name: className.trim(),
        basePrice: price,
        busServiceType,
      });
      const createdLayout = await createTransportLayout({
        transportId,
        name: className.trim(),
        compartmentName: 'Coach',
        seats: planCoachSeats(busServiceType, createdClass.id),
      });
      setLayoutId(createdLayout.id);
      if (photoUri) {
        try {
          await attachPhoto(createdLayout.id);
        } catch (error: unknown) {
          notifyFail(error);
        }
      }
      setStep('route');
    } catch (error: unknown) {
      notifyFail(error);
    } finally {
      setBusy(false);
    }
  };

  const saveRoute = async () => {
    if (routeId) {
      setStep('time');
      return;
    }
    if (!transportId || !originId || !destinationId || !boardingName.trim() || !droppingName.trim()) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FILL_REQUIRED));
      return;
    }
    if (originId === destinationId) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SAME_PLACES));
      return;
    }
    setBusy(true);
    try {
      const createdRoute = await createTransportRoute({
        transportId,
        originLocationId: originId,
        destinationLocationId: destinationId,
      });
      await addTransportRouteStop(createdRoute.id, {
        locationId: originId,
        name: boardingName.trim(),
        stopOrder: 1,
        arrivalOffsetMinutes: 0,
      });
      await addTransportRouteStop(createdRoute.id, {
        locationId: destinationId,
        name: droppingName.trim(),
        stopOrder: 2,
        arrivalOffsetMinutes: 60,
      });
      setRouteId(createdRoute.id);
      setStep('time');
    } catch (error: unknown) {
      notifyFail(error);
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!transportId || !layoutId || !routeId) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FILL_REQUIRED));
      return;
    }
    if (!(departureAt < arrivalAt)) {
      Alert.alert(t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ARRIVAL_AFTER));
      return;
    }
    setBusy(true);
    try {
      await createTransportTrip({
        transportId,
        transportRouteId: routeId,
        layoutId,
        departureDateTime: departureAt.toISOString(),
        arrivalDateTime: arrivalAt.toISOString(),
        coachLabel: coachLabel.trim() || undefined,
      });
      router.replace(`/(tabs)/dashboard/transport-admin/coaches/${layoutId}`);
    } catch (error: unknown) {
      notifyFail(error);
    } finally {
      setBusy(false);
    }
  };

  const mapCopy = {
    gateLabel: t(TRANSLATION_KEYS.TRANSPORT.BUS_GATE),
    wheelLabel: t(TRANSLATION_KEYS.TRANSPORT.BUS_WHEEL),
    windowLabel: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.WINDOW),
    aisleLabel: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.AISLE),
    muted,
    ink,
    soldFill,
    availableFill,
    cabin,
  };

  if (opLoading || !transportId) {
    return (
      <SafeAreaView className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  if (transportType !== 'BUS') {
    return (
      <SafeAreaView edges={['top']} className="flex-1 px-6 bg-background dark:bg-background-dark">
        <Text className="mt-8 text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.BUS_ONLY)}</Text>
      </SafeAreaView>
    );
  }

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'coach', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STEP_COACH) },
    { id: 'route', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STEP_ROUTE) },
    { id: 'time', label: t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STEP_TIME) },
  ];
  const hint =
    step === 'coach'
      ? t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.COACH_HINT)
      : step === 'route'
        ? t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ROUTE_HINT)
        : t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.TIME_HINT);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-6 pt-4">
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => goBack(router)} style={{ padding: 6, marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color={primary} />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ADD_COACH)}
          </Text>
        </View>
        <View className="flex-row mb-3" style={{ gap: 8 }}>
          {steps.map((item) => {
            const active = step === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (item.id === 'route' && !layoutId) return;
                  if (item.id === 'time' && !routeId) return;
                  setStep(item.id);
                }}
                className="flex-1"
              >
                <Text
                  className={`text-xs text-center ${active ? 'font-semibold text-primary dark:text-primary-dark' : 'text-muted dark:text-muted-dark'}`}
                >
                  {item.label}
                </Text>
                <View className={`h-1 mt-2 rounded-full ${active ? 'bg-primary dark:bg-primary-dark' : 'bg-border dark:bg-border-dark'}`} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <KeyboardAwareScroll className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-4 text-sm text-muted dark:text-muted-dark">{hint}</Text>

        {step === 'coach' ? (
          <View>
            <Pressable onPress={pickPhoto} className="items-center justify-center h-36 mb-3 border rounded-2xl border-border dark:border-border-dark">
              {photoUri ? (
                <Image source={{ uri: photoUri }} className="w-full h-full rounded-2xl" resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color={muted} />
                  <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
                    {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.COACH_PHOTO)}
                  </Text>
                </>
              )}
            </Pressable>
            <TextInput
              className={inputClass}
              placeholder={t(TYPE_KEY[busServiceType])}
              placeholderTextColor={muted}
              value={className}
              onChangeText={setClassName}
            />
            <View className="flex-row flex-wrap mb-3">
              {COACH_BUS_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setBusServiceType(type)}
                  className={`px-3 py-2 mr-2 mb-2 rounded-full border ${busServiceType === type ? 'border-primary bg-primary/15' : 'border-border dark:border-border-dark'}`}
                >
                  <Text className="text-sm text-text dark:text-text-dark">{t(TYPE_KEY[type])}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="mb-1 text-sm font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.FARE)}
            </Text>
            <TextInput
              className={inputClass}
              placeholder="৳"
              placeholderTextColor={muted}
              keyboardType="numeric"
              value={classPrice}
              onChangeText={setClassPrice}
            />
            <Text className="mb-2 text-sm font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.SEAT_PLAN)}
            </Text>
            <CoachCabinMap seats={previewCoachSeats(busServiceType)} showAvailability={false} {...mapCopy} />
            <Pressable
              disabled={busy}
              onPress={saveCoach}
              className="items-center py-3 rounded-xl bg-primary dark:bg-primary-dark"
            >
              <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CONTINUE)}</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 'route' ? (
          <View>
            <SearchableLocationInput
              label={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ORIGIN)}
              locations={districts}
              loadingLocations={locationsLoading}
              selectedLocationId={originId}
              onLocationSelect={setOriginId}
            />
            <SearchableLocationInput
              label={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DESTINATION)}
              locations={districts}
              loadingLocations={locationsLoading}
              selectedLocationId={destinationId}
              onLocationSelect={setDestinationId}
            />
            <TextInput
              className={inputClass}
              placeholder={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.BOARDING_COUNTER)}
              placeholderTextColor={muted}
              value={boardingName}
              onChangeText={setBoardingName}
            />
            <TextInput
              className={inputClass}
              placeholder={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DROPPING_COUNTER)}
              placeholderTextColor={muted}
              value={droppingName}
              onChangeText={setDroppingName}
            />
            <View className="flex-row" style={{ gap: 8 }}>
              <Pressable onPress={() => setStep('coach')} className="items-center flex-1 py-3 border rounded-xl border-border dark:border-border-dark">
                <Text className="font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.BACK)}</Text>
              </Pressable>
              <Pressable disabled={busy} onPress={saveRoute} className="items-center flex-1 py-3 rounded-xl bg-primary dark:bg-primary-dark">
                <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.CONTINUE)}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 'time' ? (
          <View>
            <CoachDateTimeField label={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.DEPARTURE)} value={departureAt} onChange={setDepartureAt} />
            <CoachDateTimeField label={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.ARRIVAL)} value={arrivalAt} onChange={setArrivalAt} />
            <TextInput
              className={inputClass}
              placeholder={t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.STEP_COACH)}
              placeholderTextColor={muted}
              value={coachLabel}
              onChangeText={setCoachLabel}
            />
            <View className="flex-row" style={{ gap: 8 }}>
              <Pressable onPress={() => setStep('route')} className="items-center flex-1 py-3 border rounded-xl border-border dark:border-border-dark">
                <Text className="font-semibold text-text dark:text-text-dark">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.BACK)}</Text>
              </Pressable>
              <Pressable disabled={busy} onPress={publish} className="items-center flex-1 py-3 rounded-xl bg-primary dark:bg-primary-dark">
                <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TRANSPORT_OPERATOR.PUBLISH)}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
