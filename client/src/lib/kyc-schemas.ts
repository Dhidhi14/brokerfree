import { z } from 'zod';

export const kycSubmitSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
});

export type KycSubmitValues = z.infer<typeof kycSubmitSchema>;
