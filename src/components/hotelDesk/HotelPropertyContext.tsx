import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useGlobalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { getHotelReviews } from '../../services/api/reviews';
import { createHotelRoomType, updateHotelBookingMode, updateHotelRoomStatus, updateHotelRoomTypePrice, HotelRoomDeskStatus } from '../../services/api/hotels';
import { getHotelRooms, getOperatorHotel, updateMyHotel, UpdateHotelProfileData } from '../../services/api/users';
import { RootState } from '../../store/store';

interface HotelPropertyValue {
  hotelId: string;
  hotel: any | null;
  rooms: any[];
  reviews: any[];
  loading: boolean;
  loadError: boolean;
  reviewsError: boolean;
  isHotelAdmin: boolean;
  savingProfile: boolean;
  savingBookingMode: boolean;
  savingRoomId: string | null;
  savingType: boolean;
  saveProfile: (data: UpdateHotelProfileData) => Promise<void>;
  saveBookingMode: (allowShiftBooking: boolean) => Promise<void>;
  setRoomStatus: (roomId: string, roomStatus: HotelRoomDeskStatus) => Promise<void>;
  saveRoomType: (roomTypeId: string, payload: Parameters<typeof updateHotelRoomTypePrice>[1]) => Promise<void>;
  createType: (payload: Parameters<typeof createHotelRoomType>[0]) => Promise<void>;
}

const HotelPropertyContext = createContext<HotelPropertyValue | null>(null);

function oneParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export function HotelPropertyProvider({ children }: { children: React.ReactNode }) {
  const params = useGlobalSearchParams<{ hotelId?: string | string[] }>();
  const auth = useSelector((state: RootState) => state.auth);
  const isHotelAdmin = auth.user?.role === 'SERVICE_ADMIN';
  const [hotelId, setHotelId] = useState(() => oneParam(params.hotelId));
  const [hotel, setHotel] = useState<any | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBookingMode, setSavingBookingMode] = useState(false);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [savingType, setSavingType] = useState(false);

  useEffect(() => {
    const next = oneParam(params.hotelId);
    if (next) setHotelId(next);
  }, [params.hotelId]);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setLoadError(false);
    try {
      const nextHotel = await getOperatorHotel(id);
      setHotel(nextHotel ?? null);
    } catch (error) {
      console.error('[HotelProperty] hotel', error);
      setLoadError(true);
      setHotel(null);
    }
    try {
      setRooms(await getHotelRooms(id));
    } catch (error) {
      console.error('[HotelProperty] rooms', error);
      setRooms([]);
    }
    try {
      setReviewsError(false);
      setReviews(await getHotelReviews(id));
    } catch (error) {
      console.error('[HotelProperty] reviews', error);
      setReviewsError(true);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hotelId) {
      setLoading(false);
      setLoadError(true);
      return;
    }
    void load(hotelId);
  }, [hotelId, load]);

  const saveProfile = useCallback(async (data: UpdateHotelProfileData) => {
    if (!hotelId) return;
    setSavingProfile(true);
    try {
      const updated = await updateMyHotel(hotelId, data);
      setHotel((current: any) => ({ ...current, ...data, ...updated }));
    } finally {
      setSavingProfile(false);
    }
  }, [hotelId]);

  const saveBookingMode = useCallback(async (allowShiftBooking: boolean) => {
    if (!hotelId || savingBookingMode) return;
    setSavingBookingMode(true);
    try {
      const updated = await updateHotelBookingMode(hotelId, allowShiftBooking);
      try {
        const next = await getOperatorHotel(hotelId);
        if (next) {
          setHotel(next);
        } else {
          setHotel((current: any) => ({ ...current, ...updated, allowShiftBooking }));
        }
      } catch (error) {
        console.error('[HotelProperty] refresh after booking mode', error);
        setHotel((current: any) => ({ ...current, ...updated, allowShiftBooking }));
      }
    } finally {
      setSavingBookingMode(false);
    }
  }, [hotelId, savingBookingMode]);

  const setRoomStatus = useCallback(async (roomId: string, roomStatus: HotelRoomDeskStatus) => {
    setSavingRoomId(roomId);
    try {
      const updated = await updateHotelRoomStatus(roomId, roomStatus);
      setRooms((current) => current.map((room) => (room.id === roomId ? { ...room, ...updated, roomStatus } : room)));
    } finally {
      setSavingRoomId(null);
    }
  }, []);

  const saveRoomType = useCallback(async (roomTypeId: string, payload: Parameters<typeof updateHotelRoomTypePrice>[1]) => {
    setSavingType(true);
    try {
      const updated = await updateHotelRoomTypePrice(roomTypeId, payload);
      setHotel((current: any) => ({
        ...current,
        roomTypes: (current?.roomTypes ?? []).map((roomType: any) => (
          roomType.id === roomTypeId ? { ...roomType, ...payload, ...updated } : roomType
        )),
      }));
    } finally {
      setSavingType(false);
    }
  }, []);

  const createType = useCallback(async (payload: Parameters<typeof createHotelRoomType>[0]) => {
    setSavingType(true);
    try {
      const created = await createHotelRoomType(payload);
      if (created?.id) {
        setHotel((current: any) => ({
          ...current,
          roomTypes: [...(current?.roomTypes ?? []).filter((roomType: any) => roomType.id !== created.id), created],
        }));
      }
      if (hotelId) {
        try {
          const nextRooms = await getHotelRooms(hotelId);
          setRooms(nextRooms ?? []);
        } catch (error) {
          console.error('[HotelProperty] rooms after create', error);
        }
      }
    } finally {
      setSavingType(false);
    }
  }, [hotelId]);

  const value = useMemo<HotelPropertyValue>(() => ({
    hotelId,
    hotel,
    rooms,
    reviews,
    loading,
    loadError,
    reviewsError,
    isHotelAdmin,
    savingProfile,
    savingBookingMode,
    savingRoomId,
    savingType,
    saveProfile,
    saveBookingMode,
    setRoomStatus,
    saveRoomType,
    createType,
  }), [
    hotelId, hotel, rooms, reviews, loading, loadError, reviewsError, isHotelAdmin,
    savingProfile, savingBookingMode, savingRoomId, savingType,
    saveProfile, saveBookingMode, setRoomStatus, saveRoomType, createType,
  ]);

  return <HotelPropertyContext.Provider value={value}>{children}</HotelPropertyContext.Provider>;
}

export function useHotelProperty(): HotelPropertyValue {
  const value = useContext(HotelPropertyContext);
  if (!value) {
    throw new Error('useHotelProperty must be used inside the hotel property layout');
  }
  return value;
}
