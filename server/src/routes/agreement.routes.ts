import { Router } from 'express';
import * as agreementController from '@/controllers/agreement.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import { createAgreementSchema } from '@/validators/agreement.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('tenant', 'owner'),
  validate(createAgreementSchema),
  asyncHandler(agreementController.createAgreement)
);

router.get(
  '/my-agreements',
  authenticate,
  authorize('tenant', 'owner'),
  asyncHandler(agreementController.getMyAgreements)
);

router.get(
  '/:id',
  authenticate,
  authorize('tenant', 'owner'),
  asyncHandler(agreementController.getAgreement)
);

router.patch(
  '/:id/sign',
  authenticate,
  authorize('tenant', 'owner'),
  asyncHandler(agreementController.signAgreement)
);

export { router as agreementRoutes };
