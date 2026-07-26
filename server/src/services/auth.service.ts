import { User, type UserDocument } from '@/models/user.model';
import * as otpService from '@/services/otp.service';
import { AppError } from '@/utils/app-error';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  SendOtpInput,
  UpdateProfileInput,
  UpdateRoleInput,
  VerifyOtpInput,
} from '@/validators/auth.validator';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: UserDocument;
  accessToken: string;
  refreshToken: string;
}

function issueTokens(user: UserDocument): AuthTokens {
  const userId = user._id.toString();
  return {
    accessToken: signAccessToken(userId, user.role),
    refreshToken: signRefreshToken(userId),
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
}

export async function register(data: RegisterInput): Promise<AuthResult> {
  const email = data.email.toLowerCase();

  const existing = await User.findOne({
    $or: [{ email }, { phone: data.phone }],
  });

  if (existing) {
    throw new AppError('Email or phone already registered', 409, 'USER_EXISTS');
  }

  try {
    const user = new User({
      email,
      phone: data.phone,
      fullName: data.fullName,
      role: data.role,
      password: data.password,
    });

    await user.save();

    const tokens = issueTokens(user);
    return { user, ...tokens };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError('Email or phone already registered', 409, 'USER_EXISTS');
    }
    throw error;
  }
}

export async function login(data: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isValid = await user.comparePassword(data.password);

  if (!isValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const tokens = issueTokens(user);
  return { user, ...tokens };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await User.findById(payload.userId);

  if (!user) {
    throw new AppError('User not found', 401, 'INVALID_TOKEN');
  }

  return issueTokens(user);
}

export async function sendOtp(data: SendOtpInput): Promise<void> {
  const user = await User.findOne({ phone: data.phone });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  otpService.generateOtp(data.phone);
}

export async function verifyOtp(data: VerifyOtpInput): Promise<UserDocument> {
  otpService.verifyOtp(data.phone, data.otp);

  const user = await User.findOne({ phone: data.phone });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  user.isPhoneVerified = true;
  await user.save();

  return user;
}

export async function getMe(userId: string): Promise<UserDocument> {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
}

export async function updateRole(
  userId: string,
  data: UpdateRoleInput
): Promise<AuthResult> {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.role === 'admin') {
    throw new AppError('Admin role cannot be changed', 403, 'FORBIDDEN');
  }

  if (!['tenant', 'owner'].includes(user.role)) {
    throw new AppError('Role cannot be changed', 403, 'FORBIDDEN');
  }

  if (user.role !== data.role) {
    user.role = data.role;
    await user.save();
  }

  const tokens = issueTokens(user);
  return { user, ...tokens };
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput
): Promise<UserDocument> {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  user.fullName = data.fullName;
  await user.save();

  return user;
}

export async function changePassword(
  userId: string,
  data: ChangePasswordInput
): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash');

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const isValid = await user.comparePassword(data.currentPassword);

  if (!isValid) {
    throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
  }

  // Set virtual password field so pre-validate hook rehashes via save()
  user.password = data.newPassword;
  await user.save();
}
