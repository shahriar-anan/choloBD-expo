/**
 * Auth Hook with Admin Check
 * Custom hook for accessing auth state and checking admin status
 */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { AuthUser, UserRole } from '../types/auth';
import { getUserProfile } from '../services/api/users';

/**
 * Check if user has admin role (includes SERVICE_ADMIN)
 */
function isMasterAdminUser(user: AuthUser | null): boolean {
  const isAdmin =
    user?.role === 'MASTER_ADMIN' ||
    user?.role === 'masterAdmin' ||
    user?.role === 'admin' ||
    user?.role === 'SERVICE_ADMIN';
  return isAdmin;
}

/**
 * Check if user has master admin role specifically
 */
function isMasterAdmin(user: AuthUser | null): boolean {
  return user?.role === 'MASTER_ADMIN' || user?.role === 'masterAdmin';
}

export interface AuthWithAdminStatus {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  userRole: UserRole | null;
}

/**
 * Custom hook: useAuthWithAdminCheck
 * Returns auth state plus admin/masterAdmin status flags
 */
export function useAuthWithAdminCheck(): AuthWithAdminStatus {
  const auth = useSelector((state: RootState) => state.auth);
  const role = auth.user?.role;
  const userId = auth.user?.id;
  const [blocksTourAdmin, setBlocksTourAdmin] = useState(role === 'SERVICE_ADMIN');

  useEffect(() => {
    if (role !== 'SERVICE_ADMIN' || !userId) {
      setBlocksTourAdmin(false);
      return;
    }

    let cancelled = false;
    setBlocksTourAdmin(true);
    getUserProfile()
      .then((profile) => {
        if (cancelled) return;
        setBlocksTourAdmin(profile?.serviceType === 'HOTEL_BOOKING');
      })
      .catch(() => {
        if (!cancelled) setBlocksTourAdmin(true);
      });

    return () => {
      cancelled = true;
    };
  }, [role, userId]);

  const isAdmin = isMasterAdminUser(auth.user) && !blocksTourAdmin;

  if (__DEV__) console.log('[useAuthWithAdminCheck] Hook called, user role:', role, 'isAdmin:', isAdmin);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isInitializing: auth.isInitializing,
    error: auth.error,
    isAdmin,
    isMasterAdmin: isMasterAdmin(auth.user),
    userRole: role ?? null,
  };
}

/**
 * Helper hook: Check if current user can perform admin actions
 */
export function useCanPerformAdminActions(): boolean {
  const { isAdmin } = useAuthWithAdminCheck();
  if (__DEV__) console.log('[useAuthWithAdminCheck] canPerformAdminActions:', isAdmin);
  return isAdmin;
}

if (__DEV__) console.log('[useAuthWithAdminCheck] Hook module loaded');
