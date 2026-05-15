import { OTP_EXPIRY_MS } from '@/constants/auth.constants';
import { AppError } from '@/utils/app-error';

interface OtpEntry {
  otp: string;
  expiresAt: Date;
}

const otpStore = new Map<string, OtpEntry>();

function generateSixDigitOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateOtp(phone: string): void {
  const otp = generateSixDigitOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  otpStore.set(phone, { otp, expiresAt });

  // Demo: log OTP to console for local testing without SMS provider
  console.log(`[OTP] phone=${phone} otp=${otp} expiresAt=${expiresAt.toISOString()}`);
}

export function verifyOtp(phone: string, otp: string): void {
  const entry = otpStore.get(phone);

  if (!entry) {
    throw new AppError('OTP not found or expired', 400, 'INVALID_OTP');
  }

  if (entry.expiresAt < new Date()) {
    otpStore.delete(phone);
    throw new AppError('OTP not found or expired', 400, 'INVALID_OTP');
  }

  if (entry.otp !== otp) {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  otpStore.delete(phone);
}
