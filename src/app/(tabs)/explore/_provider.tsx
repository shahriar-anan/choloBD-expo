import React, { createContext, useContext, useState } from 'react';
import { useFetchLocations } from '../../../hooks/useFetchLocations';
import { useFetchHotels } from '../../../hooks/useFetchHotels';
import { useFetchHotelDetail } from '../../../hooks/useFetchHotelDetail';
import { useBookingLogic } from '../../../hooks/useBookingLogic';
import { useRouter } from 'expo-router';

interface ExploreContextValue {
  locations: any[];
  locationsLoading: boolean;
  hotels: any[];
  hotelsLoading: boolean;
  hotelDetail: any | null;
  detailLoading: boolean;
  selectedRoomsMap: Record<string, number>;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  guestPhoneNumber: string;
  paymentMethod: string;
  specialRequests: string;
  submitting: boolean;
  lastBookingResult: any | null;
  fetchHotelsByLocation: (locationId: string) => void;
  selectHotel: (hotelId: string) => Promise<void>;
  changeRoomQty: (roomTypeId: string, delta: number) => void;
  setCheckInDate: (s: string) => void;
  setCheckOutDate: (s: string) => void;
  setGuestName: (s: string) => void;
  setGuestEmail: (s: string) => void;
  setGuestPhoneNumber: (s: string) => void;
  setPaymentMethod: (s: string) => void;
  setSpecialRequests: (s: string) => void;
  submitBooking: () => Promise<any>;
  clearAllAndGoToSearch: () => void;
  clearExploreState: () => void;
  openGuestDetails: (input: {
    hotelId: string;
    roomTypeId: string;
    quantity: number;
    checkIn: string;
    checkOut: string;
  }) => Promise<void>;
}

const ExploreContext = createContext<ExploreContextValue | null>(null);

export function ExploreProvider({ children }: { children: React.ReactNode }) {
  const { locations, loading: locationsLoading } = useFetchLocations();
  const { hotels, loading: hotelsLoading, fetchHotels, clearHotels } = useFetchHotels();
  const { hotel: hotelDetail, loading: detailLoading, fetchHotelDetail, clearHotel } = useFetchHotelDetail();
  const { submitting, handleBooking } = useBookingLogic();
  const router = useRouter();

  const [selectedRoomsMap, setSelectedRoomsMap] = useState<Record<string, number>>({});
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhoneNumber, setGuestPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [lastBookingResult, setLastBookingResult] = useState<any | null>(null);

  const fetchHotelsByLocation = (locationId: string) => {
    fetchHotels({ locationId, isActive: true });
    router.push('/(tabs)/explore/list');
  };

  const selectHotel = async (hotelId: string) => {
    await fetchHotelDetail(hotelId);
    router.push('/(tabs)/explore/detail');
  };

  const changeRoomQty = (roomTypeId: string, delta: number) => {
    setSelectedRoomsMap((prev) => {
      const current = prev[roomTypeId] || 0;
      let newQty = Math.max(0, current + delta);

      // enforce availableCount if present on hotelDetail
      try {
        const rt = (hotelDetail?.roomTypes || []).find((r: any) => r.id === roomTypeId);
        const avail = rt?.availableCount ?? (rt as any)?.totalCount ?? undefined;
        if (avail !== undefined) {
          newQty = Math.min(newQty, avail);
        }
      } catch (e) {
        // ignore
      }

      return { ...prev, [roomTypeId]: newQty };
    });
  };

  const submitBooking = async () => {
    if (!hotelDetail) return null;
    const result = await handleBooking(
      {
        hotelId: hotelDetail.id,
        checkInDate,
        checkOutDate,
        selectedRoomsMap,
        guestName,
        guestEmail,
        guestPhoneNumber,
        paymentMethod,
        specialRequests,
      },
      (data) => {
        setLastBookingResult(data);
        router.push('/(tabs)/explore/payment');
      }
    );
    return result;
  };

  const clearAllAndGoToSearch = () => {
    try {
      clearHotels();
      clearHotel();
    } catch (e) {}
    setSelectedRoomsMap({});
    setCheckInDate('');
    setCheckOutDate('');
    setGuestName('');
    setGuestEmail('');
    setGuestPhoneNumber('');
    setPaymentMethod('');
    setSpecialRequests('');
    setLastBookingResult(null);
    router.push('/(tabs)/explore');
  };

  const openGuestDetails = async (input: {
    hotelId: string;
    roomTypeId: string;
    quantity: number;
    checkIn: string;
    checkOut: string;
  }) => {
    setCheckInDate(input.checkIn);
    setCheckOutDate(input.checkOut);
    setSelectedRoomsMap({ [input.roomTypeId]: input.quantity });
    await fetchHotelDetail(input.hotelId);
    router.push('/(tabs)/explore/booking');
  };

  const clearExploreState = () => {
    try {
      clearHotels();
      clearHotel();
    } catch (e) {}
    setSelectedRoomsMap({});
    setCheckInDate('');
    setCheckOutDate('');
    setGuestName('');
    setGuestEmail('');
    setGuestPhoneNumber('');
    setPaymentMethod('');
    setSpecialRequests('');
    setLastBookingResult(null);
  };

  return (
    <ExploreContext.Provider
      value={{
        locations,
        locationsLoading,
        hotels,
        hotelsLoading,
        hotelDetail,
        detailLoading,
        selectedRoomsMap,
        checkInDate,
        checkOutDate,
        guestName,
        guestEmail,
        guestPhoneNumber,
        paymentMethod,
        specialRequests,
        submitting,
        lastBookingResult,
        fetchHotelsByLocation,
        selectHotel,
        changeRoomQty,
        setCheckInDate,
        setCheckOutDate,
        setGuestName,
        setGuestEmail,
        setGuestPhoneNumber,
        setPaymentMethod,
        setSpecialRequests,
        submitBooking,
        clearAllAndGoToSearch,
        clearExploreState,
        openGuestDetails,
      }}
    >
      {children}
    </ExploreContext.Provider>
  );
}

export function useExplore() {
  const ctx = useContext(ExploreContext);
  if (!ctx) throw new Error('useExplore must be used within ExploreProvider');
  return ctx;
}
