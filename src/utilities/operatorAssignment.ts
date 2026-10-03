import { getUserProfile } from '../services/api/users';

export interface OperatorAssignment {
  userId: string;
  serviceType: string | null;
}

let cached: OperatorAssignment | null = null;
let inflight: { userId: string; promise: Promise<OperatorAssignment> } | null = null;
const listeners = new Set<() => void>();

export function isHotelServiceAdmin(
  role: string | null | undefined,
  serviceType: string | null | undefined,
): boolean {
  return String(role || '').toUpperCase() === 'SERVICE_ADMIN' && serviceType === 'HOTEL_BOOKING';
}

export function readOperatorAssignment(userId: string | null | undefined): OperatorAssignment | null {
  if (!userId || cached?.userId !== userId) {
    return null;
  }
  return cached;
}

export function subscribeOperatorAssignment(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish(next: OperatorAssignment): void {
  cached = next;
  listeners.forEach((listener) => listener());
}

export function loadOperatorAssignment(userId: string): Promise<OperatorAssignment> {
  if (inflight?.userId === userId) {
    return inflight.promise;
  }
  const promise = getUserProfile()
    .then((profile) => {
      const serviceType = typeof profile?.serviceType === 'string' ? profile.serviceType : null;
      const next = { userId, serviceType };
      publish(next);
      return next;
    })
    .catch(() => {
      if (cached?.userId === userId) {
        return cached;
      }
      const next = { userId, serviceType: null };
      publish(next);
      return next;
    })
    .finally(() => {
      if (inflight?.userId === userId) {
        inflight = null;
      }
    });
  inflight = { userId, promise };
  return promise;
}
