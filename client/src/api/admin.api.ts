import { apiGet } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';

export interface DashboardStats {
  users: {
    total: number;
    tenants: number;
    owners: number;
    admins: number;
  };
  properties: {
    total: number;
    live: number;
    pendingVerification: number;
    inactive: number;
  };
  kyc: {
    pendingCount: number;
  };
  applications: {
    total: number;
    pending: number;
  };
  escrow: {
    heldCount: number;
    heldTotalAmount: number;
    disputedCount: number;
  };
  agreements: {
    total: number;
    executed: number;
  };
  reviews: {
    total: number;
    averagePlatformRating: number;
  };
}

export interface AdminStatsData {
  stats: DashboardStats;
}

export function getAdminStats(): Promise<ApiResponse<AdminStatsData>> {
  return apiGet<AdminStatsData>('/admin/stats');
}
