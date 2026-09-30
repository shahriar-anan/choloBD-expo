export type DeskBucket = 'arriving' | 'inHouse' | 'departing' | 'all';

interface DeskBooking {
  status?: string;
  paymentStatus?: string;
  checkInDate?: string;
  checkOutDate?: string;
  totalPrice?: number;
}

function startOfLocalDay(value: Date): Date {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameLocalDay(value: string | Date, day: Date): boolean {
  const left = startOfLocalDay(new Date(value));
  return left.getTime() === startOfLocalDay(day).getTime();
}

export function matchesDeskBucket(booking: DeskBooking, bucket: DeskBucket, now = new Date()): boolean {
  if (bucket === 'all') return true;
  if (String(booking.status || '').toUpperCase() !== 'CONFIRMED') return false;
  if (!booking.checkInDate || !booking.checkOutDate) return false;

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const today = startOfLocalDay(now);

  if (bucket === 'arriving') {
    return isSameLocalDay(checkIn, now) && !isSameLocalDay(checkOut, now);
  }

  if (bucket === 'departing') {
    return isSameLocalDay(checkOut, now) && startOfLocalDay(checkIn).getTime() < today.getTime();
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return checkIn < today && checkOut >= tomorrow;
}

export function canRecordStay(booking: DeskBooking, now = new Date()): boolean {
  if (String(booking.status || '').toUpperCase() !== 'CONFIRMED') return false;
  if (String(booking.paymentStatus || '').toUpperCase() !== 'PAID') return false;
  if (!booking.checkInDate) return false;
  return now >= new Date(booking.checkInDate);
}

export function summarizeBookings(bookings: DeskBooking[]): {
  paidTotal: number;
  unpaidTotal: number;
  cancelledCount: number;
  count: number;
} {
  let paidTotal = 0;
  let unpaidTotal = 0;
  let cancelledCount = 0;

  bookings.forEach((booking) => {
    const price = Number(booking.totalPrice) || 0;
    const payment = String(booking.paymentStatus || '').toUpperCase();
    if (payment === 'PAID') paidTotal += price;
    if (payment === 'UNPAID') unpaidTotal += price;
    if (String(booking.status || '').toUpperCase() === 'CANCELLED') cancelledCount += 1;
  });

  return { paidTotal, unpaidTotal, cancelledCount, count: bookings.length };
}
