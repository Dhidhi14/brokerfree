import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as agreementApi from '@/api/agreement.api';
import { getApiResponseError } from '@/lib/api-error';

export const agreementKeys = {
  all: ['agreements'] as const,
  mine: () => [...agreementKeys.all, 'mine'] as const,
  detail: (id: string) => [...agreementKeys.all, 'detail', id] as const,
};

export function useMyAgreementsQuery(enabled = true) {
  return useQuery({
    queryKey: agreementKeys.mine(),
    queryFn: async () => {
      const response = await agreementApi.getMyAgreements();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load agreements'));
      }

      return response.data.agreements;
    },
    enabled,
  });
}

export function useAgreementQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: agreementKeys.detail(id ?? ''),
    queryFn: async () => {
      const response = await agreementApi.getAgreement(id!);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load agreement'));
      }

      return response.data.agreement;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useCreateAgreementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await agreementApi.createAgreement(applicationId);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to create agreement'));
      }

      return response.data.agreement;
    },
    onSuccess: (agreement) => {
      void queryClient.invalidateQueries({ queryKey: agreementKeys.mine() });
      void queryClient.setQueryData(agreementKeys.detail(agreement._id), agreement);
    },
  });
}

export function useSignAgreementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await agreementApi.signAgreement(id);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to sign agreement'));
      }

      return response.data.agreement;
    },
    onSuccess: (agreement) => {
      void queryClient.setQueryData(agreementKeys.detail(agreement._id), agreement);
      void queryClient.invalidateQueries({ queryKey: agreementKeys.mine() });
    },
  });
}
