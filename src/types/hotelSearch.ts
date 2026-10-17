export type RoomShift = 'ALL_DAY' | 'MORNING' | 'AFTERNOON' | 'NIGHT';

export type HotelSearchPlaceSource = 'location' | 'hotel' | 'tourSpot' | 'activitySpot';

export interface HotelSearchDestination {
    kind: 'place';
    id: string;
    name: string;
    subtitle: string;
    locationId: string;
    locationType?: string;
    source: HotelSearchPlaceSource;
}

export interface HotelSearchParams {
    destination: HotelSearchDestination | null;
    checkIn: string;
    checkOut: string;
    roomCount: number;
    guestCount: number;
    shift: RoomShift;
}

export type HotelSortKey = 'rating' | 'name';

export type HotelMinRating = '0' | '3' | '4' | '5';

export interface HotelListFilter {
    sort: HotelSortKey;
    minRating: HotelMinRating;
}

export interface AvailableRoomType {
    roomTypeId: string;
    roomType: string;
    totalRooms: number;
    availableRooms: number;
    basePrice: number;
    nightShiftPrice: number;
    morningShiftPrice: number;
    afternoonShiftPrice: number;
    allowShiftBooking: boolean;
    maxGuests?: number;
    images?: Array<{ url: string }>;
}

export interface HotelSearchListItem {
    id: string;
    name: string;
    rating?: number;
    amenities?: string[];
    description?: string;
    checkInTime?: string;
    checkOutTime?: string;
    policies?: string[];
    images?: Array<{ url: string }>;
    location?: {
        id?: string;
        name?: string;
        city?: string | null;
        country?: string | null;
    };
    roomTypes?: Array<{
        id: string;
        roomType?: string;
        pricePerNight?: number;
        nightShiftPrice?: number | null;
        morningShiftPrice?: number | null;
        afternoonShiftPrice?: number | null;
        allowShiftBooking?: boolean;
        singleBedCount?: number;
        doubleBedCount?: number;
        images?: Array<{ url: string }>;
    }>;
    _count?: { reviews?: number };
}
