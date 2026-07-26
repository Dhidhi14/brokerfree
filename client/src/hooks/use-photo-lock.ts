import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as photoLockApi from '@/api/photo-lock.api';
import { getApiResponseError } from '@/lib/api-error';

export const photoLockKeys = {
  all: ['photo-lock'] as const,
  detail: (agreementId: string) => [...photoLockKeys.all, 'detail', agreementId] as const,
};

export function usePhotoLockQuery(agreementId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: photoLockKeys.detail(agreementId ?? ''),
    queryFn: async () => {
      const response = await photoLockApi.getPhotoLock(agreementId!);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load photo lock'));
      }

      return response.data.photoLock;
    },
    enabled: enabled && Boolean(agreementId),
  });
}

export function useSubmitMoveInMutation(agreementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await photoLockApi.submitMoveInPhotos(agreementId, formData);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to submit move-in photos'));
      }

      return response.data.photoLock;
    },
    onSuccess: (photoLock) => {
      queryClient.setQueryData(photoLockKeys.detail(agreementId), photoLock);
    },
  });
}

export function useSubmitMoveOutMutation(agreementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await photoLockApi.submitMoveOutPhotos(agreementId, formData);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to submit move-out photos'));
      }

      return response.data.photoLock;
    },
    onSuccess: (photoLock) => {
      queryClient.setQueryData(photoLockKeys.detail(agreementId), photoLock);
    },
  });
}
