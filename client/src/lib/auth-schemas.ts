import { z } from 'zod';

const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Phone must be exactly 10 digits');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerAccountSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').trim(),
    email: z.string().email('Invalid email address'),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export type RegisterAccountValues = z.infer<typeof registerAccountSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
