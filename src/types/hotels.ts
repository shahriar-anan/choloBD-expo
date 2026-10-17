import { Location } from './locations';

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  location: {
    id: string;
    name: string;
  };
  images: Array<{ url: string }>;
  _count?: {
    reviews: number;
  };
  roomTypes?: Array<{
    id: string;
    pricePerNight: number;
  }>;
}

export interface RoomType {
  id: string;
  roomType: string;
  singleBedCount?: number;
  doubleBedCount?: number;
  pricePerNight: number;
  morningShiftPrice?: number | null;
  afternoonShiftPrice?: number | null;
  nightShiftPrice?: number | null;
  allowShiftBooking?: boolean;
  availableCount: number;
  images?: Array<{ url: string }>;
}

export interface HotelDetail {
  id: string;
  name: string;
  description: string;
  rating: number;
  location: Location | {
    id: string;
    name: string;
  };
  images: Array<{ url: string }>;
  roomTypes: RoomType[];
  amenities?: string[];
  policies?: string[];
  phoneNumber?: string;
  email?: string;
  checkInTime?: string;
  checkOutTime?: string;
  allowShiftBooking?: boolean;
}

export interface HotelBooking {
  id: string;
  confirmationCode: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod?: string;
  checkInDate: string;
  checkOutDate: string;
  checkedInAt?: string | null;
  totalPrice: number;
  specialRequests?: string;
  guestCount?: number | null;
  hotel?: {
    id: string;
    name: string;
    location?: { city?: string; name?: string };
  };
  user?: {
    id: string;
    userName: string;
    email: string;
  };
  roomDetails?: Array<{
    hotelRoomId: string;
    pricePerNight: number;
    subtotal?: number;
    hotelRoom?: {
      roomNumber?: string;
      hotelRoomType?: { name: string };
    };
  }>;
}
