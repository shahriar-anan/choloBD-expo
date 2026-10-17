import React, { createContext, useContext, useState } from 'react';
import { useFetchLocations } from '../../../hooks/useFetchLocations';
import { useFetchHotels } from '../../../hooks/useFetchHotels';
import { useFetchHotelDetail } from '../../../hooks/useFetchHotelDetail';
import { useBookingLogic } from '../../../hooks/useBookingLogic';
import { useRouter } from 'expo-router';
import { AvailableRoomType, RoomShift } from '../../../types/hotelSearch';
import { bookingTotal, canSelectRoomForShift } from '../../../utilities/hotelSearch';

interface ExploreContextValue {
  locations: any[];
  locationsLoading: boolean;
  hotels: any[];
  hotelsLoading: boolean;
  hotelDetail: any | null;
  detailLoading: boolean;
  selectedRoomsMap: Record<string, number>;
  availableRooms: AvailableRoomType[];
  shift: RoomShift;
  guestCount: number;
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
    selectedRoomsMap: Record<string, number>;
    availableRooms: AvailableRoomType[];
    shift: RoomShift;
    guestCount: number;
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
  const [availableRooms, setAvailableRooms] = useState<AvailableRoomType[]>([]);
  const [shift, setShift] = useState<RoomShift>('ALL_DAY');
  const [guestCount, setGuestCount] = useState(2);
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
      const room = availableRooms.find((item) => item.roomTypeId === roomTypeId);
      const hotelAllowsShift = hotelDetail?.allowShiftBooking === true;
      if (delta > 0 && (!room || !canSelectRoomForShift(room, shift, hotelAllowsShift))) {
        return prev;
      }
      const cap = room?.availableRooms ?? 0;
      const next = Math.max(0, Math.min(cap, current + delta));
      if (next <= 0) {
        const rest = { ...prev };
        delete rest[roomTypeId];
        return rest;
      }
      return { ...prev, [roomTypeId]: next };
    });
  };

  const submitBooking = async () => {
    if (!hotelDetail) return null;
    const result = await handleBooking(
      {
        hotelId: hotelDetail.id,
        checkInDate,
        checkOutDate,
        shift,
        totalPrice: bookingTotal(selectedRoomsMap, availableRooms, shift, checkInDate, checkOutDate),
        selectedRoomsMap,
        guestName,
        guestEmail,
        guestPhoneNumber,
        paymentMethod: 'sslcommerz',
        specialRequests: specialRequests.trim() ? specialRequests.trim() : undefined,
        guestCount,
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
    setAvailableRooms([]);
    setShift('ALL_DAY');
    setGuestCount(2);
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
    selectedRoomsMap: Record<string, number>;
    availableRooms: AvailableRoomType[];
    shift: RoomShift;
    guestCount: number;
    checkIn: string;
    checkOut: string;
  }) => {
    setCheckInDate(input.checkIn);
    setCheckOutDate(input.checkOut);
    setShift(input.shift);
    setGuestCount(input.guestCount);
    setAvailableRooms(input.availableRooms);
    setSelectedRoomsMap(input.selectedRoomsMap);
    const detail = await fetchHotelDetail(input.hotelId);
    if (!detail) {
      return;
    }
    router.push('/(tabs)/explore/booking');
  };

  const clearExploreState = () => {
    try {
      clearHotels();
      clearHotel();
    } catch (e) {}
    setSelectedRoomsMap({});
    setAvailableRooms([]);
    setShift('ALL_DAY');
    setGuestCount(2);
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
        availableRooms,
        shift,
        guestCount,
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
