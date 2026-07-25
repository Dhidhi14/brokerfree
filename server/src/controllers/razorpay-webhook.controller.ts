import type { Request, Response } from 'express';
import {
  handlePaymentCapturedWebhook,
  verifyWebhookSignature,
} from '@/services/escrow.service';
import { AppError } from '@/utils/app-error';
import { logger } from '@/utils/logger';

/**
 * POST /api/escrow/webhook
 *
 * In production this URL would be registered in the Razorpay dashboard.
 * For local dev/testing we rely primarily on verifyAndCapturePayment from
 * the frontend after Checkout succeeds — this handler is a defensive backup
 * if that direct verify call fails or is skipped.
 */
export async function handleRazorpayWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const signature = req.headers['x-razorpay-signature'];

  if (typeof signature !== 'string' || !signature) {
    throw new AppError('Missing webhook signature', 400, 'MISSING_SIGNATURE');
  }

  const rawBody = req.rawBody;

  if (!rawBody) {
    throw new AppError('Missing raw request body', 400, 'MISSING_RAW_BODY');
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new AppError('Invalid webhook signature', 400, 'INVALID_SIGNATURE');
  }

  try {
    const result = await handlePaymentCapturedWebhook(
      req.body as {
        event?: string;
        payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
      }
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Webhook processing failed', { error });
    // Still acknowledge so Razorpay does not retry endlessly on app bugs
    res.status(200).json({
      success: true,
      data: { processed: false },
    });
  }
}
