import { Router } from 'express';
import * as authController from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/authenticate';
import { authLimiter } from '@/middleware/rate-limit';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  sendOtpSchema,
  updateProfileSchema,
  updateRoleSchema,
  verifyOtpSchema,
} from '@/validators/auth.validator';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register)
);
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.post('/send-otp', validate(sendOtpSchema), asyncHandler(authController.sendOtp));
router.post('/verify-otp', validate(verifyOtpSchema), asyncHandler(authController.verifyOtp));
router.post('/refresh-token', asyncHandler(authController.refreshToken));
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.patch(
  '/role',
  authenticate,
  validate(updateRoleSchema),
  asyncHandler(authController.updateRole)
);
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile)
);
router.patch(
  '/password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

export { router as authRoutes };
