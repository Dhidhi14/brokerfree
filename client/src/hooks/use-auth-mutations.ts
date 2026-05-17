import { useMutation } from '@tanstack/react-query';
import * as authApi from '@/api/auth.api';
import type { LoginPayload, RegisterPayload } from '@/api/auth.api';
import { getApiResponseError } from '@/lib/api-error';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types/user.types';

export function useRegisterMutation() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Registration failed'));
      }

      return response.data;
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
    },
  });
}

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const response = await authApi.sendOtp(phone);

      if (!response.success) {
        throw new Error(getApiResponseError(response, 'Failed to send OTP'));
      }

      return response.data;
    },
  });
}

export function useVerifyOtpMutation() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      const response = await authApi.verifyOtp(phone, otp);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'OTP verification failed'));
      }

      return response.data.user;
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });
}

export function useUpdateRoleMutation() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (role: 'tenant' | 'owner') => {
      const response = await authApi.updateRole(role);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to update role'));
      }

      return response.data;
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
    },
  });
}

export function useLoginMutation() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (credentials: LoginPayload) => login(credentials),
  });
}

export type RegisterRole = Extract<UserRole, 'tenant' | 'owner'>;
