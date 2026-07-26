import { Router } from 'express';
import * as reviewController from '@/controllers/review.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { createReviewSchema } from '@/validators/review.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('tenant', 'owner'),
  validate(createReviewSchema),
  asyncHandler(reviewController.createReview)
);

router.get(
  '/user/:userId',
  asyncHandler(reviewController.getReviewsForUser)
);

router.get(
  '/agreement/:agreementId/status',
  authenticate,
  authorize('tenant', 'owner'),
  asyncHandler(reviewController.getMyReviewStatus)
);

export { router as reviewRoutes };
