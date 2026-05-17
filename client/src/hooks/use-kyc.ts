import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as kycApi from '@/api/kyc.api';
import { getApiResponseError } from '@/lib/api-error';

export const kycKeys = {
  all: ['kyc'] as const,
  status: () => [...kycKeys.all, 'status'] as const,
  pending: () => [...kycKeys.all, 'pending'] as const,
};

export function useKycStatusQuery(enabled = true) {
  return useQuery({
    queryKey: kycKeys.status(),
    queryFn: async () => {
      const response = await kycApi.getKycStatus();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load KYC status'));
      }

      return response.data.kyc;
    },
    enabled,
  });
}

export function usePendingKycQuery(enabled = true) {
  return useQuery({
    queryKey: kycKeys.pending(),
    queryFn: async () => {
      const response = await kycApi.getPendingKyc();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load pending verifications'));
      }

      return response.data.pending;
    },
    enabled,
  });
}

export function useSubmitKycMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await kycApi.submitKyc(formData);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to submit KYC'));
      }

      return response.data.kyc;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: kycKeys.status() });
    },
  });
}

export function useReviewKycMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      decision,
      rejectionReason,
    }: {
      userId: string;
      decision: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      const response = await kycApi.reviewKyc(userId, decision, rejectionReason);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to review KYC'));
      }

      return response.data.kyc;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: kycKeys.pending() });
    },
  });
}
