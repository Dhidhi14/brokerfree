import { z } from 'zod';

function startOfTomorrow(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date;
}

export const applyApplicationSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must be at most 500 characters'),
  moveInDate: z
    .string()
    .min(1, 'Move-in date is required')
    .refine((value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date.getTime() >= startOfTomorrow().getTime();
    }, 'Move-in date must be a future date'),
  // Use z.number() (not coerce) so RHF input/output types stay aligned with zodResolver
  occupants: z.number().int().min(1, 'At least one occupant is required'),
});

export type ApplyApplicationValues = z.infer<typeof applyApplicationSchema>;

export const rejectApplicationSchema = z.object({
  ownerResponse: z
    .string()
    .trim()
    .max(500, 'Response must be at most 500 characters')
    .optional(),
});

export type RejectApplicationValues = z.infer<typeof rejectApplicationSchema>;

export function getMinMoveInDateInput(): string {
  return startOfTomorrow().toISOString().slice(0, 10);
}
