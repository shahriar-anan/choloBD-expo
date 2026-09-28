import {
    addDays,
    differenceInCalendarDays,
    eachDayOfInterval,
    endOfMonth,
    format,
    isBefore,
    parseISO,
    startOfDay,
    startOfMonth,
} from 'date-fns';
import {
    HotelListFilter,
    HotelPriceBucket,
    HotelSearchListItem,
} from '../types/hotelSearch';

export const MAX_NIGHTS = 30;

export function defaultStay(today = new Date()): { checkIn: string; checkOut: string } {
    const start = startOfDay(today);
    return {
        checkIn: format(start, 'yyyy-MM-dd'),
        checkOut: format(addDays(start, 2), 'yyyy-MM-dd'),
    };
}

export function nightsBetween(checkIn: string, checkOut: string): number {
    return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

export function isValidStay(checkIn: string, checkOut: string, today = new Date()): boolean {
    const start = startOfDay(parseISO(checkIn));
    const end = startOfDay(parseISO(checkOut));
    if (isBefore(start, startOfDay(today))) {
        return false;
    }
    const nights = differenceInCalendarDays(end, start);
    return nights >= 1 && nights <= MAX_NIGHTS;
}

export function isPastDay(day: Date, today = new Date()): boolean {
    return isBefore(startOfDay(day), startOfDay(today));
}

export function displayRoomName(value?: string): string {
    const raw = (value || 'Room').trim();
    if (raw === raw.toUpperCase()) {
        return raw.toLowerCase().replace(/(^|\s)\S/g, (chunk) => chunk.toUpperCase());
    }
    return raw;
}

export function formatMoney(amount: number): string {
    return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

export function shortRangeLabel(checkIn: string, checkOut: string): string {
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    return `${format(start, 'd MMM yy')} - ${format(end, 'd MMM yy')}`;
}

export function longDayLabel(isoDate: string): string {
    return format(parseISO(isoDate), 'd MMMM, EEE');
}

export function locationLine(location?: HotelSearchListItem['location']): string {
    if (!location) {
        return '';
    }
    const place = location.city || location.name || '';
    const country = location.country || '';
    return [place, country].filter(Boolean).join(', ');
}

export function cheapestByNightlyPrice(hotels: HotelSearchListItem[], count: number): HotelSearchListItem[] {
    return [...hotels]
        .filter((hotel) => minNightlyPrice(hotel) !== null)
        .sort((left, right) => (minNightlyPrice(left) as number) - (minNightlyPrice(right) as number))
        .slice(0, count);
}

export function minNightlyPrice(hotel: HotelSearchListItem): number | null {
    const prices = (hotel.roomTypes || [])
        .map((room) => room.pricePerNight)
        .filter((price): price is number => typeof price === 'number');
    if (prices.length === 0) {
        return null;
    }
    return Math.min(...prices);
}

export function bedLine(singleBedCount?: number, doubleBedCount?: number): string | null {
    const parts: string[] = [];
    if (singleBedCount && singleBedCount > 0) {
        parts.push(`${singleBedCount} single`);
    }
    if (doubleBedCount && doubleBedCount > 0) {
        parts.push(`${doubleBedCount} double`);
    }
    return parts.length > 0 ? parts.join(', ') : null;
}

export function priceBuckets(prices: number[]): HotelPriceBucket[] {
    if (prices.length === 0) {
        return [];
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) {
        return [{ min, max }];
    }
    const step = (max - min) / 5;
    return Array.from({ length: 5 }, (_, index) => {
        const start = Math.round(min + step * index);
        const end = index === 4 ? Math.round(max) : Math.round(min + step * (index + 1));
        return { min: start, max: end };
    });
}

export function priceInBucket(price: number, bucket: HotelPriceBucket, index: number, count: number): boolean {
    if (index === count - 1) {
        return price >= bucket.min && price <= bucket.max;
    }
    return price >= bucket.min && price < bucket.max;
}

export function applyHotelListFilter(
    hotels: HotelSearchListItem[],
    filter: HotelListFilter
): HotelSearchListItem[] {
    const buckets = priceBuckets(
        hotels
            .map((hotel) => minNightlyPrice(hotel))
            .filter((price): price is number => price !== null)
    );
    const name = filter.propertyName.trim().toLowerCase();

    const filtered = hotels.filter((hotel) => {
        if (name && !hotel.name.toLowerCase().includes(name)) {
            return false;
        }
        if (filter.stars.length > 0 && !filter.stars.includes(hotel.rating || 0)) {
            return false;
        }
        if (filter.amenityNames.length > 0) {
            const amenities = hotel.amenities || [];
            if (!filter.amenityNames.every((amenity) => amenities.includes(amenity))) {
                return false;
            }
        }
        if (filter.priceBucketIndexes.length > 0) {
            const price = minNightlyPrice(hotel);
            if (price === null) {
                return false;
            }
            const matches = filter.priceBucketIndexes.some((index) => {
                const bucket = buckets[index];
                return bucket ? priceInBucket(price, bucket, index, buckets.length) : false;
            });
            if (!matches) {
                return false;
            }
        }
        return true;
    });

    const sorted = [...filtered];
    if (filter.sort === 'cheapest') {
        sorted.sort((a, b) => (minNightlyPrice(a) ?? Number.MAX_SAFE_INTEGER) - (minNightlyPrice(b) ?? Number.MAX_SAFE_INTEGER));
    } else {
        sorted.sort((a, b) => {
            const ratingDiff = (b.rating || 0) - (a.rating || 0);
            if (ratingDiff !== 0) {
                return ratingDiff;
            }
            return (b._count?.reviews || 0) - (a._count?.reviews || 0);
        });
    }
    return sorted;
}

export function monthGrid(month: Date): Array<Date | null> {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const leading = start.getDay();
    const cells: Array<Date | null> = Array.from({ length: leading }, () => null);
    cells.push(...days);
    return cells;
}

export function emptyHotelFilter(): HotelListFilter {
    return {
        sort: 'popular',
        propertyName: '',
        stars: [],
        amenityNames: [],
        priceBucketIndexes: [],
    };
}
