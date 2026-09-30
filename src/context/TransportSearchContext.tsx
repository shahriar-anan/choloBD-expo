import React, { createContext, useContext, useMemo, useState } from 'react';
import { format, startOfDay } from 'date-fns';
import { OnPlatformTransportType } from '../types/transports';
import { TransportPlace, TransportSearchParams } from '../types/transportSearch';

interface TransportSearchContextValue {
    params: TransportSearchParams;
    setFrom: (from: TransportPlace | null) => void;
    setTo: (to: TransportPlace | null) => void;
    setDate: (date: string) => void;
    setReturnDate: (returnDate: string | null) => void;
    setTransportType: (transportType: OnPlatformTransportType) => void;
}

const TransportSearchContext = createContext<TransportSearchContextValue | null>(null);

function defaultTravelDate(): string {
    return format(startOfDay(new Date()), 'yyyy-MM-dd');
}

function initialParams(): TransportSearchParams {
    return {
        from: null,
        to: null,
        date: defaultTravelDate(),
        returnDate: null,
        transportType: 'BUS',
    };
}

export function TransportSearchProvider({ children }: { children: React.ReactNode }) {
    const [params, setParams] = useState<TransportSearchParams>(initialParams);

    const value = useMemo<TransportSearchContextValue>(() => ({
        params,
        setFrom: (from) => setParams((current) => ({ ...current, from })),
        setTo: (to) => setParams((current) => ({ ...current, to })),
        setDate: (date) => setParams((current) => ({ ...current, date })),
        setReturnDate: (returnDate) => setParams((current) => ({ ...current, returnDate })),
        setTransportType: (transportType) =>
            setParams((current) => ({
                ...current,
                transportType,
                returnDate: transportType === 'BUS' ? current.returnDate : null,
            })),
    }), [params]);

    return (
        <TransportSearchContext.Provider value={value}>
            {children}
        </TransportSearchContext.Provider>
    );
}

export function useTransportSearch(): TransportSearchContextValue {
    const context = useContext(TransportSearchContext);
    if (!context) {
        throw new Error('useTransportSearch must be used within TransportSearchProvider');
    }
    return context;
}
