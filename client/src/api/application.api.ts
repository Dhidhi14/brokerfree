import { apiGet, apiPatch, apiPost } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  Application,
  CreateApplicationPayload,
  ReceivedApplicationsFilters,
  RespondApplicationPayload,
} from '@/types/application.types';

export interface ApplicationData {
  application: Application;
}

export interface ApplicationsData {
  applications: Application[];
}

function buildQueryParams(filters: ReceivedApplicationsFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function createApplication(
  data: CreateApplicationPayload
): Promise<ApiResponse<ApplicationData>> {
  return apiPost<ApplicationData>('/applications', data);
}

export function getMyApplications(): Promise<ApiResponse<ApplicationsData>> {
  return apiGet<ApplicationsData>('/applications/my-applications');
}

export function getReceivedApplications(
  filters: ReceivedApplicationsFilters = {}
): Promise<ApiResponse<ApplicationsData>> {
  return apiGet<ApplicationsData>(`/applications/received${buildQueryParams(filters)}`);
}

export function getApplication(id: string): Promise<ApiResponse<ApplicationData>> {
  return apiGet<ApplicationData>(`/applications/${id}`);
}

export function respondToApplication(
  id: string,
  decision: RespondApplicationPayload['decision'],
  ownerResponse?: string
): Promise<ApiResponse<ApplicationData>> {
  const body: RespondApplicationPayload = { decision };
  if (ownerResponse?.trim()) {
    body.ownerResponse = ownerResponse.trim();
  }
  return apiPatch<ApplicationData>(`/applications/${id}/respond`, body);
}

export function withdrawApplication(id: string): Promise<ApiResponse<ApplicationData>> {
  return apiPatch<ApplicationData>(`/applications/${id}/withdraw`);
}
