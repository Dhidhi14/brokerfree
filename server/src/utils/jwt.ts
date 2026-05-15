import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

const accessSignOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'],
};

const refreshSignOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions['expiresIn'],
};

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, accessSignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, refreshSignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    return payload;
  } catch {
    throw new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    return payload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
  }
}
