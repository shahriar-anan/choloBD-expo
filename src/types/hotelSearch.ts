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
}

export type HotelSortKey = 'popular' | 'cheapest' | 'rating';

export interface HotelListFilter {
    sort: HotelSortKey;
    propertyName: string;
    stars: number[];
    amenityNames: string[];
    priceBucketIndexes: number[];
}

export interface HotelPriceBucket {
    min: number;
    max: number;
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
        singleBedCount?: number;
        doubleBedCount?: number;
        images?: Array<{ url: string }>;
    }>;
    _count?: { reviews?: number };
}
