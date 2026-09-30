import { useCallback, useState } from 'react';
import { scanQRCode as scanQRCodeService } from '../services/api/qr';
import type { QRScanResponse, QRBookingDetail } from '../types/qr';

export function useQRScanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanQRCode = useCallback(async (qrToken: string): Promise<QRBookingDetail | null> => {
    try {
      setLoading(true);
      setError(null);
      const data: QRScanResponse = await scanQRCodeService(qrToken);
      return data.data?.booking ?? null;
    } catch (e: any) {
      const status = e?.response?.status;
      const errorMsg = e?.response?.data?.message || e?.message || 'Failed to scan QR code';

      if (__DEV__) console.error('[useQRScanner] Error', status, errorMsg);
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

export default useQRScanner;
