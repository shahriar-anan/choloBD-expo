export interface QRGenerateResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    qrToken: string;
    expiresAt?: string;
  };
}

export interface QRScanRequest {
  qrToken: string;
}

export interface QRScanResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    booking: QRBookingDetail;
  };
}

export interface QrScanHistoryItem {
  id: string;
  bookingId: string;
  confirmationCode: string;
  guestLabel: string;
  detailLabel: string;
  paymentStatus: string;
  scannedAt: string;
  checkedInAt: string | null;
}

export interface QrScanDetailResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    booking: QRBookingDetail | Record<string, unknown>;
    scannedAt: string;
    checkedInAt: string | null;
  };
}

export interface QRBookingDetail {
  id: string;
  confirmationCode: string;
  status: string;
  checkedInAt?: string | null;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus?: string;
  shift?: string;
  guestName?: string | null;
  guestPhoneNumber?: string | null;
  specialRequests?: string;
  hotel: {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
    location?: {
      id: string;
      name: string;
      city?: string;
      country?: string;
    };
  };
  user?: {
    id: string;
    userName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
  } | null;
  roomDetails: Array<{
    hotelRoom: {
      id: string;
      roomNumber: string;
    };
    hotelRoomType: {
      roomType: string;
      pricePerNight: number;
    };
    pricePerNight: number;
    subtotal: number;
  }>;
}

export interface QRErrorResponse {
  status: 'failed';
  message: string;
}
