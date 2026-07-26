import { apiClient, apiGet } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type { PhotoLock } from '@/types/photo-lock.types';

export interface PhotoLockData {
  photoLock: PhotoLock;
}

export function getPhotoLock(agreementId: string): Promise<ApiResponse<PhotoLockData>> {
  return apiGet<PhotoLockData>(`/photo-lock/${agreementId}`);
}

export async function submitMoveInPhotos(
  agreementId: string,
  formData: FormData
): Promise<ApiResponse<PhotoLockData>> {
  const response = await apiClient.post<ApiResponse<PhotoLockData>>(
    `/photo-lock/${agreementId}/move-in`,
    formData,
    {
      headers: { 'Content-Type': undefined },
    }
  );
  return response.data;
}

export async function submitMoveOutPhotos(
  agreementId: string,
  formData: FormData
): Promise<ApiResponse<PhotoLockData>> {
  const response = await apiClient.post<ApiResponse<PhotoLockData>>(
    `/photo-lock/${agreementId}/move-out`,
    formData,
    {
      headers: { 'Content-Type': undefined },
    }
  );
  return response.data;
}
