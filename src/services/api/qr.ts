import { getApiInstance } from './axiosClient';
import type {
  QRGenerateResponse,
  QRScanResponse,
  QrScanHistoryItem,
  QrScanDetailResponse,
} from '../../types/qr';

export async function generateQRToken(bookingId: string): Promise<QRGenerateResponse> {
  const api = getApiInstance();
  const res = await api.post(`/api/bookings/hotel-rooms/${bookingId}/qr-generate`, {});
  return res.data as QRGenerateResponse;
}

export async function scanQRCode(qrToken: string): Promise<QRScanResponse> {
  const api = getApiInstance();
  const res = await api.post('/api/bookings/hotel-rooms/qr-scan', { qrToken });
  return res.data as QRScanResponse;
}

export async function listHotelQrScans(date?: string): Promise<QrScanHistoryItem[]> {
  const api = getApiInstance();
  const res = await api.get('/api/bookings/hotel-rooms/qr-scans', {
    params: date ? { date } : undefined,
  });
  const body = res.data as { data?: { results?: QrScanHistoryItem[] } };
  return body.data?.results ?? [];
}

export async function getHotelQrScanDetail(scanId: string): Promise<QrScanDetailResponse> {
  const api = getApiInstance();
  const res = await api.get(`/api/bookings/hotel-rooms/qr-scans/${scanId}`);
  return res.data as QrScanDetailResponse;
}

export async function hotelQrCheckIn(bookingId: string): Promise<{ checkedInAt: string }> {
  const api = getApiInstance();
  const res = await api.post(`/api/bookings/hotel-rooms/${bookingId}/qr-check-in`, {});
  const body = res.data as { data?: { checkedInAt?: string } };
  const checkedInAt = body.data?.checkedInAt;
  if (!checkedInAt) {
    throw new Error('Check-in did not return a timestamp');
  }
  return { checkedInAt };
}
