import { z } from 'zod';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const createOrderSchema = z.object({
  agreementId: objectIdSchema,
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});

export const disputeSchema = z.object({
  note: z.string().trim().min(10, 'Note must be at least 10 characters'),
});

export const releaseRefundSchema = z
  .object({
    note: z.string().trim().min(1).optional(),
  })
  .default({});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type DisputeInput = z.infer<typeof disputeSchema>;
export type ReleaseRefundInput = z.infer<typeof releaseRefundSchema>;
