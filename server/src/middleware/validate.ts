import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodType } from 'zod';

type RequestSource = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodType<T>, source: RequestSource = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(result.error);
      return;
    }

    req[source] = result.data;
    next();
  };
}
