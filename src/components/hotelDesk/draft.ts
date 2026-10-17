export type SlotKey = 'morning' | 'afternoon' | 'night';

export interface SlotDraft {
  morning: string;
  afternoon: string;
  night: string;
}

export interface SlotOpen {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export const SLOT_KEYS: SlotKey[] = ['morning', 'afternoon', 'night'];

export const GUESTS_BY_TYPE: Record<string, number> = {
  SINGLE: 1,
  DOUBLE: 2,
  DELUXE: 2,
  SUITE: 4,
};

export const ROOM_TYPE_OPTIONS = ['SINGLE', 'DOUBLE', 'DELUXE', 'SUITE'];

export function clockValue(value: unknown): string {
  const match = String(value || '').trim().match(/^(\d{2}:\d{2})/);
  return match ? match[1] : '';
}

export function guestString(value: unknown): string {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < 1) return '2';
  return String(amount);
}

export function guestIsInvalid(value: string): boolean {
  const amount = Number(value.trim());
  return !Number.isInteger(amount) || amount < 1 || amount > 10;
}

export function priceAmount(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export function slotString(value: unknown): string {
  const amount = priceAmount(value);
  return amount == null ? '' : String(amount);
}

export function parseSlot(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export function slotIsInvalid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const amount = Number(trimmed);
  return !Number.isFinite(amount) || amount <= 0;
}

export function openFromSlots(slots: SlotDraft): SlotOpen {
  return {
    morning: slots.morning.trim().length > 0,
    afternoon: slots.afternoon.trim().length > 0,
    night: slots.night.trim().length > 0,
  };
}

export function slotsFromRoomType(roomType: any): SlotDraft {
  return {
    morning: slotString(roomType?.morningShiftPrice),
    afternoon: slotString(roomType?.afternoonShiftPrice),
    night: slotString(roomType?.nightShiftPrice),
  };
}

export function textForAppLanguage(english?: string | null, bangla?: string | null, banglaApp?: boolean): string {
  if (banglaApp && bangla?.trim()) return bangla.trim();
  return (english || '').trim();
}

export function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}
