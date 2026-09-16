export type UserRole =
  | 'user'
  | 'admin'
  | 'masterAdmin'
  | 'SERVICE_ADMIN'
  | 'MASTER_ADMIN'
  | 'EMPLOYEE'
  | 'USER';

export type AuthUser = {
  id: string;
  email: string;
  userName: string;
  role: UserRole;
  imageUrl?: string;
  userStatus?: string;
  // --- FE User fields used by dashboards (additive, optional) ---
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  serviceType?: string;
  serviceEntityId?: string;
  serviceEntityName?: string;
  serviceAddressId?: string;
  employeeServiceType?: string;
  employeeServiceEntityId?: string;
  employeeServiceEntityName?: string;
  employeeServiceAddressId?: string;
  paymentStatus?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthState = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
};

export type ApiResponse<T> = {
  data: T;
  status?: string;
  message?: string;
};

/**
 * Full FE `User` shape (global.d.ts). Does not replace AuthUser.
 */
export interface User {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  role: string;
  serviceType?: string;
  serviceEntityId?: string;
  serviceEntityName?: string;
  serviceAddressId?: string;
  employeeServiceType?: string;
  employeeServiceEntityId?: string;
  employeeServiceEntityName?: string;
  employeeServiceAddressId?: string;
  userStatus: string;
  paymentStatus: string;
  emailVerified?: Date | string;
  phoneVerified?: Date | string;
  createdAt: string;
  spent: number;
  earned: number;
}

export type UserData = {
  userName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export interface Account {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  type: string;
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: number;
  idToken?: string;
  scope?: string;
  tokenType?: string;
  sessionState?: string;
}
