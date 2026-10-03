import { UserRole } from '../types/auth';
import { isHotelServiceAdmin, loadOperatorAssignment } from './operatorAssignment';

export function isTravelerRole(role: UserRole | string | null | undefined): boolean {
  if (!role) {
    return true;
  }
  return role.toUpperCase() === 'USER';
}

export function roleHome(role: UserRole | string | null | undefined): '/(tabs)' | '/(tabs)/dashboard' {
  return isTravelerRole(role) ? '/(tabs)' : '/(tabs)/dashboard';
}

export async function resolveRoleHome(
  role: UserRole | string | null | undefined,
  userId: string | null | undefined,
): Promise<'/(tabs)' | '/(tabs)/dashboard'> {
  if (isTravelerRole(role) || !userId) {
    return roleHome(role);
  }
  if (String(role).toUpperCase() !== 'SERVICE_ADMIN') {
    return '/(tabs)/dashboard';
  }
  const assignment = await loadOperatorAssignment(userId);
  return isHotelServiceAdmin(role, assignment.serviceType) ? '/(tabs)' : '/(tabs)/dashboard';
}

export function roleBookings(role: UserRole | string | null | undefined): '/(tabs)/bookings' | '/(tabs)/dashboard' {
  return isTravelerRole(role) ? '/(tabs)/bookings' : '/(tabs)/dashboard';
}
