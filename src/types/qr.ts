export interface QRGenerateResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    qrToken: string;
    expiresAt: string;
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

export interface QRBookingDetail {
  id: string;
  confirmationCode: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus?: string;
  guestName?: string | null;
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
