import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, Modal, Alert, Image } from 'react-native';
import { KeyboardAwareScroll } from '../../../components/ui/KeyboardAwareScroll';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { roleHome } from '../../../utilities/travelerShell';
import { Ionicons } from '@expo/vector-icons';
import { useBookingLogic } from '../../../hooks/useBookingLogic';
import { useTheme } from '../../../hooks/useTheme';
import theme from '../../../constants/theme';
import { HotelBookingForm } from '../../../components/forms/hotelBookingForm';
import { PaymentStatusBadge } from '../../../components/ui/PaymentStatusBadge';
import { CancellationEligibilityPreview } from '../../../components/booking/CancellationEligibilityPreview';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { CancellationEligibility } from '../../../types/cancellation';
import { shouldFetchCancellationEligibility, getCancelActionLabel } from '../../../utilities/bookingCancelHelpers';
import { HotelStayDesk } from '../../../components/hotel/HotelStayDesk';

function formatStayDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function money(amount: unknown): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  return `₹${amount}`;
}

export default function BookingTrackingPage() {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string | undefined;
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCheckInDate, setEditCheckInDate] = useState('');
  const [editCheckOutDate, setEditCheckOutDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editSpecialRequests, setEditSpecialRequests] = useState('');
  const [eligibility, setEligibility] = useState<CancellationEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [actionBarHeight, setActionBarHeight] = useState(160);

  const { fetchBookingDetails, editBooking, submitting, loadEligibility, cancelBooking } = useBookingLogic();

  useEffect(() => {
    if (!bookingId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchBookingDetails(bookingId);
        setBooking(res ?? null);
        if (res) {
          // Prefill edit form fields
          setEditCheckInDate(res.checkInDate?.split('T')[0] || '');
          setEditCheckOutDate(res.checkOutDate?.split('T')[0] || '');
          setEditPaymentMethod(res.paymentMethod || '');
          setEditSpecialRequests(res.specialRequests || '');
        }
      } catch (e) {
        console.error('[BookingTrackingPage] error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId, fetchBookingDetails]);

  useEffect(() => {
    if (!bookingId || !booking || !shouldFetchCancellationEligibility(booking.status)) {
      setEligibility(null);
      return;
    }
    let cancelled = false;
    const loadEligibilityData = async () => {
      setEligibilityLoading(true);
      const result = await loadEligibility(bookingId);
      if (!cancelled) {
        setEligibility(result);
        setEligibilityLoading(false);
      }
    };
    loadEligibilityData();
    return () => {
      cancelled = true;
    };
  }, [bookingId, booking?.status, booking?.id, loadEligibility]);

  const startEdit = () => {
    if (booking?.status === 'CONFIRMED' || booking?.status === 'CANCELLED') {
      alert('Cannot edit ' + booking.status.toLowerCase() + ' bookings');
      return;
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!bookingId) return;
    const result = await editBooking(
      bookingId,
      {
        checkInDate: editCheckInDate,
        checkOutDate: editCheckOutDate,
        paymentMethod: editPaymentMethod,
        specialRequests: editSpecialRequests,
      },
      () => {
        // Reload booking after successful edit
        setIsEditing(false);
        fetchBookingDetails(bookingId).then(res => setBooking(res ?? null));
      }
    );
    return result;
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Reset form fields
    if (booking) {
      setEditCheckInDate(booking.checkInDate?.split('T')[0] || '');
      setEditCheckOutDate(booking.checkOutDate?.split('T')[0] || '');
      setEditPaymentMethod(booking.paymentMethod || '');
      setEditSpecialRequests(booking.specialRequests || '');
    }
  };

  const errorColor = isDark ? theme.colors['error-dark'] : theme.colors.error;
  const surfaceColor = isDark ? theme.colors['surface-dark'] : theme.colors.surface;
  const borderColor = isDark ? theme.colors['border-dark'] : theme.colors.border;
  const textColor = isDark ? theme.colors['text-dark'] : theme.colors.text;
  const mutedColor = isDark ? theme.colors['muted-dark'] : theme.colors.muted;
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;

  const handleCancelPress = () => {
    if (!eligibility?.canCancel) {
      Alert.alert(
        t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANNOT_CANCEL),
        eligibility?.reason || t(TRANSLATION_KEYS.PACKAGE_BOOKING.CANNOT_CANCEL_DESC)
      );
      return;
    }
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingId) return;
    setCancelSubmitting(true);
    await cancelBooking(bookingId, () => {
      setShowCancelModal(false);
      fetchBookingDetails(bookingId).then((res) => {
        setBooking(res ?? null);
        setEligibility(null);
      });
    });
    setCancelSubmitting(false);
  };

  const showCancelSection =
    booking && shouldFetchCancellationEligibility(booking.status);
  const canEdit = booking && booking.status !== 'CONFIRMED' && booking.status !== 'CANCELLED';
  const coverUrl = booking?.hotel?.images?.[0]?.url as string | undefined;
  const hotelName = booking?.hotel?.name || t(TRANSLATION_KEYS.BOOKING.HOTEL_NAME);
  const city = booking?.hotel?.location?.city || booking?.hotel?.location?.name || '';
  const leaveDetail = () => {
    if (isEditing) {
      cancelEdit();
      return;
    }
    const operator = role === 'SERVICE_ADMIN' || role === 'EMPLOYEE';
    if (!loading && !booking && operator) {
      router.replace('/(tabs)/dashboard');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(roleHome(role));
  };

  const cancelModal = (
    <Modal
      visible={showCancelModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCancelModal(false)}
    >
      <View className="justify-end flex-1 bg-black/50">
        <View
          className="p-6 rounded-t-3xl"
          style={{ backgroundColor: surfaceColor, maxHeight: '80%' }}
        >
          <Text className="mb-4 text-2xl font-bold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.BOOKING.CANCEL)}
          </Text>
          <Text className="mb-4 text-sm text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.BOOKING.CANCEL_CONFIRM_PROMPT)}
          </Text>
          {eligibility && (
            <CancellationEligibilityPreview
              eligibility={eligibility}
              t={t}
              surfaceColor={isDark ? '#1a1a1a' : '#f5f5f5'}
              borderColor={borderColor}
              textColor={textColor}
              mutedColor={mutedColor}
              primaryColor={primaryColor}
            />
          )}
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={() => setShowCancelModal(false)}
              className="items-center justify-center flex-1 py-3 rounded-lg"
              style={{ backgroundColor: isDark ? '#333' : '#e0e0e0' }}
            >
              <Text className="font-semibold" style={{ color: textColor }}>
                {t(TRANSLATION_KEYS.COMMON.CANCEL)}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirmCancel}
              disabled={cancelSubmitting || !eligibility?.canCancel}
              className="items-center justify-center flex-1 py-3 rounded-lg"
              style={{
                backgroundColor: cancelSubmitting || !eligibility?.canCancel ? mutedColor : errorColor,
              }}
            >
              {cancelSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="font-semibold text-white">
                  {t(TRANSLATION_KEYS.COMMON.CONFIRM)}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading || !booking || isEditing) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center px-4 py-3 border-b border-border dark:border-border-dark">
          <Pressable onPress={leaveDetail} accessibilityRole="button" accessibilityLabel={t(TRANSLATION_KEYS.BOOKING.BACK)} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </Pressable>
        </View>
        {loading ? (
          <View className="items-center justify-center flex-1">
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : !booking ? (
          <View className="items-center justify-center flex-1 px-6">
            <Text className="text-base text-center text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.PACKAGE_BOOKING.BOOKING_NOT_FOUND)}</Text>
            {role === 'SERVICE_ADMIN' || role === 'EMPLOYEE' ? (
              <Pressable
                onPress={leaveDetail}
                accessibilityRole="button"
                className="px-5 py-3 mt-6 rounded-xl bg-primary"
              >
                <Text className="font-semibold text-white">{t(TRANSLATION_KEYS.TABS.DASHBOARD)}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <KeyboardAwareScroll className="flex-1 p-4">
            <HotelBookingForm
              checkInDate={editCheckInDate}
              checkOutDate={editCheckOutDate}
              guestName={booking.user?.userName || ''}
              setGuestName={() => {}}
              guestEmail={booking.user?.email || ''}
              setGuestEmail={() => {}}
              guestPhoneNumber={booking.user?.phone || ''}
              setGuestPhoneNumber={() => {}}
              paymentMethod={editPaymentMethod}
              setPaymentMethod={setEditPaymentMethod}
              specialRequests={editSpecialRequests}
              setSpecialRequests={setEditSpecialRequests}
              onSubmit={handleSaveEdit}
              submitting={submitting}
              isEditing={true}
              onCancel={cancelEdit}
            />
          </KeyboardAwareScroll>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAwareScroll
        className="flex-1"
        contentContainerStyle={{ paddingBottom: actionBarHeight + 16 }}
        bottomClearance={Math.max(64, actionBarHeight + 12)}
      >
        <View style={{ height: 160, backgroundColor: isDark ? theme.colors['background-dark'] : theme.colors.background }}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} accessibilityLabel={hotelName} style={{ width: '100%', height: 160 }} />
          ) : (
            <View className="items-center justify-center flex-1">
              <Ionicons name="bed-outline" size={40} color={mutedColor} />
            </View>
          )}
          <Pressable
            onPress={leaveDetail}
            accessibilityRole="button"
            accessibilityLabel={t(TRANSLATION_KEYS.BOOKING.BACK)}
            className="absolute items-center justify-center w-10 h-10 rounded-full"
            style={{ top: insets.top + 8, left: 16, backgroundColor: 'rgba(255,255,255,0.92)' }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          {canEdit ? (
            <Pressable
              onPress={startEdit}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.BOOKING.EDIT)}
              className="absolute items-center justify-center w-10 h-10 rounded-full"
              style={{ top: insets.top + 8, right: 16, backgroundColor: primaryColor }}
            >
              <Ionicons name="pencil" size={16} color="white" />
            </Pressable>
          ) : null}
        </View>

        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">{hotelName}</Text>
          {city ? <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{city}</Text> : null}
          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-1 pr-3">
              <Text className="text-xs text-muted dark:text-muted-dark">
                {t(TRANSLATION_KEYS.BOOKING.CONFIRMATION_CODE)}
              </Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark">
                {booking.confirmationCode}
              </Text>
            </View>
            {String(booking.status || '').toUpperCase() !== 'CANCELLED' ? (
            <Pressable
              onPress={() => router.push(`/(tabs)/dashboard/${bookingId}/qr-generate`)}
              accessibilityRole="button"
              accessibilityLabel={t(TRANSLATION_KEYS.BOOKING.QR_CODE)}
              className="flex-row items-center"
            >
              <Ionicons name="qr-code" size={28} color={primaryColor} style={{ marginRight: 8 }} />
              <Text className="text-lg font-bold" style={{ color: primaryColor }}>
                {t(TRANSLATION_KEYS.BOOKING.QR_CODE)}
              </Text>
            </Pressable>
            ) : null}
          </View>
          <View className="flex-row items-center mt-2">
            <Text className="mr-2 text-sm font-semibold text-text dark:text-text-dark">{booking.status}</Text>
            {booking.paymentStatus ? <PaymentStatusBadge status={booking.paymentStatus} /> : null}
          </View>
        </View>

        <HotelStayDesk booking={booking} onUpdated={setBooking} />

        <View className="p-4 mx-4 mt-4 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
          <Text className="mb-3 font-semibold text-text dark:text-text-dark">
            {t(TRANSLATION_KEYS.BOOKING.YOUR_STAY)}
          </Text>
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.BOOKING.CHECK_IN)}</Text>
              <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">{formatStayDate(booking.checkInDate)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.BOOKING.CHECK_OUT)}</Text>
              <Text className="mt-1 text-base font-bold text-text dark:text-text-dark">{formatStayDate(booking.checkOutDate)}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between pt-3 mt-3 border-t border-border dark:border-border-dark">
            <Text className="text-sm text-muted dark:text-muted-dark">{t(TRANSLATION_KEYS.BOOKING.TOTAL_PRICE)}</Text>
            <Text className="text-lg font-bold text-text dark:text-text-dark">{money(booking.totalPrice)}</Text>
          </View>
        </View>

        {Array.isArray(booking.roomDetails) && booking.roomDetails.length > 0 ? (
          <View className="p-4 mx-4 mt-4 bg-white border rounded-xl dark:bg-surface-dark border-border dark:border-border-dark">
            <Text className="mb-1 font-semibold text-text dark:text-text-dark">
              {t(TRANSLATION_KEYS.HOTEL_SEARCH.ROOMS)} ({booking.roomDetails.length})
            </Text>
            {booking.roomDetails.map((room: any, index: number) => {
              const label = room.hotelRoom?.roomNumber
                ? `${t(TRANSLATION_KEYS.BOOKING.ROOM_NUMBER)} ${room.hotelRoom.roomNumber}`
                : (room.hotelRoom?.hotelRoomType?.name || t(TRANSLATION_KEYS.BOOKING.ROOM_NUMBER));
              return (
                <View
                  key={room.hotelRoomId || room.id || index}
                  className="flex-row items-center justify-between py-3"
                  style={index < booking.roomDetails.length - 1 ? { borderBottomWidth: 1, borderBottomColor: borderColor } : undefined}
                >
                  <View className="flex-1 pr-3">
                    <Text className="font-semibold text-text dark:text-text-dark">{label}</Text>
                    <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
                      {money(room.pricePerNight)}{t(TRANSLATION_KEYS.BOOKING.PRICE_PER_NIGHT)}
                    </Text>
                  </View>
                  <Text className="font-bold text-text dark:text-text-dark">{money(room.subtotal)}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </KeyboardAwareScroll>

      <View
        onLayout={(event) => {
          const next = Math.ceil(event.nativeEvent.layout.height);
          if (next > 0 && next !== actionBarHeight) {
            setActionBarHeight(next);
          }
        }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        {eligibilityLoading && showCancelSection ? (
          <ActivityIndicator size="small" color={primaryColor} />
        ) : null}
        {eligibility && showCancelSection ? (
          <CancellationEligibilityPreview
            eligibility={eligibility}
            t={t}
            plain
            surfaceColor="transparent"
            borderColor="transparent"
            textColor={textColor}
            mutedColor={mutedColor}
            primaryColor={primaryColor}
          />
        ) : null}
        {showCancelSection ? (
          <Pressable
            onPress={handleCancelPress}
            disabled={!eligibility?.canCancel || eligibilityLoading}
            className="flex-row items-center justify-center py-3 mt-3 rounded-lg"
            style={{
              backgroundColor: !eligibility?.canCancel || eligibilityLoading ? mutedColor : errorColor,
            }}
          >
            <Ionicons name="close-circle-outline" size={18} color="white" style={{ marginRight: 8 }} />
            <Text className="text-sm font-semibold text-white">
              {eligibility ? getCancelActionLabel(eligibility) : t(TRANSLATION_KEYS.BOOKING.CANCEL)}
            </Text>
          </Pressable>
        ) : null}
        {booking.paymentStatus === 'UNPAID' ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/dashboard/payment',
                params: {
                  bookingId: bookingId!,
                  serviceType: 'HOTEL_BOOKING',
                  totalPrice: String(booking.totalPrice ?? ''),
                },
              })
            }
            className="flex-row items-center justify-center py-3 mt-3 rounded-lg"
            style={{ backgroundColor: isDark ? theme.colors['warning-dark'] : theme.colors.warning }}
          >
            <Ionicons name="card-outline" size={18} color="white" style={{ marginRight: 8 }} />
            <Text className="text-sm font-semibold text-white">
              {t(TRANSLATION_KEYS.PAYMENT.COMPLETE_PAYMENT)}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {cancelModal}
    </View>
  );
}

