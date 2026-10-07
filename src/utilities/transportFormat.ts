import { addDays, format, parseISO } from 'date-fns';
import { TRANSLATION_KEYS } from '../constants/translationKeys';
import { TransportSeat } from '../types/transports';

const OPERATOR_STATUS_KEYS: Record<string, string> = {
  PENDING: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_PENDING,
  CONFIRMED: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_CONFIRMED,
  CANCELLED: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_CANCELLED,
  REFUNDED: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_REFUNDED,
  COMPLETED: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_COMPLETED,
  PAID: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_PAID,
  UNPAID: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_UNPAID,
  ACCEPTED: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_ACCEPTED,
  NO_SHOW: TRANSLATION_KEYS.TRANSPORT_OPERATOR.STATUS_NO_SHOW,
  MALE: TRANSLATION_KEYS.TRANSPORT_OPERATOR.MALE,
  FEMALE: TRANSLATION_KEYS.TRANSPORT_OPERATOR.FEMALE,
};

export function operatorStatusLabel(
  value: string | null | undefined,
  t: (key: string) => string
): string {
  if (!value) return '—';
  const key = OPERATOR_STATUS_KEYS[value];
  return key ? t(key) : value.replace(/_/g, ' ');
}

export function formatTripClock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatTripDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return `${format(date, 'EEE, d MMM yyyy')} · ${format(date, 'h:mm a')}`;
  } catch {
    return date.toLocaleString();
  }
}

export function formatTripDayKey(value: string): string {
  try {
    return format(parseISO(value), 'yyyy-MM-dd');
  } catch {
    return value;
  }
}

export function buildDateStrip(centerDate: string, radius = 3): string[] {
  const center = parseISO(centerDate);
  const days: string[] = [];
  for (let offset = -radius; offset <= radius; offset += 1) {
    days.push(format(addDays(center, offset), 'yyyy-MM-dd'));
  }
  return days;
}

export function sumSelectedSeatPrices(seats: TransportSeat[]): number {
  return seats.reduce((sum, seat) => sum + (seat.transportClass?.basePrice ?? 0), 0);
}

export function holdSecondsRemaining(expiresAt: string): number {
  const end = new Date(expiresAt).getTime();
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}

export function formatHoldCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
