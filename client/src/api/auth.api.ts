import { apiGet, apiPatch, apiPost } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type { User, UserRole } from '@/types/user.types';

export interface RegisterPayload {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSessionData {
  user: User;
  accessToken: string;
}

export interface MessageData {
  message: string;
}

export function register(
  data: RegisterPayload
): Promise<ApiResponse<AuthSessionData>> {
  return apiPost<AuthSessionData>('/auth/register', data);
}

export function login(
  credentials: LoginPayload
): Promise<ApiResponse<AuthSessionData>> {
  return apiPost<AuthSessionData>('/auth/login', credentials);
}

export function logout(): Promise<ApiResponse<MessageData>> {
  return apiPost<MessageData>('/auth/logout');
}

export function sendOtp(phone: string): Promise<ApiResponse<MessageData>> {
  return apiPost<MessageData>('/auth/send-otp', { phone });
}

export function verifyOtp(
  phone: string,
  otp: string
): Promise<ApiResponse<{ user: User }>> {
  return apiPost<{ user: User }>('/auth/verify-otp', { phone, otp });
}

export function refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
  return apiPost<{ accessToken: string }>('/auth/refresh-token');
}

export function getMe(): Promise<ApiResponse<{ user: User }>> {
  return apiGet<{ user: User }>('/auth/me');
}

export function updateRole(
  role: 'tenant' | 'owner'
): Promise<ApiResponse<{ user: User }>> {
  return apiPatch<{ user: User }>('/auth/role', { role });
}
