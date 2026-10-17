import {
    differenceInCalendarDays,
    eachDayOfInterval,
    endOfMonth,
    format,
    isBefore,
    parseISO,
    startOfDay,
    startOfMonth,
} from 'date-fns';
import type { Locale } from 'date-fns';
import { TRANSLATION_KEYS } from '../constants/translationKeys';
import {
    AvailableRoomType,
    HotelListFilter,
    HotelSearchListItem,
    RoomShift,
} from '../types/hotelSearch';

export const MAX_ROOMS = 4;
export const MAX_GUESTS = 6;
export const MAX_GUESTS_PER_ROOM = 10;

const DHAKA = 'Asia/Dhaka';

export function dhakaYmd(value = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: DHAKA }).format(value);
}

export function dhakaMinutes(value = new Date()): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: DHAKA,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(value);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
    return (hour % 24) * 60 + minute;
}

export function addCalendarDays(ymd: string, days: number): string {
    const [year, month, day] = ymd.split('-').map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day));
    utc.setUTCDate(utc.getUTCDate() + days);
    return [
        utc.getUTCFullYear(),
        String(utc.getUTCMonth() + 1).padStart(2, '0'),
        String(utc.getUTCDate()).padStart(2, '0'),
    ].join('-');
}

const SHIFT_LAST_BOOK_MINUTE: Record<Exclude<RoomShift, 'ALL_DAY'>, number> = {
    MORNING: 12 * 60,
    AFTERNOON: 19 * 60,
    NIGHT: 5 * 60,
};

export const SHIFT_CLOSE_CLOCK: Record<Exclude<RoomShift, 'ALL_DAY'>, string> = {
    MORNING: '12:00',
    AFTERNOON: '19:00',
    NIGHT: '05:00',
};

/** Short shift name and the last bookable time, in the traveler's language. */
export function shiftSpoken(shift: Exclude<RoomShift, 'ALL_DAY'>): { name: string; until: string } {
    const keys = TRANSLATION_KEYS.HOTEL_SEARCH;
    if (shift === 'MORNING') return { name: keys.MORNING_SHORT, until: keys.CLOSE_MORNING };
    if (shift === 'AFTERNOON') return { name: keys.AFTERNOON_SHORT, until: keys.CLOSE_AFTERNOON };
    return { name: keys.NIGHT_SHORT, until: keys.CLOSE_NIGHT };
}

/** A shift stays bookable until 3 hours before it ends. */
export function shiftStillBookable(ymd: string, shift: Exclude<RoomShift, 'ALL_DAY'>, now = new Date()): boolean {
    if (!ymd) {
        return false;
    }
    const lastYmd = shift === 'NIGHT' ? addCalendarDays(ymd, 1) : ymd;
    const today = dhakaYmd(now);
    if (today < lastYmd) {
        return true;
    }
    if (today > lastYmd) {
        return false;
    }
    return dhakaMinutes(now) <= SHIFT_LAST_BOOK_MINUTE[shift];
}

export function shiftClosedForStay(ymd: string, shift: RoomShift, now = new Date()): boolean {
    if (!ymd || shift === 'ALL_DAY') {
        return false;
    }
    return !shiftStillBookable(ymd, shift, now);
}

export function runningNightOpen(now = new Date()): boolean {
    return dhakaMinutes(now) <= 5 * 60;
}

export function runningNightCheckIn(now = new Date()): string {
    return addCalendarDays(dhakaYmd(now), -1);
}

export function defaultStay(now = new Date()): { checkIn: string; checkOut: string } {
    const start = dhakaYmd(now);
    return { checkIn: start, checkOut: start };
}

export function defaultWholeDayStay(now = new Date()): { checkIn: string; checkOut: string } {
    const start = dhakaYmd(now);
    return { checkIn: start, checkOut: addCalendarDays(start, 1) };
}

export function isRoomShift(value: string): value is RoomShift {
    return value === 'ALL_DAY' || value === 'MORNING' || value === 'AFTERNOON' || value === 'NIGHT';
}

export function isShiftStay(shift: RoomShift): boolean {
    return shift !== 'ALL_DAY';
}

export function nightsBetween(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) {
        return 0;
    }
    const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
    return Number.isFinite(nights) ? nights : 0;
}

export function isValidStay(checkIn: string, checkOut: string, shift: RoomShift = 'ALL_DAY', today = new Date()): boolean {
    if (!checkIn || !checkOut) {
        return false;
    }
    const start = startOfDay(parseISO(checkIn));
    const end = startOfDay(parseISO(checkOut));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return false;
    }
    const todayYmd = dhakaYmd(today);
    const runningNight = shift === 'NIGHT'
        && checkIn === addCalendarDays(todayYmd, -1)
        && shiftStillBookable(checkIn, 'NIGHT', today);
    if (checkIn < todayYmd && !runningNight) {
        return false;
    }
    const nights = differenceInCalendarDays(end, start);
    if (isShiftStay(shift)) {
        return nights === 0;
    }
    return nights >= 1;
}

export function stayUnits(checkIn: string, checkOut: string, shift: RoomShift): number {
    if (isShiftStay(shift)) {
        return 1;
    }
    const nights = nightsBetween(checkIn, checkOut);
    return nights > 0 ? nights : 0;
}

export function priceForShift(room: Pick<AvailableRoomType, 'basePrice' | 'morningShiftPrice' | 'afternoonShiftPrice' | 'nightShiftPrice'>, shift: RoomShift): number {
    const raw = shift === 'MORNING'
        ? room.morningShiftPrice
        : shift === 'AFTERNOON'
            ? room.afternoonShiftPrice
            : shift === 'NIGHT'
                ? room.nightShiftPrice
                : room.basePrice;
    return typeof raw === 'number' && raw > 0 ? raw : 0;
}

export function bookingTotal(
    selected: Record<string, number>,
    rooms: AvailableRoomType[],
    shift: RoomShift,
    checkIn: string,
    checkOut: string,
): number {
    const units = stayUnits(checkIn, checkOut, shift);
    return rooms.reduce((sum, room) => {
        const quantity = selected[room.roomTypeId] || 0;
        if (quantity <= 0) {
            return sum;
        }
        return sum + priceForShift(room, shift) * units * quantity;
    }, 0);
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

export function shortRangeLabel(checkIn: string, checkOut: string, locale?: Locale): string {
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    const options = locale ? { locale } : undefined;
    return `${format(start, 'd MMM yy', options)} - ${format(end, 'd MMM yy', options)}`;
}

export function longDayLabel(isoDate: string, locale?: Locale): string {
    return format(parseISO(isoDate), 'd MMMM, EEE', locale ? { locale } : undefined);
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
        .filter((price): price is number => typeof price === 'number' && price > 0);
    if (prices.length === 0) {
        return null;
    }
    return Math.min(...prices);
}

export function minShiftPrice(hotel: HotelSearchListItem, shift: RoomShift): number | null {
    if (!isShiftStay(shift)) {
        return minNightlyPrice(hotel);
    }
    const prices = (hotel.roomTypes || [])
        .filter((room) => room.allowShiftBooking)
        .map((room) => priceForShift({
            basePrice: room.pricePerNight ?? 0,
            morningShiftPrice: room.morningShiftPrice ?? 0,
            afternoonShiftPrice: room.afternoonShiftPrice ?? 0,
            nightShiftPrice: room.nightShiftPrice ?? 0,
        }, shift))
        .filter((price) => price > 0);
    if (prices.length === 0) {
        return null;
    }
    return Math.min(...prices);
}

export function selectedGuestCapacity(
    selected: Record<string, number>,
    rooms: Array<{ roomTypeId: string; maxGuests?: number | null }>,
): number {
    let capacity = 0;
    Object.entries(selected).forEach(([roomTypeId, quantity]) => {
        if (quantity <= 0) {
            return;
        }
        const room = rooms.find((item) => item.roomTypeId === roomTypeId);
        const perRoom = typeof room?.maxGuests === 'number' && room.maxGuests >= 1 ? room.maxGuests : 1;
        capacity += perRoom * quantity;
    });
    return capacity;
}

export function roomsTooSmallForGuests(
    selected: Record<string, number>,
    rooms: Array<{ roomTypeId: string; maxGuests?: number | null }>,
    guestCount: number,
): boolean {
    return selectedGuestCapacity(selected, rooms) < guestCount;
}

export function canSelectRoomForShift(
    room: AvailableRoomType,
    shift: RoomShift,
    hotelAllowsShift = true,
): boolean {
    if (isShiftStay(shift) && (!hotelAllowsShift || !room.allowShiftBooking)) {
        return false;
    }
    return priceForShift(room, shift) > 0;
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

export function sortHotels(hotels: HotelSearchListItem[], sort: HotelListFilter['sort']): HotelSearchListItem[] {
    const sorted = [...hotels];
    if (sort === 'name') {
        sorted.sort((left, right) => left.name.localeCompare(right.name));
        return sorted;
    }
    sorted.sort((left, right) => (right.rating || 0) - (left.rating || 0));
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
        sort: 'rating',
        minRating: '0',
    };
}
