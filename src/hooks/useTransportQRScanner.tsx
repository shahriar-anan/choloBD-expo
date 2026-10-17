import { useCallback, useState } from 'react';
import { scanTransportBoardingQr } from '../services/api/transportBookings';
import type { TransportBooking } from '../types/transports';

export function useTransportQRScanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanQRCode = useCallback(async (qrToken: string): Promise<TransportBooking | null> => {
    try {
      setLoading(true);
      setError(null);
      return await scanTransportBoardingQr(qrToken);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to scan QR code';
      if (__DEV__) console.error('[useTransportQRScanner] Error', err?.response?.status, errorMsg);
      setError(errorMsg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    scanQRCode,
    clearError,
  };
}

export default useTransportQRScanner;
