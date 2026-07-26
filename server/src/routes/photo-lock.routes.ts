import { Router } from 'express';
import * as photoLockController from '@/controllers/photo-lock.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { handlePhotoLockUpload } from '@/middleware/upload';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import {
  photoLockAgreementParamsSchema,
  submitPhotoLockSchema,
} from '@/validators/photo-lock.validator';

const router = Router();

router.get(
  '/:agreementId',
  authenticate,
  authorize('tenant', 'owner', 'admin'),
  validate(photoLockAgreementParamsSchema, 'params'),
  asyncHandler(photoLockController.getPhotoLock)
);

router.post(
  '/:agreementId/move-in',
  authenticate,
  authorize('tenant'),
  validate(photoLockAgreementParamsSchema, 'params'),
  handlePhotoLockUpload,
  validate(submitPhotoLockSchema),
  asyncHandler(photoLockController.submitMoveIn)
);

router.post(
  '/:agreementId/move-out',
  authenticate,
  authorize('tenant'),
  validate(photoLockAgreementParamsSchema, 'params'),
  handlePhotoLockUpload,
  validate(submitPhotoLockSchema),
  asyncHandler(photoLockController.submitMoveOut)
);

export { router as photoLockRoutes };
