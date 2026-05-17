import { apiClient, apiGet, apiPatch } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type { PendingKycOwner, UserKyc } from '@/types/kyc.types';

export interface KycStatusData {
  kyc: UserKyc;
}

export interface PendingKycData {
  pending: PendingKycOwner[];
}

export interface ReviewKycPayload {
  decision: 'approve' | 'reject';
  rejectionReason?: string;
}

export function getKycStatus(): Promise<ApiResponse<KycStatusData>> {
  return apiGet<KycStatusData>('/kyc/status');
}

export function getPendingKyc(): Promise<ApiResponse<PendingKycData>> {
  return apiGet<PendingKycData>('/kyc/pending');
}

export async function submitKyc(formData: FormData): Promise<ApiResponse<KycStatusData>> {
  const response = await apiClient.post<ApiResponse<KycStatusData>>('/kyc/submit', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
}

export function reviewKyc(
  userId: string,
  decision: 'approve' | 'reject',
  rejectionReason?: string
): Promise<ApiResponse<KycStatusData>> {
  const body: ReviewKycPayload = { decision };
  if (decision === 'reject' && rejectionReason) {
    body.rejectionReason = rejectionReason;
  }
  return apiPatch<KycStatusData>(`/kyc/review/${userId}`, body);
}
