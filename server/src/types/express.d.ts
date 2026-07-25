import type { UserRole } from '@/models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
      validatedQuery?: unknown;
      validatedParams?: unknown;
      /** Raw JSON body string for Razorpay webhook HMAC verification */
      rawBody?: string;
    }
  }
}

export {};
