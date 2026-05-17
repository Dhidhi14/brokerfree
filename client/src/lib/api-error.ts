import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api.types';

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong'
): string {
  if (error instanceof Error && error.message && !isAxiosError(error)) {
    return error.message;
  }

  const axiosError = error as AxiosError<ApiResponse<unknown>>;
  const apiMessage = axiosError.response?.data?.error?.message;

  if (apiMessage) {
    return apiMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function isAxiosError(error: Error): boolean {
  return 'isAxiosError' in error;
}

export function getApiResponseError(
  response: ApiResponse<unknown>,
  fallback = 'Request failed'
): string {
  return response.error?.message ?? fallback;
}
