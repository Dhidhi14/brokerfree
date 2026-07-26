import { z } from 'zod';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const createReviewSchema = z.object({
  agreementId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
