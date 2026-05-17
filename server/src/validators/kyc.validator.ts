import { z } from 'zod';

const aadhaarNumberSchema = z
  .string()
  .regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits');

const panNumberSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, 'Invalid PAN format (e.g. ABCDE1234F)');

export const submitKycSchema = z.object({
  aadhaarNumber: aadhaarNumberSchema,
  panNumber: panNumberSchema,
});

export const reviewKycSchema = z
  .object({
    decision: z.enum(['approve', 'reject']),
    rejectionReason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'reject' && !data.rejectionReason?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Rejection reason is required when rejecting',
        path: ['rejectionReason'],
      });
    }
  });

export type SubmitKycInput = z.infer<typeof submitKycSchema>;
export type ReviewKycInput = z.infer<typeof reviewKycSchema>;
