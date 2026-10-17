import { Stack } from 'expo-router';
import { HotelPropertyProvider } from '../../../../../components/hotelDesk/HotelPropertyContext';

export default function HotelInfoLayout() {
  return (
    <HotelPropertyProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </HotelPropertyProvider>
  );
}
