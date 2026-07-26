import type { Request, Response } from 'express';
import * as adminStatsService from '@/services/admin-stats.service';

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const stats = await adminStatsService.getDashboardStats();

  res.status(200).json({
    success: true,
    data: { stats },
  });
}
