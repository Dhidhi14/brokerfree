import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@/models/user.model';
import { AppError } from '@/utils/app-error';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
}
