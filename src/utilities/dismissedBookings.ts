import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(userId: string): string {
  return `cholobd.dismissedBookings.${userId}`;
}

export function bookingCardKey(kind: string, id: string): string {
  return `${kind}:${id}`;
}

export async function loadDismissedBookingKeys(userId: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) {
      return new Set();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

export async function dismissBookingCard(userId: string, kind: string, id: string): Promise<Set<string>> {
  const next = await loadDismissedBookingKeys(userId);
  next.add(bookingCardKey(kind, id));
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify([...next]));
  return next;
}
