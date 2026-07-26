import { Router } from 'express';
import * as adminController from '@/controllers/admin.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { asyncHandler } from '@/utils/async-handler';

const router = Router();

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  asyncHandler(adminController.getDashboardStats)
);

export { router as adminRoutes };
