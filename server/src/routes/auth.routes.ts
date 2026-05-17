import { Router } from 'express';
import * as authController from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import {
  loginSchema,
  registerSchema,
  sendOtpSchema,
  updateRoleSchema,
  verifyOtpSchema,
} from '@/validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
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

export { router as authRoutes };
