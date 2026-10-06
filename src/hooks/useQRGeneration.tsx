import { useCallback, useState } from 'react';
import { generateQRToken as generateQRTokenService } from '../services/api/qr';
import type { QRGenerateResponse } from '../types/qr';

export function useQRGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRToken = useCallback(async (bookingId: string): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      const data: QRGenerateResponse = await generateQRTokenService(bookingId);
      return data.data?.qrToken ?? null;
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message ?? e?.message ?? 'Failed to generate QR code';
      setError(errorMsg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateQRToken,
  };
}

export default useQRGeneration;
