import { Router } from 'express';
import * as escrowController from '@/controllers/escrow.controller';
import * as razorpayWebhookController from '@/controllers/razorpay-webhook.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import {
  createOrderSchema,
  disputeSchema,
  releaseRefundSchema,
  verifyPaymentSchema,
} from '@/validators/escrow.validator';

const router = Router();

// No auth middleware — Razorpay calls this; verify via webhook signature
router.post(
  '/webhook',
  asyncHandler(razorpayWebhookController.handleRazorpayWebhook)
);

router.post(
  '/orders',
  authenticate,
  authorize('tenant'),
  validate(createOrderSchema),
  asyncHandler(escrowController.createOrder)
);

router.post(
  '/verify',
  authenticate,
  authorize('tenant'),
  validate(verifyPaymentSchema),
  asyncHandler(escrowController.verifyPayment)
);

router.get(
  '/my-escrows',
  authenticate,
  asyncHandler(escrowController.getMyEscrows)
);

router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  asyncHandler(escrowController.getAdminEscrows)
);

router.get(
  '/:id',
  authenticate,
  authorize('tenant', 'owner', 'admin'),
  asyncHandler(escrowController.getEscrow)
);

router.patch(
  '/:id/release',
  authenticate,
  authorize('admin'),
  validate(releaseRefundSchema),
  asyncHandler(escrowController.releaseEscrow)
);

router.patch(
  '/:id/refund',
  authenticate,
  authorize('admin'),
  validate(releaseRefundSchema),
  asyncHandler(escrowController.refundEscrow)
);

router.patch(
  '/:id/dispute',
  authenticate,
  authorize('tenant', 'owner'),
  validate(disputeSchema),
  asyncHandler(escrowController.disputeEscrow)
);

export { router as escrowRoutes };
