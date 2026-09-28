import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { getTokens, saveTokens, clearTokens } from '../../lib/secureStore';

let api: AxiosInstance | null = null;
let apiBaseURL = '';

type LogoutCallback = () => void;
let onLogout: LogoutCallback | null = null;
let refreshInFlight: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

function decodeJwtExpiry(token: string): number | null {
  const segment = token.split('.')[1];
  if (!segment || typeof atob !== 'function') {
    return null;
  }
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isAccessTokenStale(token: string): boolean {
  const expiry = decodeJwtExpiry(token);
  if (!expiry) {
    return false;
  }
  return expiry * 1000 <= Date.now() + 60_000;
}

export async function ensureFreshAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const tokens = await getTokens();
  if (!tokens?.accessToken || !tokens.refreshToken) {
    return null;
  }
  if (!isAccessTokenStale(tokens.accessToken)) {
    return tokens;
  }
  return refreshStoredAccessToken();
}

export async function refreshStoredAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const tokens = await getTokens();
    if (!tokens?.refreshToken || !apiBaseURL) {
      return null;
    }
    const refreshRes = await axios.post(`${apiBaseURL}/api/auth/refresh`, { refreshToken: tokens.refreshToken });
    const data = refreshRes.data as { data: { accessToken: string; refreshToken: string } };
    const newTokens = { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken };
    await saveTokens(newTokens);
    return newTokens;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export function setLogoutCallback(cb: LogoutCallback) {
  onLogout = cb;
}

export function createApi(baseURL: string) {
  apiBaseURL = baseURL;
  api = axios.create({ baseURL, timeout: 10000 });

  api.interceptors.request.use(async (cfg) => {
    try {
      const tokens = await getTokens();
      let accessToken = tokens?.accessToken;
      if (accessToken && isAccessTokenStale(accessToken)) {
        try {
          const refreshed = await refreshStoredAccessToken();
          if (refreshed?.accessToken) {
            accessToken = refreshed.accessToken;
          }
        } catch {
          // The stored access token is sent. A 401 still refreshes once.
        }
      }
      if (accessToken && cfg.headers) {
        cfg.headers.Authorization = `Bearer ${accessToken}`;
      }
      console.log('[axios.request] 📡', cfg.method?.toUpperCase(), cfg.url, {
        hasAuth: !!accessToken,
        baseURL: cfg.baseURL || baseURL
      });
    } catch (e) {
      // ignore
    }
    return cfg;
  });

  api.interceptors.response.use(
    (res) => {
      console.log('[axios.response] ✅', res.status, res.config.url, {
        dataKeys: res.data?.data ? Object.keys(res.data.data).slice(0, 5) : 'N/A',
        isArray: Array.isArray(res.data?.data)
      });
      return res;
    },
    async (error: AxiosError) => {
      const original = error.config as AxiosRequestConfig & { _retry?: boolean };
      const canRefresh = error.response?.status === 401 && original && !original._retry;
      if (!canRefresh) {
        console.error('[axios.error] ❌', {
          message: error.message,
          url: error.config?.url,
          method: error.config?.method,
          baseURL: (error.config as any)?.baseURL || api?.defaults.baseURL,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
      if (canRefresh && original) {
        original._retry = true;
        try {
          const newTokens = await refreshStoredAccessToken();
          if (!newTokens) throw new Error('no refresh token');
          if (!api) throw new Error('api missing');
          if (original.headers) original.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(original as AxiosRequestConfig);
        } catch (e) {
          console.error('[axios.error] ❌ session refresh failed', {
            url: original.url,
            status: error.response?.status,
          });
          await clearTokens();
          if (onLogout) onLogout();
          return Promise.reject(e);
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
}

export function getApiInstance() {
  if (!api) throw new Error('API not created. Call createApi(baseURL) first.');
  return api;
}
