export type DeskBucket = 'arriving' | 'inHouse' | 'departing' | 'unpaid' | 'all';

interface DeskBooking {
  status?: string;
  paymentStatus?: string;
  checkInDate?: string;
  checkOutDate?: string;
  totalPrice?: number;
  shift?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfLocalDay(value: Date): Date {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameLocalDay(value: string | Date, day: Date): boolean {
  const left = startOfLocalDay(new Date(value));
  return left.getTime() === startOfLocalDay(day).getTime();
}

export function formatDeskDate(value: Date | string | undefined | null): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDeskDay(value: Date): string {
  return `${value.getDate()} ${MONTHS[value.getMonth()]}`;
}

export function matchesDeskBucket(booking: DeskBooking, bucket: DeskBucket, now = new Date()): boolean {
  if (bucket === 'all') return true;

  const status = String(booking.status || '').toUpperCase();
  const payment = String(booking.paymentStatus || '').toUpperCase();

  if (bucket === 'unpaid') {
    return payment === 'UNPAID' && (status === 'PENDING' || status === 'CONFIRMED');
  }

  if (status !== 'CONFIRMED') return false;
  if (!booking.checkInDate || !booking.checkOutDate) return false;

  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const today = startOfLocalDay(now);
  const shift = String(booking.shift || '').toUpperCase();

  if (bucket === 'arriving') {
    const sameDay = isSameLocalDay(checkIn, now) && isSameLocalDay(checkOut, now);
    if (sameDay && (shift === 'MORNING' || shift === 'AFTERNOON')) return true;
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
  refundedTotal: number;
  refundedCount: number;
  cancelledCount: number;
  count: number;
} {
  let paidTotal = 0;
  let unpaidTotal = 0;
  let refundedTotal = 0;
  let refundedCount = 0;
  let cancelledCount = 0;

  bookings.forEach((booking) => {
    const price = Number(booking.totalPrice) || 0;
    const payment = String(booking.paymentStatus || '').toUpperCase();
    const status = String(booking.status || '').toUpperCase();
    if (status === 'REFUNDED') {
      refundedCount += 1;
      refundedTotal += price;
      return;
    }
    if (payment === 'PAID') paidTotal += price;
    if (payment === 'UNPAID' && (status === 'PENDING' || status === 'CONFIRMED')) unpaidTotal += price;
    if (status === 'CANCELLED') cancelledCount += 1;
  });

  return {
    paidTotal,
    unpaidTotal,
    refundedTotal,
    refundedCount,
    cancelledCount,
    count: bookings.length,
  };
}

export function inCurrentMonth(value: string | Date | undefined, now = new Date()): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
