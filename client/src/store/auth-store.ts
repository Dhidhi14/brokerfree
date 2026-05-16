import { create } from 'zustand';
import * as authApi from '@/api/auth.api';
import type { LoginPayload } from '@/api/auth.api';
import { ACCESS_TOKEN_KEY } from '@/api/client';
import type { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

function persistToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

function readStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: user !== null });
  },

  setAccessToken: (token) => {
    persistToken(token);
    set({ accessToken: token });
  },

  login: async (credentials) => {
    const response = await authApi.login(credentials);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message ?? 'Login failed');
    }

    const { user, accessToken } = response.data;
    persistToken(accessToken);
    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Session may already be invalid
    }

    persistToken(null);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  initialize: async () => {
    const storedToken = readStoredToken();

    if (!storedToken) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    set({ accessToken: storedToken });

    try {
      const response = await authApi.getMe();

      if (response.success && response.data?.user) {
        set({
          user: response.data.user,
          accessToken: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch {
      // Token invalid or network error
    }

    persistToken(null);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
