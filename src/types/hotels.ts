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
  // --- FE Hotel fields (additive, optional) ---
  description?: string;
  locationId?: string;
  addressId?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  totalRooms?: number;
  availableRooms?: number;
  hotelType?: string;
  allowShiftBooking?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  nearbyAttractions?: string[];
  amenities?: string[];
  policies?: string[];
}

export interface RoomType {
  id: string;
  roomType: string;
  singleBedCount?: number;
  doubleBedCount?: number;
  pricePerNight: number;
  availableCount: number;
  images?: Array<{ url: string }>;
  // --- FE HotelRoomType fields (additive) ---
  hotelId?: string;
  nightShiftPrice?: number | null;
  morningShiftPrice?: number | null;
  afternoonShiftPrice?: number | null;
  allowShiftBooking?: boolean;
  totalCount?: number;
  createdAt?: Date | string;
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
  /** Optional physical rooms when detail payload includes inventory */
  rooms?: Array<{ id: string; roomStatus?: string; roomNumber?: string }>;
  totalRooms?: number;
  availableRooms?: number;
  website?: string;
  amenities?: string[];
  policies?: string[];
  phoneNumber?: string;
  email?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface HotelBooking {
  id: string;
  confirmationCode: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod?: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  specialRequests?: string;
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
  // --- FE HotelRoomBooking fields (additive) ---
  hotelId?: string;
  userId?: string;
  shift?: string | number;
  guestName?: string;
  guestEmail?: string;
  guestPhoneNumber?: string;
  bookedAt?: Date | string;
  confirmedAt?: Date | string;
  cancelledAt?: Date | string;
  cancellationReason?: string;
}

/** FE HotelRoom — additive; does not replace RoomType */
export interface HotelRoom {
  id: string;
  hotelId: string;
  roomNumber: string;
  roomType?: string;
  roomStatus: string;
  floorNumber?: number | string;
  createdAt?: Date | string;
  hotelRoomTypeId?: string;
  hotelRoomType?: RoomType;
}

/** FE alias for RoomType */
export type HotelRoomType = RoomType;

/** FE alias for HotelBooking */
export type HotelRoomBooking = HotelBooking;

export interface HotelRoomBookingDetail {
  id: string;
  hotelRoomBookingId: string;
  hotelRoomId: string;
  pricePerNight: number;
  subtotal: number;
  createdAt?: Date | string;
  hotelRoom?: HotelRoom;
}

export interface HotelCategory {
  id: string;
  hotelId: string;
  categoryId: string;
}

