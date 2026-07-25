import { z } from 'zod';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const createAgreementSchema = z.object({
  applicationId: objectIdSchema,
});

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;
