import mongoose from 'mongoose';
import { Agreement, type AgreementDocument } from '@/models/agreement.model';
import { Review, type IReview } from '@/models/review.model';
import { User } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import type { CreateReviewInput } from '@/validators/review.validator';

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
}

function refIdToString(value: unknown): string {
  if (value !== null && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function assertParticipant(
  agreement: { tenant: unknown; owner: unknown },
  userId: string
): { isTenant: boolean; isOwner: boolean } {
  const isTenant = refIdToString(agreement.tenant) === userId;
  const isOwner = refIdToString(agreement.owner) === userId;

  if (!isTenant && !isOwner) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  return { isTenant, isOwner };
}

async function findAgreementOrThrow(agreementId: string): Promise<AgreementDocument> {
  if (!mongoose.isValidObjectId(agreementId)) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  const agreement = await Agreement.findById(agreementId);

  if (!agreement) {
    throw new AppError('Agreement not found', 404, 'AGREEMENT_NOT_FOUND');
  }

  return agreement;
}

interface RatingAggregateResult {
  _id: mongoose.Types.ObjectId;
  average: number;
  count: number;
}

/**
 * Recalculates User.rating from all reviews where the user is reviewee.
 */
async function recalculateUserRating(revieweeId: mongoose.Types.ObjectId): Promise<void> {
  const [result] = await Review.aggregate<RatingAggregateResult>([
    { $match: { reviewee: revieweeId } },
    {
      $group: {
        _id: '$reviewee',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const average = result ? Math.round(result.average * 10) / 10 : 0;
  const count = result?.count ?? 0;

  await User.findByIdAndUpdate(revieweeId, {
    rating: { average, count },
  });
}

/**
 * Creates a bi-directional review for an executed agreement and updates reviewee rating.
 */
export async function createReview(
  reviewerId: string,
  input: CreateReviewInput
): Promise<IReview> {
  const { agreementId, rating, comment } = input;

  const agreement = await findAgreementOrThrow(agreementId);

  if (agreement.status !== 'executed') {
    throw new AppError(
      'Reviews are only allowed on executed agreements',
      400,
      'AGREEMENT_NOT_EXECUTED'
    );
  }

  const { isTenant } = assertParticipant(agreement, reviewerId);
  const revieweeId = isTenant ? agreement.owner : agreement.tenant;

  try {
    const review = await Review.create({
      agreement: agreement._id,
      reviewer: new mongoose.Types.ObjectId(reviewerId),
      reviewee: revieweeId,
      rating,
      comment,
    });

    await recalculateUserRating(revieweeId);

    return review.toObject();
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        'You have already reviewed this agreement',
        409,
        'ALREADY_REVIEWED'
      );
    }
    throw error;
  }
}

/**
 * Returns all reviews received by a user, newest first.
 */
export async function getReviewsForUser(userId: string): Promise<IReview[]> {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const reviews = await Review.find({ reviewee: userId })
    .populate({
      path: 'reviewer',
      select: 'fullName',
    })
    .sort({ createdAt: -1 })
    .lean();

  return reviews as unknown as IReview[];
}

export interface MyReviewStatus {
  hasReviewed: boolean;
  reviewId?: string;
}

/**
 * Whether the current user has already reviewed this agreement.
 */
export async function getMyReviewStatus(
  userId: string,
  agreementId: string
): Promise<MyReviewStatus> {
  const agreement = await findAgreementOrThrow(agreementId);
  assertParticipant(agreement, userId);

  const existing = await Review.findOne({
    agreement: agreementId,
    reviewer: userId,
  })
    .select('_id')
    .lean();

  if (!existing) {
    return { hasReviewed: false };
  }

  return {
    hasReviewed: true,
    reviewId: String(existing._id),
  };
}
