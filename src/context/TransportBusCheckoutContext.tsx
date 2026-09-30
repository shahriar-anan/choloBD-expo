import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { TransportSeat } from '../types/transports';

export interface HeldLegState {
  tripId: string;
  transportId: string;
  seatIds: string[];
  seats: TransportSeat[];
  holdExpiresAt: string;
}

interface TransportBusCheckoutValue {
  outbound: HeldLegState | null;
  returnLeg: HeldLegState | null;
  boardingStopId: string | null;
  droppingStopId: string | null;
  setOutboundHold: (leg: HeldLegState) => void;
  setReturnHold: (leg: HeldLegState) => void;
  setStops: (boardingStopId: string, droppingStopId: string) => void;
  clearReturnLeg: () => void;
  resetCheckout: () => void;
}

const TransportBusCheckoutContext = createContext<TransportBusCheckoutValue | null>(null);

export function TransportBusCheckoutProvider({ children }: { children: React.ReactNode }) {
  const [outbound, setOutbound] = useState<HeldLegState | null>(null);
  const [returnLeg, setReturnLeg] = useState<HeldLegState | null>(null);
  const [boardingStopId, setBoardingStopId] = useState<string | null>(null);
  const [droppingStopId, setDroppingStopId] = useState<string | null>(null);

  const setOutboundHold = useCallback((leg: HeldLegState) => {
    setOutbound(leg);
    setBoardingStopId(null);
    setDroppingStopId(null);
    setReturnLeg(null);
  }, []);

  const setReturnHold = useCallback((leg: HeldLegState) => {
    setReturnLeg(leg);
  }, []);

  const setStops = useCallback((boarding: string, dropping: string) => {
    setBoardingStopId(boarding);
    setDroppingStopId(dropping);
  }, []);

  const clearReturnLeg = useCallback(() => {
    setReturnLeg(null);
  }, []);

  const resetCheckout = useCallback(() => {
    setOutbound(null);
    setReturnLeg(null);
    setBoardingStopId(null);
    setDroppingStopId(null);
  }, []);

  const value = useMemo<TransportBusCheckoutValue>(() => ({
    outbound,
    returnLeg,
    boardingStopId,
    droppingStopId,
    setOutboundHold,
    setReturnHold,
    setStops,
    clearReturnLeg,
    resetCheckout,
  }), [
    outbound,
    returnLeg,
    boardingStopId,
    droppingStopId,
    setOutboundHold,
    setReturnHold,
    setStops,
    clearReturnLeg,
    resetCheckout,
  ]);

  return (
    <TransportBusCheckoutContext.Provider value={value}>
      {children}
    </TransportBusCheckoutContext.Provider>
  );
}

export function useTransportBusCheckout(): TransportBusCheckoutValue {
  const context = useContext(TransportBusCheckoutContext);
  if (!context) {
    throw new Error('useTransportBusCheckout must be used within TransportBusCheckoutProvider');
  }
  return context;
}
