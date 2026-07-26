import { z } from 'zod';
import {
  PHOTO_LOCK_MAX_PHOTOS,
  PROPERTY_AREAS,
} from '@/constants/photo-lock.constants';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const photoLockAgreementParamsSchema = z.object({
  agreementId: objectIdSchema,
});

export type PhotoLockAgreementParams = z.infer<typeof photoLockAgreementParamsSchema>;

/**
 * Multipart companion to uploaded files: JSON string array of areas,
 * index-aligned with the `photos` file list.
 */
export const submitPhotoLockSchema = z.object({
  areas: z.preprocess((value) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return value;
      }
    }
    return value;
  }, z.array(z.enum(PROPERTY_AREAS)).min(1).max(PHOTO_LOCK_MAX_PHOTOS)),
});

export type SubmitPhotoLockInput = z.infer<typeof submitPhotoLockSchema>;
