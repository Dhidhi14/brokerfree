import { Loader2 } from 'lucide-react';
import { StarRating } from '@/components/review/star-rating';
import { useUserReviewsQuery } from '@/hooks/use-reviews';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import type { Review, ReviewReviewerSummary } from '@/types/review.types';

interface ReviewListProps {
  userId: string;
  className?: string;
}

function getReviewerName(reviewer: Review['reviewer']): string {
  if (typeof reviewer === 'string') return 'Anonymous';
  return (reviewer as ReviewReviewerSummary).fullName;
}

export function ReviewList({ userId, className }: ReviewListProps) {
  const { data: reviews, isLoading, isError, error } = useUserReviewsQuery(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading reviews" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-4 text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load reviews')}
      </p>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">No reviews yet</p>
    );
  }

  return (
    <ul className={cn('space-y-4', className)}>
      {reviews.map((review) => (
        <li
          key={review._id}
          className="rounded-lg border border-border/70 bg-background/80 px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{getReviewerName(review.reviewer)}</p>
              <StarRating value={review.rating} size="sm" className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
          </div>
          {review.comment ? (
            <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
