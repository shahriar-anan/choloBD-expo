import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { BusBoardingQrScreen } from '../../../../components/transport/BusBoardingQrScreen';

export default function BookingsBusBoardingQrPage() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  return <BusBoardingQrScreen bookingId={bookingId} />;
}
