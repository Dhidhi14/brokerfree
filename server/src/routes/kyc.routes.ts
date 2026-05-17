import { Router } from 'express';
import * as kycController from '@/controllers/kyc.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { handleKycUpload } from '@/middleware/upload';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { reviewKycSchema, submitKycSchema } from '@/validators/kyc.validator';

const router = Router();

router.post(
  '/submit',
  authenticate,
  authorize('owner'),
  handleKycUpload,
  validate(submitKycSchema),
  asyncHandler(kycController.submitKyc)
);

router.get('/status', authenticate, asyncHandler(kycController.getMyKycStatus));

router.get(
  '/pending',
  authenticate,
  authorize('admin'),
  asyncHandler(kycController.listPendingKyc)
);

router.patch(
  '/review/:userId',
  authenticate,
  authorize('admin'),
  validate(reviewKycSchema),
  asyncHandler(kycController.reviewKyc)
);

export { router as kycRoutes };
