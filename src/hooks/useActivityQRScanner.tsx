import { useCallback, useState } from 'react';
import { scanActivityQr } from '../services/api/activityBookings';
import type { ActivityBookingRecord } from '../services/api/activityBookings';

export function useActivityQRScanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanQRCode = useCallback(async (qrToken: string): Promise<ActivityBookingRecord | null> => {
    try {
      setLoading(true);
      setError(null);
      return await scanActivityQr(qrToken);
    } catch (e: unknown) {
      const err = e as { message?: string };
      const errorMsg = err?.message || 'Failed to scan QR code';
      if (__DEV__) console.error('[useActivityQRScanner]', errorMsg);
      setError(errorMsg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, scanQRCode, clearError };
}
