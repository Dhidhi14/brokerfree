import type { CookieOptions, Request, Response } from 'express';
import { env } from '@/config/env';
import { REFRESH_COOKIE_MAX_AGE_MS, REFRESH_TOKEN_COOKIE } from '@/constants/auth.constants';
import * as authService from '@/services/auth.service';
import { AppError } from '@/utils/app-error';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  path: '/api/auth',
};

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);

  setRefreshCookie(res, result.refreshToken);

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);

  setRefreshCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearRefreshCookie(res);

  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}

export async function sendOtp(req: Request, res: Response): Promise<void> {
  await authService.sendOtp(req.body);

  res.status(200).json({
    success: true,
    data: { message: 'OTP sent successfully' },
  });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const user = await authService.verifyOtp(req.body);

  res.status(200).json({
    success: true,
    data: { user },
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const token = req.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;

  if (!token) {
    throw new AppError('Refresh token not found', 401, 'UNAUTHORIZED');
  }

  const tokens = await authService.refreshTokens(token);

  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
    },
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  const result = await authService.updateRole(req.user!.id, req.body);

  setRefreshCookie(res, result.refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
}
