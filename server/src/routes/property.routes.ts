import { Router } from 'express';
import * as propertyController from '@/controllers/property.controller';
import * as videoVerificationController from '@/controllers/video-verification.controller';
import { authenticate, optionalAuthenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { handlePropertyPhotoUpload, handleVideoUpload } from '@/middleware/upload';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import {
  nearbySchema,
  reviewPropertySchema,
  searchPropertySchema,
  updatePropertySchema,
} from '@/validators/property.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('owner'),
  handlePropertyPhotoUpload,
  asyncHandler(propertyController.createProperty)
);

router.get(
  '/',
  validate(searchPropertySchema, 'query'),
  asyncHandler(propertyController.listProperties)
);

router.get(
  '/near',
  validate(nearbySchema, 'query'),
  asyncHandler(propertyController.searchNearby)
);

router.get(
  '/my-properties',
  authenticate,
  authorize('owner'),
  asyncHandler(propertyController.getMyProperties)
);

router.get(
  '/pending/review',
  authenticate,
  authorize('admin'),
  asyncHandler(propertyController.listPendingProperties)
);

router.patch(
  '/:id/review',
  authenticate,
  authorize('admin'),
  validate(reviewPropertySchema),
  asyncHandler(propertyController.reviewProperty)
);

router.get(
  '/:id',
  optionalAuthenticate,
  asyncHandler(propertyController.getProperty)
);

router.post(
  '/:id/video-tour',
  authenticate,
  authorize('owner'),
  handleVideoUpload,
  asyncHandler(videoVerificationController.submitVideo)
);

router.get(
  '/:id/video-status',
  authenticate,
  authorize('owner', 'admin'),
  asyncHandler(videoVerificationController.getVideoStatus)
);

router.patch(
  '/:id',
  authenticate,
  authorize('owner'),
  validate(updatePropertySchema),
  asyncHandler(propertyController.updateProperty)
);

router.delete(
  '/:id',
  authenticate,
  authorize('owner'),
  asyncHandler(propertyController.deleteProperty)
);

export { router as propertyRoutes };
