import { apiGet, apiPost } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  CreateReviewPayload,
  Review,
  ReviewStatus,
} from '@/types/review.types';

export interface ReviewData {
  review: Review;
}

export interface ReviewsData {
  reviews: Review[];
}

export function createReview(
  payload: CreateReviewPayload
): Promise<ApiResponse<ReviewData>> {
  return apiPost<ReviewData>('/reviews', payload);
}

export function getUserReviews(userId: string): Promise<ApiResponse<ReviewsData>> {
  return apiGet<ReviewsData>(`/reviews/user/${userId}`);
}

export function getReviewStatus(
  agreementId: string
): Promise<ApiResponse<ReviewStatus>> {
  return apiGet<ReviewStatus>(`/reviews/agreement/${agreementId}/status`);
}
