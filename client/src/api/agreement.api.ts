import { apiGet, apiPatch, apiPost } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type { Agreement, CreateAgreementPayload } from '@/types/agreement.types';

export interface AgreementData {
  agreement: Agreement;
}

export interface AgreementsData {
  agreements: Agreement[];
}

export function createAgreement(
  applicationId: string
): Promise<ApiResponse<AgreementData>> {
  const body: CreateAgreementPayload = { applicationId };
  return apiPost<AgreementData>('/agreements', body);
}

export function getMyAgreements(): Promise<ApiResponse<AgreementsData>> {
  return apiGet<AgreementsData>('/agreements/my-agreements');
}

export function getAgreement(id: string): Promise<ApiResponse<AgreementData>> {
  return apiGet<AgreementData>(`/agreements/${id}`);
}

export function signAgreement(id: string): Promise<ApiResponse<AgreementData>> {
  return apiPatch<AgreementData>(`/agreements/${id}/sign`);
}
