import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@/models/user.model';
import { AppError } from '@/utils/app-error';
import { verifyAccessToken } from '@/utils/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    return;
  }

  const token = authHeader.slice(7);

  if (!token) {
    next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    return;
  }

  const payload = verifyAccessToken(token);

  req.user = {
    id: payload.userId,
    role: payload.role as UserRole,
  };

  next();
}

/**
 * Sets req.user when a valid Bearer token is present; anonymous otherwise.
 * Never rejects — invalid/missing tokens are treated as unauthenticated.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role as UserRole,
    };
  } catch {
    // Treat invalid/expired tokens as anonymous for public routes
  }

  next();
}
