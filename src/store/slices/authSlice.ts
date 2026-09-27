import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthUser, AuthTokens, ApiResponse } from '../../types/auth';
import axios from 'axios';
import { createApi, getApiInstance, setLogoutCallback } from '../../services/api/axiosClient';
import { saveTokens, clearTokens, saveUserIdAndRole, clearUserIdAndRole, getUserIdAndRole, saveUser, getUser, clearUser } from '../../lib/secureStore';
import { API_BASE_URL } from '../../constants/api';
import { OAuthProvider } from '../../constants/oauth';

// We'll export a function to initialize the API base URL from the app bootstrap
export const configureApi = (baseURL: string) => {
  createApi(baseURL);
};

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
};

export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { rejectWithValue }) => {
  try {
    console.log('[initializeAuth] Reading tokens from SecureStore...');
    const tokensRes = await (await import('../../lib/secureStore')).getTokens();
    const userData = await getUser();
    if (tokensRes && userData) {
      console.log('[initializeAuth] Found existing tokens and user, restoring auth state');
      return { tokens: tokensRes, user: userData } as any;
    }
    console.log('[initializeAuth] No existing tokens found');
    return null;
  } catch (e) {
    console.error('[initializeAuth] Error:', e);
    return rejectWithValue('Failed to initialize auth');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (payload: { email: string; password: string }, { rejectWithValue }) => {
  try {
    console.log('[loginUser] Starting login...', payload);
    const api = getApiInstance();
    console.log('[loginUser] API instance obtained');
    const res = await api.post('/api/auth/login-jwt', payload);
    console.log('[loginUser] Login response:', res.data);
    const data = res.data as ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>;
    await saveTokens({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
    await saveUserIdAndRole(data.data.user.id, data.data.user.role);
    await saveUser(data.data.user);
    console.log('[loginUser] Success');
    return { tokens: { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }, user: data.data.user };
  } catch (e: any) {
    console.error('[loginUser] Error:', e?.response?.data || e.message);
    return rejectWithValue(e?.response?.data || e.message);
  }
});

export const registerUser = createAsyncThunk('auth/register', async (payload: { email: string; password: string; userName: string; role: string }, { rejectWithValue }) => {
  try {
    console.log('[registerUser] Starting register...', payload);
    // Use direct axios + API_BASE_URL to avoid triggering auth interceptors/refresh logic
    // The anonymous mobile registration endpoint is `/api/auth/register-jwt` (server expects this)
    const res = await axios.post(`${API_BASE_URL}/api/auth/register-jwt`, payload, { timeout: 10000 });
    console.log('[registerUser] Register response:', res.data);
    const data = res.data as ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>;
    await saveTokens({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
    await saveUserIdAndRole(data.data.user.id, data.data.user.role);
    await saveUser(data.data.user);
    console.log('[registerUser] Success');
    return { tokens: { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }, user: data.data.user };
  } catch (e: any) {
    console.error('[registerUser] Error:', e?.response?.data || e.message);
    // Prefer server-provided message if present
    const serverMsg = e?.response?.data?.message ?? e?.response?.data ?? e?.message;
    return rejectWithValue(serverMsg);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const tokens = await (await import('../../lib/secureStore')).getTokens();
    const api = getApiInstance();
    if (tokens) {
      await api.post('/api/auth/logout-jwt', { refreshToken: tokens.refreshToken });
    }
    await clearTokens();
    await clearUserIdAndRole();
    await clearUser();
    return true;
  } catch (e: any) {
    // still clear local tokens
    await clearTokens();
    await clearUserIdAndRole();
    await clearUser();
    return rejectWithValue(e?.response?.data || e.message);
  }
});

export const loginWithOAuth = createAsyncThunk<
  { tokens: AuthTokens; user: AuthUser },
  { provider: OAuthProvider; token: string },
  { rejectValue: string }
>(
  'auth/loginWithOAuth',
  async (_payload: { provider: OAuthProvider; token: string }, { rejectWithValue }) => {
    return rejectWithValue('Social sign-in is not available in this app version.');
  }
);

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (s) => {
        s.isInitializing = true;
      })
      .addCase(initializeAuth.fulfilled, (s, a: PayloadAction<any>) => {
        s.isInitializing = false;
        if (a.payload) {
          s.tokens = a.payload.tokens;
          s.user = a.payload.user;
          s.isAuthenticated = true;
        } else {
          s.isAuthenticated = false;
        }
      })
      .addCase(initializeAuth.rejected, (s) => {
        s.isInitializing = false;
        s.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.isLoading = false;
        s.tokens = a.payload.tokens;
        s.user = a.payload.user;
        s.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (s, a: any) => {
        s.isLoading = false;
        s.error = a.payload || String(a.error?.message || a.error);
      })
      .addCase(registerUser.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.isLoading = false;
        s.tokens = a.payload.tokens;
        s.user = a.payload.user;
        s.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (s, a: any) => {
        s.isLoading = false;
        s.error = a.payload || String(a.error?.message || a.error);
      })
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null;
        s.tokens = null;
        s.isAuthenticated = false;
      })
      .addCase(loginWithOAuth.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(loginWithOAuth.fulfilled, (s, a) => {
        s.isLoading = false;
        s.tokens = a.payload.tokens;
        s.user = a.payload.user;
        s.isAuthenticated = true;
      })
      .addCase(loginWithOAuth.rejected, (s, a: any) => {
        s.isLoading = false;
        s.error = a.payload || String(a.error?.message || a.error);
      });
  },
});

export const { clearError } = slice.actions;

export default slice.reducer;
