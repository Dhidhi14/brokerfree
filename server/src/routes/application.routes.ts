import { Router } from 'express';
import * as applicationController from '@/controllers/application.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import {
  createApplicationSchema,
  receivedApplicationsQuerySchema,
  respondApplicationSchema,
} from '@/validators/application.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('tenant'),
  validate(createApplicationSchema),
  asyncHandler(applicationController.createApplication)
);

router.get(
  '/my-applications',
  authenticate,
  authorize('tenant'),
  asyncHandler(applicationController.getMyApplications)
);

router.get(
  '/received',
  authenticate,
  authorize('owner'),
  validate(receivedApplicationsQuerySchema, 'query'),
  asyncHandler(applicationController.getReceivedApplications)
);

router.get(
  '/:id',
  authenticate,
  authorize('tenant', 'owner'),
  asyncHandler(applicationController.getApplication)
);

router.patch(
  '/:id/respond',
  authenticate,
  authorize('owner'),
  validate(respondApplicationSchema),
  asyncHandler(applicationController.respondToApplication)
);

router.patch(
  '/:id/withdraw',
  authenticate,
  authorize('tenant'),
  asyncHandler(applicationController.withdrawApplication)
);

export { router as applicationRoutes };
