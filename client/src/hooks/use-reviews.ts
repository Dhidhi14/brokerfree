import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as reviewApi from '@/api/review.api';
import { propertyKeys } from '@/hooks/use-properties';
import { getApiResponseError } from '@/lib/api-error';
import type { CreateReviewPayload } from '@/types/review.types';

export const reviewKeys = {
  all: ['reviews'] as const,
  user: (userId: string) => [...reviewKeys.all, 'user', userId] as const,
  status: (agreementId: string) => [...reviewKeys.all, 'status', agreementId] as const,
};

export function useReviewStatusQuery(agreementId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.status(agreementId ?? ''),
    queryFn: async () => {
      const response = await reviewApi.getReviewStatus(agreementId!);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load review status'));
      }

      return response.data;
    },
    enabled: enabled && Boolean(agreementId),
  });
}

export function useUserReviewsQuery(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.user(userId ?? ''),
    queryFn: async () => {
      const response = await reviewApi.getUserReviews(userId!);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load reviews'));
      }

      return response.data.reviews;
    },
    enabled: enabled && Boolean(userId),
  });
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload) => {
      const response = await reviewApi.createReview(payload);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to submit review'));
      }

      return response.data.review;
    },
    onSuccess: (review) => {
      void queryClient.invalidateQueries({
        queryKey: reviewKeys.status(review.agreement),
      });
      void queryClient.invalidateQueries({
        queryKey: reviewKeys.user(
          typeof review.reviewee === 'string' ? review.reviewee : String(review.reviewee)
        ),
      });
      void queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
}
