import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HotelSearchDestination, HotelSearchParams, RoomShift } from '../types/hotelSearch';
import { addCalendarDays, defaultStay, defaultWholeDayStay, dhakaYmd, isRoomShift, isValidStay, MAX_GUESTS, MAX_ROOMS, nightsBetween, shiftStillBookable } from '../utilities/hotelSearch';

const STORAGE_KEY = 'hotelSearchParams.v1';

interface HotelSearchContextValue {
    params: HotelSearchParams;
    ready: boolean;
    setDestination: (destination: HotelSearchDestination | null) => void;
    setDates: (checkIn: string, checkOut: string) => void;
    setRoomCount: (roomCount: number) => void;
    setGuestCount: (guestCount: number) => void;
    setShift: (shift: RoomShift) => void;
    applyCatalogStay: () => void;
}

const HotelSearchContext = createContext<HotelSearchContextValue | null>(null);

function clampCount(value: number, max: number): number {
    return Math.min(max, Math.max(1, value || 1));
}

function initialParams(): HotelSearchParams {
    const stay = defaultStay();
    return {
        destination: null,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        roomCount: 1,
        guestCount: 2,
        shift: 'NIGHT',
    };
}

export function HotelSearchProvider({ children }: { children: React.ReactNode }) {
    const [params, setParams] = useState<HotelSearchParams>(initialParams);
    const [ready, setReady] = useState(false);
    const edited = useRef(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (!raw || cancelled) {
                    return;
                }
                const parsed = JSON.parse(raw) as HotelSearchParams;
                if (!parsed.checkIn) {
                    return;
                }
                const nights = nightsBetween(parsed.checkIn, parsed.checkOut);
                const shift = parsed.shift && isRoomShift(parsed.shift)
                    ? parsed.shift
                    : nights === 0
                        ? 'NIGHT'
                        : 'ALL_DAY';
                let checkIn = parsed.checkIn;
                let checkOut = isValidStay(checkIn, parsed.checkOut, shift)
                    ? parsed.checkOut
                    : shift === 'ALL_DAY'
                        ? ''
                        : checkIn;
                const today = dhakaYmd();
                const runningNight = shift === 'NIGHT'
                    && checkIn === addCalendarDays(today, -1)
                    && shiftStillBookable(checkIn, 'NIGHT');
                if (checkIn < today && !runningNight) {
                    checkIn = '';
                    checkOut = '';
                }
                if (!edited.current) {
                    setParams({
                        destination: parsed.destination ?? null,
                        checkIn,
                        checkOut,
                        roomCount: clampCount(parsed.roomCount, MAX_ROOMS),
                        guestCount: clampCount(parsed.guestCount, MAX_GUESTS),
                        shift,
                    });
                }
            } catch {
                // keep defaults
            } finally {
                if (!cancelled) {
                    setReady(true);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!ready) {
            return;
        }
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(params)).catch(() => undefined);
    }, [params, ready]);

    const value = useMemo<HotelSearchContextValue>(() => ({
        params,
        ready,
        setDestination: (destination) => setParams((current) => ({ ...current, destination })),
        setDates: (checkIn, checkOut) => setParams((current) => ({ ...current, checkIn, checkOut })),
        setRoomCount: (roomCount) => setParams((current) => ({ ...current, roomCount: clampCount(roomCount, MAX_ROOMS) })),
        setGuestCount: (guestCount) => setParams((current) => ({ ...current, guestCount: clampCount(guestCount, MAX_GUESTS) })),
        setShift: (shift) => setParams((current) => {
            if (shift !== 'ALL_DAY') {
                return { ...current, shift, checkOut: current.checkIn };
            }
            const sameDay = !current.checkOut || current.checkOut === current.checkIn;
            return { ...current, shift, checkOut: sameDay ? '' : current.checkOut };
        }),
        applyCatalogStay: () => {
            edited.current = true;
            setParams((current) => {
                const stay = defaultWholeDayStay();
                return {
                    ...current,
                    shift: 'ALL_DAY',
                    guestCount: 2,
                    roomCount: 1,
                    checkIn: stay.checkIn,
                    checkOut: '',
                };
            });
        },
    }), [params, ready]);

    return (
        <HotelSearchContext.Provider value={value}>
            {children}
        </HotelSearchContext.Provider>
    );
}

export function useHotelSearch(): HotelSearchContextValue {
    const context = useContext(HotelSearchContext);
    if (!context) {
        throw new Error('useHotelSearch must be used within HotelSearchProvider');
    }
    return context;
}
