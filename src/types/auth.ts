export type UserRole =
  | 'USER'
  | 'SERVICE_ADMIN'
  | 'MASTER_ADMIN'
  | 'EMPLOYEE'
  | 'user'
  | 'admin'
  | 'masterAdmin';

export type AuthUser = {
  id: string;
  email: string;
  userName: string;
  role: UserRole;
  imageUrl?: string;
  userStatus?: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
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
};
