import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HotelSearchDestination, HotelSearchParams } from '../types/hotelSearch';
import { defaultStay, isValidStay } from '../utilities/hotelSearch';

const STORAGE_KEY = 'hotelSearchParams.v1';

interface HotelSearchContextValue {
    params: HotelSearchParams;
    ready: boolean;
    setDestination: (destination: HotelSearchDestination | null) => void;
    setDates: (checkIn: string, checkOut: string) => void;
    setRoomCount: (roomCount: number) => void;
}

const HotelSearchContext = createContext<HotelSearchContextValue | null>(null);

function initialParams(): HotelSearchParams {
    const stay = defaultStay();
    return {
        destination: null,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        roomCount: 1,
    };
}

export function HotelSearchProvider({ children }: { children: React.ReactNode }) {
    const [params, setParams] = useState<HotelSearchParams>(initialParams);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (!raw || cancelled) {
                    return;
                }
                const parsed = JSON.parse(raw) as HotelSearchParams;
                if (!parsed.checkIn || !parsed.checkOut || !isValidStay(parsed.checkIn, parsed.checkOut)) {
                    return;
                }
                setParams({
                    destination: parsed.destination ?? null,
                    checkIn: parsed.checkIn,
                    checkOut: parsed.checkOut,
                    roomCount: Math.max(1, parsed.roomCount || 1),
                });
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
        setRoomCount: (roomCount) => setParams((current) => ({ ...current, roomCount: Math.max(1, roomCount) })),
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
