import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from '@/types/api.types';
import { useAuthStore } from '@/store/auth-store';

const ACCESS_TOKEN_KEY = 'brokerfree_access_token';

export { ACCESS_TOKEN_KEY };

const baseURL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

/** 401s on these routes are expected auth outcomes — do not refresh or hard-redirect. */
const SKIP_AUTH_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/logout',
] as const;

const AUTH_PAGE_PATHS = new Set(['/login', '/register', '/verify-otp']);

function shouldSkipAuthRefresh(url: string | undefined): boolean {
  if (!url) {
    return true;
  }
  return SKIP_AUTH_REFRESH_PATHS.some((path) => url.includes(path));
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<{ accessToken: string }>>(
        `${baseURL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      )
      .then((response) => {
        const { data } = response;
        if (!data.success || !data.data?.accessToken) {
          return null;
        }
        const token = data.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipAuthRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newToken = await refreshAccessToken();

    if (!newToken) {
      await useAuthStore.getState().logout();
      // Soft-fail on auth pages so login/register can show toasts instead of reloading.
      if (!AUTH_PAGE_PATHS.has(window.location.pathname)) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(originalRequest);
  }
);

function unwrapResponse<T>(response: { data: ApiResponse<T> }): ApiResponse<T> {
  return response.data;
}

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return unwrapResponse(response);
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, body, config);
  return unwrapResponse(response);
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(url, body, config);
  return unwrapResponse(response);
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<ApiResponse<T>>(url, body, config);
  return unwrapResponse(response);
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return unwrapResponse(response);
}
