import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { StarRating } from '@/components/review/star-rating';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReviewMutation } from '@/hooks/use-reviews';
import { getApiErrorMessage } from '@/lib/api-error';

const COMMENT_MAX = 500;

interface ReviewFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  revieweeName: string;
}

export function ReviewFormDialog({
  open,
  onOpenChange,
  agreementId,
  revieweeName,
}: ReviewFormDialogProps) {
  const createMutation = useCreateReviewMutation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setRating(0);
      setComment('');
      setRatingError(null);
    }
  }, [open]);

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      setRatingError('Please select a star rating');
      return;
    }

    setRatingError(null);

    const trimmed = comment.trim();
    createMutation.mutate(
      {
        agreementId,
        rating,
        ...(trimmed ? { comment: trimmed } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Review submitted. Thank you!');
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, 'Failed to submit review'));
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!createMutation.isPending) {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a review</DialogTitle>
          <DialogDescription>
            How was your experience with {revieweeName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Rating</p>
            <StarRating
              value={rating}
              onChange={(next) => {
                setRating(next);
                setRatingError(null);
              }}
              size="lg"
            />
            {ratingError ? (
              <p className="text-sm text-destructive">{ratingError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="review-comment" className="text-sm font-medium">
              Comment <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value.slice(0, COMMENT_MAX))}
              placeholder="Share details that could help others…"
              rows={4}
              maxLength={COMMENT_MAX}
              disabled={createMutation.isPending}
            />
            <p className="text-right text-xs text-muted-foreground">
              {comment.length}/{COMMENT_MAX}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="brand-gradient text-primary-foreground hover:opacity-90"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
