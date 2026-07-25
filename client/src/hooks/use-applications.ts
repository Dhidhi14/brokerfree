import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as applicationApi from '@/api/application.api';
import { getApiResponseError } from '@/lib/api-error';
import type {
  CreateApplicationPayload,
  ReceivedApplicationsFilters,
} from '@/types/application.types';

export const applicationKeys = {
  all: ['applications'] as const,
  mine: () => [...applicationKeys.all, 'mine'] as const,
  received: (filters: ReceivedApplicationsFilters = {}) =>
    [...applicationKeys.all, 'received', filters] as const,
  detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
};

export function useMyApplicationsQuery(enabled = true) {
  return useQuery({
    queryKey: applicationKeys.mine(),
    queryFn: async () => {
      const response = await applicationApi.getMyApplications();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load applications'));
      }

      return response.data.applications;
    },
    enabled,
  });
}

export function useReceivedApplicationsQuery(
  filters: ReceivedApplicationsFilters = {},
  enabled = true
) {
  return useQuery({
    queryKey: applicationKeys.received(filters),
    queryFn: async () => {
      const response = await applicationApi.getReceivedApplications(filters);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load received applications'));
      }

      return response.data.applications;
    },
    enabled,
  });
}

export function useApplicationQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: async () => {
      const response = await applicationApi.getApplication(id!);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load application'));
      }

      return response.data.application;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationPayload) => {
      const response = await applicationApi.createApplication(data);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to submit application'));
      }

      return response.data.application;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useRespondToApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      decision,
      ownerResponse,
    }: {
      id: string;
      decision: 'accept' | 'reject';
      ownerResponse?: string;
    }) => {
      const response = await applicationApi.respondToApplication(id, decision, ownerResponse);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to respond to application'));
      }

      return response.data.application;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
    },
  });
}

export function useWithdrawApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await applicationApi.withdrawApplication(id);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to withdraw application'));
      }

      return response.data.application;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}
