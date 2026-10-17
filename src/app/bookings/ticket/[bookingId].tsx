import { Redirect, useLocalSearchParams } from 'expo-router';

export default function BookingTicketDeepLink() {
  const { bookingId, action } = useLocalSearchParams<{ bookingId: string; action?: string }>();
  if (!bookingId) {
    return null;
  }
  return (
    <Redirect
      href={{
        pathname: '/(tabs)/bookings/ticket/[bookingId]',
        params: { bookingId, ...(action ? { action } : {}) },
      }}
    />
  );
}
