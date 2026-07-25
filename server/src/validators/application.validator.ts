import { z } from 'zod';
import {
  APPLICATION_MESSAGE_MAX_LENGTH,
  APPLICATION_MESSAGE_MIN_LENGTH,
  APPLICATION_STATUSES,
} from '@/constants/application.constants';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const createApplicationSchema = z.object({
  propertyId: objectIdSchema,
  message: z
    .string()
    .trim()
    .min(APPLICATION_MESSAGE_MIN_LENGTH, `Message must be at least ${APPLICATION_MESSAGE_MIN_LENGTH} characters`)
    .max(APPLICATION_MESSAGE_MAX_LENGTH, `Message must be at most ${APPLICATION_MESSAGE_MAX_LENGTH} characters`),
  moveInDate: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: 'Move-in date must be in the future',
  }),
  occupants: z.coerce.number().int().min(1, 'At least one occupant is required'),
});

export const respondApplicationSchema = z.object({
  decision: z.enum(['accept', 'reject']),
  ownerResponse: z
    .string()
    .trim()
    .max(APPLICATION_MESSAGE_MAX_LENGTH)
    .optional(),
});

export const receivedApplicationsQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  propertyId: objectIdSchema.optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type RespondApplicationInput = z.infer<typeof respondApplicationSchema>;
export type ReceivedApplicationsQuery = z.infer<typeof receivedApplicationsQuerySchema>;
