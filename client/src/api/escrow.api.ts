import { apiGet, apiPatch, apiPost } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  Escrow,
  EscrowOrder,
  VerifyPaymentPayload,
} from '@/types/escrow.types';

export interface EscrowOrderData {
  order: EscrowOrder;
}

export interface EscrowData {
  escrow: Escrow;
}

export interface EscrowsData {
  escrows: Escrow[];
}

export function createEscrowOrder(
  agreementId: string
): Promise<ApiResponse<EscrowOrderData>> {
  return apiPost<EscrowOrderData>('/escrow/orders', { agreementId });
}

export function verifyPayment(
  data: VerifyPaymentPayload
): Promise<ApiResponse<EscrowData>> {
  return apiPost<EscrowData>('/escrow/verify', data);
}

export function getMyEscrows(): Promise<ApiResponse<EscrowsData>> {
  return apiGet<EscrowsData>('/escrow/my-escrows');
}

export function getEscrow(id: string): Promise<ApiResponse<EscrowData>> {
  return apiGet<EscrowData>(`/escrow/${id}`);
}

export function getAdminEscrows(): Promise<ApiResponse<EscrowsData>> {
  return apiGet<EscrowsData>('/escrow/admin');
}

export function releaseEscrow(
  id: string,
  note?: string
): Promise<ApiResponse<EscrowData>> {
  return apiPatch<EscrowData>(`/escrow/${id}/release`, note ? { note } : {});
}

export function refundEscrow(
  id: string,
  note?: string
): Promise<ApiResponse<EscrowData>> {
  return apiPatch<EscrowData>(`/escrow/${id}/refund`, note ? { note } : {});
}

export function disputeEscrow(
  id: string,
  note: string
): Promise<ApiResponse<EscrowData>> {
  return apiPatch<EscrowData>(`/escrow/${id}/dispute`, { note });
}
