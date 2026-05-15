import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '@/config/env';
import { AppError } from '@/utils/app-error';
import { logger } from '@/utils/logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    logger.warn(err.message, { errorCode: err.errorCode, statusCode: err.statusCode });
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.flatten(),
      },
    });
    return;
  }

  logger.error('Unhandled error', { err });

  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : (err as Error).message;

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
};
