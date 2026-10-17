import { Redirect, useLocalSearchParams } from 'expo-router';

export default function BookingStayDeepLink() {
  const { bookingId, action } = useLocalSearchParams<{ bookingId: string; action?: string }>();
  if (!bookingId) {
    return null;
  }
  return (
    <Redirect
      href={{
        pathname: '/(tabs)/bookings/stay/[bookingId]',
        params: { bookingId, ...(action ? { action } : {}) },
      }}
    />
  );
}
