import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as escrowApi from '@/api/escrow.api';
import { getApiResponseError } from '@/lib/api-error';
import type { VerifyPaymentPayload } from '@/types/escrow.types';

export const escrowKeys = {
  all: ['escrows'] as const,
  mine: () => [...escrowKeys.all, 'mine'] as const,
  admin: () => [...escrowKeys.all, 'admin'] as const,
  detail: (id: string) => [...escrowKeys.all, 'detail', id] as const,
};

export function useMyEscrowsQuery(enabled = true) {
  return useQuery({
    queryKey: escrowKeys.mine(),
    queryFn: async () => {
      const response = await escrowApi.getMyEscrows();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load escrows'));
      }

      return response.data.escrows;
    },
    enabled,
  });
}

export function useAdminEscrowsQuery(enabled = true) {
  return useQuery({
    queryKey: escrowKeys.admin(),
    queryFn: async () => {
      const response = await escrowApi.getAdminEscrows();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load admin escrows'));
      }

      return response.data.escrows;
    },
    enabled,
  });
}

export function useEscrowQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: escrowKeys.detail(id ?? ''),
    queryFn: async () => {
      const response = await escrowApi.getEscrow(id!);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load escrow'));
      }

      return response.data.escrow;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useCreateEscrowOrderMutation() {
  return useMutation({
    mutationFn: async (agreementId: string) => {
      const response = await escrowApi.createEscrowOrder(agreementId);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to create payment order'));
      }

      return response.data.order;
    },
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: VerifyPaymentPayload) => {
      const response = await escrowApi.verifyPayment(payload);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to verify payment'));
      }

      return response.data.escrow;
    },
    onSuccess: (escrow) => {
      void queryClient.setQueryData(escrowKeys.detail(escrow._id), escrow);
      void queryClient.invalidateQueries({ queryKey: escrowKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: escrowKeys.admin() });
    },
  });
}

export function useReleaseEscrowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const response = await escrowApi.releaseEscrow(id, note);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to release escrow'));
      }

      return response.data.escrow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: escrowKeys.all });
    },
  });
}

export function useRefundEscrowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const response = await escrowApi.refundEscrow(id, note);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to refund escrow'));
      }

      return response.data.escrow;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: escrowKeys.all });
    },
  });
}

export function useDisputeEscrowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const response = await escrowApi.disputeEscrow(id, note);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to report dispute'));
      }

      return response.data.escrow;
    },
    onSuccess: (escrow) => {
      void queryClient.setQueryData(escrowKeys.detail(escrow._id), escrow);
      void queryClient.invalidateQueries({ queryKey: escrowKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: escrowKeys.admin() });
    },
  });
}
