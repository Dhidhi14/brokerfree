import { z } from 'zod';

const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Phone must be exactly 10 digits');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: phoneSchema,
  password: passwordSchema,
  fullName: z.string().min(1, 'Full name is required').trim(),
  role: z.enum(['tenant', 'owner', 'admin']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(['tenant', 'owner']),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
