export interface ReviewRating {
  average: number;
  count: number;
}

export interface ReviewReviewerSummary {
  _id: string;
  fullName: string;
}

export interface Review {
  _id: string;
  agreement: string;
  reviewer: string | ReviewReviewerSummary;
  reviewee: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStatus {
  hasReviewed: boolean;
  reviewId?: string;
}

export interface CreateReviewPayload {
  agreementId: string;
  rating: number;
  comment?: string;
}
