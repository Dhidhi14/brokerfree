import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as propertyApi from '@/api/property.api';
import { getApiResponseError } from '@/lib/api-error';
import type { PropertyListFilters, NearbySearchParams } from '@/types/property.types';

export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filters: PropertyListFilters) => [...propertyKeys.lists(), filters] as const,
  nearby: (params: NearbySearchParams) => [...propertyKeys.all, 'nearby', params] as const,
  detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
  mine: () => [...propertyKeys.all, 'mine'] as const,
  pending: () => [...propertyKeys.all, 'pending'] as const,
  videoStatus: (id: string) => [...propertyKeys.all, 'video-status', id] as const,
};

export function usePropertiesQuery(filters: PropertyListFilters, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: async () => {
      const response = await propertyApi.listProperties(filters);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load properties'));
      }

      return response.data;
    },
    enabled,
  });
}

export function usePropertyQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.detail(id ?? ''),
    queryFn: async () => {
      const response = await propertyApi.getProperty(id!);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load property'));
      }

      return response.data.property;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useMyPropertiesQuery(enabled = true) {
  return useQuery({
    queryKey: propertyKeys.mine(),
    queryFn: async () => {
      const response = await propertyApi.getMyProperties();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load your properties'));
      }

      return response.data.properties;
    },
    enabled,
  });
}

export function usePendingPropertiesQuery(enabled = true) {
  return useQuery({
    queryKey: propertyKeys.pending(),
    queryFn: async () => {
      const response = await propertyApi.getPendingProperties();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load pending properties'));
      }

      return response.data.pending;
    },
    enabled,
  });
}

export function useCreatePropertyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await propertyApi.createProperty(formData);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to create property'));
      }

      return response.data.property;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.pending() });
    },
  });
}

export function useUpdatePropertyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const response = await propertyApi.updateProperty(id, data);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to update property'));
      }

      return response.data.property;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

export function useDeletePropertyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await propertyApi.deleteProperty(id);

      if (!response.success) {
        throw new Error(getApiResponseError(response, 'Failed to delete property'));
      }

      return id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.pending() });
    },
  });
}

export function useReviewPropertyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      decision,
      rejectionReason,
    }: {
      id: string;
      decision: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      const response = await propertyApi.reviewProperty(id, decision, rejectionReason);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to review property'));
      }

      return response.data.property;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: propertyKeys.pending() });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

export function useVideoStatusQuery(propertyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.videoStatus(propertyId ?? ''),
    queryFn: async () => {
      const response = await propertyApi.getVideoStatus(propertyId!);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load video verification status'));
      }

      return response.data.videoVerification;
    },
    enabled: enabled && Boolean(propertyId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'processing' ? 3000 : false;
    },
  });
}

export function useSubmitVideoTourMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      formData,
    }: {
      propertyId: string;
      formData: FormData;
    }) => {
      const response = await propertyApi.submitVideoTour(propertyId, formData);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to submit video tour'));
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(propertyKeys.videoStatus(data.propertyId), data.videoVerification);
      void queryClient.invalidateQueries({ queryKey: propertyKeys.detail(data.propertyId) });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.mine() });
    },
  });
}
